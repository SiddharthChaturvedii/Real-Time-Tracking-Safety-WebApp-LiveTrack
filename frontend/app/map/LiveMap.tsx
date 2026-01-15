"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { socket } from "@/lib/socket";

const iconCache: Record<string, L.Icon> = {};

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

interface LiveMapProps {
  sosUser: string | null;
  username: string;
}

export default function LiveMap({ sosUser, username }: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});
  const centered = useRef(false);
  const usernameRef = useRef(username);

  // keep latest username without retriggering map
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

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

    const watchId = navigator.geolocation.watchPosition((pos) => {
      if (!socket.id || !mapRef.current) return;

      const { latitude, longitude } = pos.coords;

      if (!centered.current) {
        centered.current = true;
        map.setView([latitude, longitude], 16);
      }

      drawMarker(socket.id, usernameRef.current, latitude, longitude);
      socket.emit("send-location", { latitude, longitude });
    });

    socket.on("receive-location", (data: {
      id: string;
      username: string;
      latitude: number;
      longitude: number;
    }) => {
      drawMarker(data.id, data.username, data.latitude, data.longitude);
    });

    socket.on("user-disconnected", (id: string) => {
      if (markers.current[id]) {
        map.removeLayer(markers.current[id]);
        delete markers.current[id];
      }
    });

    function drawMarker(id: string, name: string, lat: number, lng: number) {
      if (!mapRef.current) return;

      const jitter = id === socket.id ? 0 : (Math.random() - 0.5) * 0.0003;
      const finalLat = lat + jitter;
      const finalLng = lng + jitter;

      const isSOS = sosUser === id;
      const color = isSOS ? "red" : hashColor(id);
      const icon = getIcon(color);

      const label =
        isSOS
          ? `🚨 ${name} (SOS)`
          : id === socket.id
          ? `You (${name})`
          : name;

      if (!markers.current[id]) {
        markers.current[id] = L.marker([finalLat, finalLng], { icon })
          .addTo(map)
          .bindTooltip(label, { permanent: false });
      } else {
        markers.current[id].setLatLng([finalLat, finalLng]);
        markers.current[id].setTooltipContent(label);
      }
    }

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("receive-location");
      socket.off("user-disconnected");

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [sosUser]); // stable dependency

  return <div ref={mapElRef} className="absolute inset-0 h-full w-full" />;
}
