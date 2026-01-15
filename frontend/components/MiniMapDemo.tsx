"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const users = [
  { name: "Aarav", lat: 28.61, lng: 77.21 },
  { name: "Riya", lat: 28.62, lng: 77.23 },
  { name: "Kabir", lat: 28.60, lng: 77.22 },
  { name: "Meera", lat: 28.615, lng: 77.215 },
];

export default function MiniMapDemo() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;

    (async () => {
      const L = (await import("leaflet")).default;

      if (!isMounted || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
      }).setView([28.61, 77.22], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

      const markers: {
        marker: any;
        user: { name: string; lat: number; lng: number };
      }[] = [];

      users.forEach((u) => {
        const marker = L.marker([u.lat, u.lng]).addTo(map);

        marker.bindTooltip(u.name, {
          permanent: true,
          direction: "top",
          offset: [0, -10],
        });

        markers.push({ marker, user: u });
      });

      intervalRef.current = setInterval(() => {
        markers.forEach((m) => {
          const dx = (Math.random() - 0.5) * 0.001;
          const dy = (Math.random() - 0.5) * 0.001;

          m.user.lat += dx;
          m.user.lng += dy;

          m.marker.setLatLng([m.user.lat, m.user.lng]);
        });
      }, 1200);

      mapRef.current = map;
    })();

    return () => {
      isMounted = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "320px",
        borderRadius: "18px",
        overflow: "hidden",
      }}
    />
  );
}
