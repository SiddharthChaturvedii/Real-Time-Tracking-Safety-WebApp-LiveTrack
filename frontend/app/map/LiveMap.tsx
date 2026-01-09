"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { socket } from "@/lib/socket";

export default function LiveMap() {
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});
  const centered = useRef(false);

  useEffect(() => {
    if (mapRef.current) return;

    // ---------- MAP INIT ----------
    const map = L.map("map", {
      center: [20, 0],
      zoom: 3,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // ---------- CUSTOM ICON (FIXES 404 ISSUE) ----------
    const markerIcon = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      shadowSize: [41, 41],
    });

    // ---------- SELF LOCATION ----------
    if (!navigator.geolocation) return;

    navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude } = pos.coords;

      if (!centered.current) {
        centered.current = true;
        map.setView([latitude, longitude], 16);
      }

      drawMarker("self", "You", latitude, longitude);

      if (socket.connected) {
        socket.emit("send-location", { latitude, longitude });
      }
    });

    // ---------- OTHER USERS ----------
    socket.on("receive-location", (data: any) => {
      if (!data?.id) return;
      drawMarker(data.id, data.username, data.latitude, data.longitude);
    });

    socket.on("user-disconnected", (id: string) => {
      if (markers.current[id]) {
        map.removeLayer(markers.current[id]);
        delete markers.current[id];
      }
    });

    // ---------- MARKER DRAW ----------
    function drawMarker(
  id: string,
  name: string,
  lat: number,
  lng: number
) {
  if (!mapRef.current) return;

  // 🔹 jitter for non-self markers
  const jitter =
    id === "self" ? 0 : (Math.random() - 0.5) * 0.0003;

  const finalLat = lat + jitter;
  const finalLng = lng + jitter;

  if (!markers.current[id]) {
    markers.current[id] = L.marker(
      [finalLat, finalLng],
      { icon: markerIcon }
    ).addTo(map);

    markers.current[id].bindTooltip(
      id === "self" ? "You" : name,
      { permanent: false }
    );
  } else {
    markers.current[id].setLatLng([finalLat, finalLng]);
  }
}
}, []);

  return <div id="map" className="h-full w-full" />;
}
