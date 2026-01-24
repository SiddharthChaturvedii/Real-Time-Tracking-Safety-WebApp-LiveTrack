"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { socket } from "@/lib/socket";

const iconCache: Record<string, L.Icon> = {};

interface LocationPayload {
  id: string;
  username: string;
  latitude: number;
  longitude: number;
}

function getIcon(color: string) {
  if (!iconCache[color]) {
    iconCache[color] = L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      shadowSize: [41, 41],
    });
  }
  return iconCache[color];
}

function hashColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["blue", "green", "gold", "violet", "orange"];
  return colors[Math.abs(hash) % colors.length];
}

export default function LiveMap({ username }: { username: string }) {
  const mapRef = useRef<L.Map | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const centeredRef = useRef(false);

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const map = L.map(mapElRef.current, {
      center: [20, 0],
      zoom: 3,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    /* ---------- GPS ---------- */
    const watchId = navigator.geolocation.watchPosition((pos) => {
      if (!socket.id || !mapRef.current) return;

      const { latitude, longitude } = pos.coords;

      if (!centeredRef.current) {
        centeredRef.current = true;
        mapRef.current.setView([latitude, longitude], 16);
      }

      // ✅ local self marker
      updateMarker(socket.id, username, latitude, longitude);

      // ✅ broadcast to party
      socket.emit("send-location", {
        latitude,
        longitude,
        username,
      });
    });

    /* ---------- SOCKET ---------- */
    socket.on("receive-location", (data: LocationPayload) => {
      // 🔥 THIS IS THE FIX
      if (data.id === socket.id) return;

      updateMarker(
        data.id,
        data.username,
        data.latitude,
        data.longitude
      );
    });

    socket.on("user-disconnected", (id: string) => {
      const marker = markersRef.current[id];
      if (marker && mapRef.current) {
        mapRef.current.removeLayer(marker);
        delete markersRef.current[id];
      }
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("receive-location");
      socket.off("user-disconnected");

      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [username]);

  function updateMarker(
    id: string,
    name: string,
    lat: number,
    lng: number
  ) {
    if (!mapRef.current) return;

    const icon = getIcon(hashColor(id));
    const label = id === socket.id ? `You (${name})` : name;

    if (!markersRef.current[id]) {
      markersRef.current[id] = L.marker([lat, lng], { icon })
        .addTo(mapRef.current)
        .bindTooltip(label);
    } else {
      markersRef.current[id].setLatLng([lat, lng]);
      markersRef.current[id].setTooltipContent(label);
    }
  }

  return <div ref={mapElRef} className="absolute inset-0 h-full w-full" />;
}
