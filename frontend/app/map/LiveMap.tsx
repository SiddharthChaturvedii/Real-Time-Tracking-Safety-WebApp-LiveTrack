"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { socket } from "@/lib/socket";

/* ---------------- ICON CACHE ---------------- */

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

/* deterministic offset so markers don’t overlap */
function jitterFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ((hash % 100) - 50) * 0.000002;
}

interface LiveMapProps {
  username: string;
}

export default function LiveMap({ username }: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const centeredRef = useRef(false);
  const usernameRef = useRef(username);

  /* keep latest username without rerunning map */
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  /* ---------------- INIT MAP (ONCE) ---------------- */
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

    /* ---------------- GEOLOCATION (FINAL, SAFE) ---------------- */
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!mapRef.current) return;

        const { latitude, longitude } = pos.coords;

        // 🔥 CENTER EXACTLY ONCE
        if (!centeredRef.current) {
          centeredRef.current = true;
          mapRef.current.setView([latitude, longitude], 16);
        }

        // 🔥 ALWAYS SHOW SELF MARKER (EVEN WITHOUT SOCKET)
        const selfId = socket.id ?? "__self__";

        updateMarker(
          selfId,
          usernameRef.current,
          latitude,
          longitude
        );

        // 🔥 BROADCAST ONLY IF SOCKET IS CONNECTED
        if (socket.connected) {
          socket.emit("send-location", {
            latitude,
            longitude,
            username: usernameRef.current,
          });
        }
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    /* ---------------- SOCKET EVENTS ---------------- */

    socket.on("receive-location", (data: LocationPayload) => {
      // 🚫 ignore self echo
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

    /* ---------------- CLEANUP ---------------- */
    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("receive-location");
      socket.off("user-disconnected");

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /* ---------------- MARKER ENGINE ---------------- */
  function updateMarker(
    id: string,
    name: string,
    lat: number,
    lng: number
  ) {
    if (!mapRef.current) return;

    const offset = jitterFor(id);
    const finalLat = lat + offset;
    const finalLng = lng + offset;

    const color = hashColor(id);
    const icon = getIcon(color);
    const label = id === "__self__" ? `You (${name})` : name;

    const existing = markersRef.current[id];

    if (!existing) {
      markersRef.current[id] = L.marker(
        [finalLat, finalLng],
        { icon }
      )
        .addTo(mapRef.current)
        .bindTooltip(label, { permanent: false });
    } else {
      existing.setLatLng([finalLat, finalLng]);
      existing.setTooltipContent(label);
    }
  }

  return (
    <div
      ref={mapElRef}
      className="absolute inset-0 h-full w-full"
    />
  );
}
