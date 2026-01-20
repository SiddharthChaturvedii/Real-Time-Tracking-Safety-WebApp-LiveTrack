"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { socket } from "@/lib/socket";
import "leaflet/dist/leaflet.css";

interface LocationPayload {
  id: string;
  username: string;
  latitude: number;
  longitude: number;
}

interface Props {
  username: string;
  inParty: boolean;
}

export default function LiveMap({ username, inParty }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const markers = useRef<Record<string, L.Marker>>({});
  const centered = useRef(false);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    mapRef.current = L.map(mapEl.current).setView([20, 0], 3);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      mapRef.current
    );

    const watchId = navigator.geolocation.watchPosition((pos) => {
      if (!mapRef.current) return;

      const { latitude, longitude } = pos.coords;

      if (!centered.current) {
        centered.current = true;
        mapRef.current.setView([latitude, longitude], 16);
      }

      updateMarker(socket.id!, username, latitude, longitude);

      // 🚨 ONLY SEND IF IN PARTY
      if (inParty) {
        socket.emit("send-location", {
          latitude,
          longitude,
          username,
        });
      }
    });

    socket.on("receive-location", (d: LocationPayload) => {
      updateMarker(d.id, d.username, d.latitude, d.longitude);
    });

    socket.on("user-disconnected", (id: string) => {
      markers.current[id]?.remove();
      delete markers.current[id];
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("receive-location");
      socket.off("user-disconnected");
    };
  }, [inParty]);

  function updateMarker(
    id: string,
    name: string,
    lat: number,
    lng: number
  ) {
    if (!mapRef.current) return;

    if (!markers.current[id]) {
      markers.current[id] = L.marker([lat, lng])
        .addTo(mapRef.current)
        .bindTooltip(name);
    } else {
      markers.current[id].setLatLng([lat, lng]);
    }
  }

  return <div ref={mapEl} className="absolute inset-0" />;
}
