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

export default function LiveMap({
  username,
  members
}: {
  username: string;
  members: Array<{ id: string; username: string }>;
}) {
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
    let lastEmitTime = 0;
    const watchId = navigator.geolocation.watchPosition((pos) => {
      if (!socket.id || !mapRef.current) return;

      const { latitude, longitude } = pos.coords;
      const now = Date.now();

      if (!centeredRef.current) {
        centeredRef.current = true;
        mapRef.current.setView([latitude, longitude], 16);
      }

      // ✅ local self marker (always update UI instantly)
      updateMarker(socket.id, username, latitude, longitude);

      // ✅ broadcast to party (Throttled to 2 seconds)
      if (now - lastEmitTime > 2000) {
        lastEmitTime = now;
        socket.emit("send-location", {
          latitude,
          longitude,
          username,
        });
      }
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

  // ✅ RECONCILIATION: Sync markers with the members list
  useEffect(() => {
    if (!mapRef.current) return;

    const currentMemberIds = new Set(members.map(m => m.id));
    // Add our own ID to the set so we don't delete our own marker
    if (socket.id) currentMemberIds.add(socket.id);

    Object.keys(markersRef.current).forEach(id => {
      if (!currentMemberIds.has(id)) {
        const marker = markersRef.current[id];
        mapRef.current!.removeLayer(marker);
        delete markersRef.current[id];
        console.log(`[MAP] Removed stale marker for ${id}`);
      }
    });
  }, [members]);

  function updateMarker(
    id: string,
    name: string,
    lat: number,
    lng: number
  ) {
    if (!mapRef.current) return;

    // ----- Jitter/Spiral Logic for Overlaps -----
    // Check if any other marker is at this EXACT location or very close
    let finalLat = lat;
    let finalLng = lng;
    const existingIds = Object.keys(markersRef.current);

    // Simple verification: if we find a collision, shift slightly based on ID hash
    // This isn't perfect spiderfying but solves "standing on single point"
    const isColliding = existingIds.some(existingId => {
      if (existingId === id) return false;
      const marker = markersRef.current[existingId];
      const pos = marker.getLatLng();
      const dist = Math.abs(pos.lat - lat) + Math.abs(pos.lng - lng);
      return dist < 0.00005; // ~5 meters
    });

    if (isColliding) {
      // Deterministic offset based on ID char codes
      const offset = (id.charCodeAt(0) % 5) * 0.0001;
      const angle = (id.charCodeAt(id.length - 1) % 8) * (Math.PI / 4);
      finalLat += Math.sin(angle) * (0.00015 + offset);
      finalLng += Math.cos(angle) * (0.00015 + offset);
    }

    const icon = getIcon(hashColor(id));
    const label = id === socket.id ? `You (${name})` : name;

    if (!markersRef.current[id]) {
      markersRef.current[id] = L.marker([finalLat, finalLng], { icon })
        .addTo(mapRef.current)
        .bindTooltip(label);
    } else {
      markersRef.current[id].setLatLng([finalLat, finalLng]);
      markersRef.current[id].setTooltipContent(label);
    }
  }

  return <div ref={mapElRef} className="absolute inset-0 h-full w-full" />;
}
