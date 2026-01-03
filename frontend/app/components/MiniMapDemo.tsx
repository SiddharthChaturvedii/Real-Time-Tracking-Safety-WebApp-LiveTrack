"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

const users = [
  { name: "Aarav", lat: 28.61, lng: 77.21 },
  { name: "Riya", lat: 28.62, lng: 77.23 },
  { name: "Kabir", lat: 28.60, lng: 77.22 },
  { name: "Meera", lat: 28.615, lng: 77.215 }
];

export default function MiniMapDemo() {

  useEffect(() => {
    (async () => {

      const L = (await import("leaflet")).default;   // 👈 load only in browser

      const map = L.map("demoMap", {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
      }).setView([28.61, 77.22], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
        .addTo(map);

      const markers: any[] = [];

      users.forEach((u) => {
        const marker = L.marker([u.lat, u.lng]).addTo(map);

        marker.bindTooltip(u.name, {
          permanent: true,
          direction: "top",
          offset: [0, -10],
        });

        markers.push({ marker, u });
      });

      const move = setInterval(() => {
        markers.forEach((m) => {
          const dx = (Math.random() - 0.5) * 0.001;
          const dy = (Math.random() - 0.5) * 0.001;

          m.u.lat += dx;
          m.u.lng += dy;

          m.marker.setLatLng([m.u.lat, m.u.lng]);
        });
      }, 1200);

      return () => {
        clearInterval(move);
        map.remove();
      };

    })();
  }, []);

  return (
    <div
      id="demoMap"
      style={{
        width: "100%",
        height: "320px",
        borderRadius: "18px",
        overflow: "hidden",
      }}
    />
  );
}
