"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { socket } from "@/lib/socket";

const iconCache: Record<string, L.DivIcon> = {};

interface LocationPayload {
  id: string;
  username: string;
  latitude: number;
  longitude: number;
}

// PREMIUM DIV ICON GENERATOR
function getPremiumIcon(color: string, name: string, isSelf: boolean) {
  const iconKey = `${color}-${name}-${isSelf}`;
  if (!iconCache[iconKey]) {
    iconCache[iconKey] = L.divIcon({
      className: "premium-marker",
      html: `
        <div class="marker-container ${isSelf ? 'is-self' : ''}">
          <div class="marker-pin" style="background: ${color}">
             <span class="marker-initial">${name.slice(0, 1).toUpperCase()}</span>
          </div>
          <div class="marker-shadow"></div>
          ${isSelf ? '<div class="marker-pulse"></div>' : ''}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  }
  return iconCache[iconKey];
}

function hashToHexColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "000000".substring(0, 6 - c.length) + c;
}

export default function LiveMap({
  username,
  members,
  sosUsers = [],
  waypoints = [],
  addToast,
  theme = "dark"
}: {
  username: string;
  members: Array<{ id: string; username: string }>;
  sosUsers?: string[];
  waypoints?: Array<{ id: string, lat: number, lng: number, label: string }>;
  addToast: (msg: string, type: 'info' | 'error' | 'success') => void;
  theme?: "bright" | "dark";
}) {
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const waypointsMarkersRef = useRef<Record<string, L.Marker>>({});
  const sosCirclesRef = useRef<Record<string, L.Circle>>({});
  const centeredRef = useRef(false);

  // Telemetry & Proximity State
  const telemetryRef = useRef<Record<string, { lat: number, lng: number, time: number, speed: number, activity: string }>>({});
  const proximityAlertsRef = useRef<Record<string, boolean>>({}); // tracking who we've already alerted for

  // --- UTILS ---
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const f1 = lat1 * Math.PI / 180;
    const f2 = lat2 * Math.PI / 180;
    const df = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(df / 2) * Math.sin(df / 2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getActivity = (speedKph: number) => {
    if (speedKph < 2) return "🏠";
    if (speedKph < 15) return "🚶";
    return "🚗";
  };

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const map = L.map(mapElRef.current, {
      center: [20, 0],
      zoom: 3,
      attributionControl: false,
      zoomControl: false
    });

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    // --- MAP INTERACTIONS ---
    map.on('dblclick', (e) => {
      const label = prompt("Meeting Point Name?") || "Meeting Point";
      socket.emit("drop-waypoint", { lat: e.latlng.lat, lng: e.latlng.lng, label });
    });

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

      updateMarker(socket.id, username, latitude, longitude);

      // --- PROXIMAL ALERT CHECK ---
      Object.keys(markersRef.current).forEach(id => {
        if (id !== socket.id) {
          const otherMarker = markersRef.current[id];
          const dist = getDistance(latitude, longitude, otherMarker.getLatLng().lat, otherMarker.getLatLng().lng);
          if (dist < 100 && !proximityAlertsRef.current[id]) {
            proximityAlertsRef.current[id] = true;
            addToast(`Proximity: ${members.find(m => m.id === id)?.username || "Member"} is nearby!`, 'info');
          } else if (dist > 150) {
            proximityAlertsRef.current[id] = false;
          }
        }
      });

      if (now - lastEmitTime > 2000) {
        lastEmitTime = now;
        socket.emit("send-location", {
          latitude,
          longitude,
          username,
        });
      }
    }, (err) => console.error("GPS Error:", err), { enableHighAccuracy: true });

    /* ---------- SOCKET ---------- */
    socket.on("receive-location", (data: LocationPayload) => {
      if (data.id === socket.id) return;
      updateMarker(data.id, data.username, data.latitude, data.longitude);
    });

    socket.on("user-disconnected", (id: string) => {
      removeUserFromMap(id);
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("receive-location");
      socket.off("user-disconnected");
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [username]);

  // ✅ DYNAMIC THEME SWAP
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const url = theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    // Switch to standard HTTP if SSL is broken on user machine? 
    // No, better to try a more reliable dark theme if Carto is failing.
    // Using a different dark theme as requested "back to original" might mean OSM standard.

    const options = theme === "dark"
      ? { subdomains: 'abcd', attribution: '&copy; CARTO' }
      : { attribution: '&copy; OpenStreetMap' };

    tileLayerRef.current = L.tileLayer(url, options).addTo(mapRef.current);
  }, [theme]);

  useEffect(() => {
    if (!mapRef.current) return;

    Object.keys(sosCirclesRef.current).forEach(id => {
      if (!sosUsers.includes(id)) {
        mapRef.current!.removeLayer(sosCirclesRef.current[id]);
        delete sosCirclesRef.current[id];
      }
    });

    members.forEach(m => {
      const marker = markersRef.current[m.id];
      if (marker) {
        const pos = marker.getLatLng();
        updateMarker(m.id, m.username, pos.lat, pos.lng);
      }
    });
  }, [sosUsers, members]);

  // ✅ WAYPOINT SYNC
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old
    Object.keys(waypointsMarkersRef.current).forEach(id => {
      const exists = waypoints.find(w => w.id === id);
      if (!exists) {
        mapRef.current!.removeLayer(waypointsMarkersRef.current[id]);
        delete waypointsMarkersRef.current[id];
      }
    });

    // Add new
    waypoints.forEach(w => {
      if (!waypointsMarkersRef.current[w.id]) {
        waypointsMarkersRef.current[w.id] = L.marker([w.lat, w.lng], {
          icon: L.divIcon({
            className: 'waypoint-marker',
            html: `<div class="waypoint-pin">⭐</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(mapRef.current!).bindTooltip(w.label, { permanent: true, direction: 'top', className: 'waypoint-tooltip' });
      }
    });
  }, [waypoints]);

  // ✅ RECONCILIATION: Marker cleanup
  useEffect(() => {
    if (!mapRef.current) return;
    const memberIds = new Set([...members.map(m => m.id), socket.id]);
    Object.keys(markersRef.current).forEach(id => {
      if (!memberIds.has(id)) removeUserFromMap(id);
    });
  }, [members]);

  function removeUserFromMap(id: string) {
    if (!mapRef.current) return;
    if (markersRef.current[id]) {
      mapRef.current.removeLayer(markersRef.current[id]);
      delete markersRef.current[id];
    }
    if (sosCirclesRef.current[id]) {
      mapRef.current.removeLayer(sosCirclesRef.current[id]);
      delete sosCirclesRef.current[id];
    }
  }

  function updateMarker(id: string, name: string, lat: number, lng: number) {
    if (!mapRef.current || !id || lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) return;

    let finalLat = lat;
    let finalLng = lng;

    const existingIds = Object.keys(markersRef.current);
    const isColliding = existingIds.some(eid => {
      if (eid === id) return false;
      const marker = markersRef.current[eid];
      const pos = marker.getLatLng();
      const dist = Math.abs(pos.lat - lat) + Math.abs(pos.lng - lng);
      return dist < 0.00005;
    });

    if (isColliding) {
      const offset = (id.charCodeAt(0) % 5) * 0.0001;
      const angle = (id.charCodeAt(id.length - 1) % 8) * (Math.PI / 4);
      finalLat += Math.sin(angle) * (0.00015 + offset);
      finalLng += Math.cos(angle) * (0.00015 + offset);
    }

    const isSelf = id === socket.id;
    const color = hashToHexColor(id);
    const icon = getPremiumIcon(color, name, isSelf);

    // --- TELEMETRY ---
    const now = Date.now();
    const prev = telemetryRef.current[id];
    let speedKph = 0;
    let activity = "🏠";

    if (prev) {
      const dist = getDistance(lat, lng, prev.lat, prev.lng);
      const timeSec = (now - prev.time) / 1000;
      if (timeSec > 0) {
        speedKph = (dist / timeSec) * 3.6;
        // Smoothing
        speedKph = (prev.speed || 0) * 0.7 + speedKph * 0.3;
      }
      activity = getActivity(speedKph);
    }
    telemetryRef.current[id] = { lat, lng, time: now, speed: speedKph, activity };

    const label = `${activity} ${name} ${speedKph > 5 ? `(${Math.round(speedKph)}km/h)` : ''}`;

    if (!markersRef.current[id]) {
      markersRef.current[id] = L.marker([finalLat, finalLng], { icon })
        .addTo(mapRef.current!)
        .bindTooltip(label, { permanent: true, direction: 'top', className: 'premium-tooltip' });
    } else {
      markersRef.current[id].setLatLng([finalLat, finalLng]);
      markersRef.current[id].setTooltipContent(label);
    }

    // --- SOS CIRCLE ---
    if (sosUsers.includes(id)) {
      if (!sosCirclesRef.current[id]) {
        sosCirclesRef.current[id] = L.circle([finalLat, finalLng], {
          radius: 120,
          color: "#ff4444",
          fillColor: "#ff0000",
          fillOpacity: 0.2,
          weight: 2,
          className: "advanced-pulse-sos"
        }).addTo(mapRef.current);
      } else {
        sosCirclesRef.current[id].setLatLng([finalLat, finalLng]);
      }
    } else if (sosCirclesRef.current[id]) {
      mapRef.current.removeLayer(sosCirclesRef.current[id]);
      delete sosCirclesRef.current[id];
    }
  }

  return (
    <>
      <style>{`
        .marker-container { position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
        .marker-pin { 
          width: 30px; height: 30px; border-radius: 12px 12px 12px 2px; 
          transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.2);
        }
        .marker-initial { transform: rotate(45deg); font-weight: 900; color: white; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
        .marker-shadow { 
           position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
           width: 14px; height: 4px; background: rgba(0,0,0,0.5); border-radius: 50%; filter: blur(2px);
        }
        .is-self .marker-pin { border: 2px solid white; box-shadow: 0 0 15px rgba(255,255,255,0.4); }
        .marker-pulse {
          position: absolute; width: 50px; height: 50px; border: 2px solid rgba(255,255,255,0.4);
          border-radius: 50%; animation: marker-scan 3s infinite linear; pointer-events: none;
        }
        @keyframes marker-scan {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes advanced-sos {
          0% { stroke-opacity: 0.8; stroke-width: 2; fill-opacity: 0.2; transform: scale(1); }
          50% { stroke-opacity: 1; stroke-width: 8; fill-opacity: 0.4; transform: scale(1.1); }
          100% { stroke-opacity: 0.8; stroke-width: 2; fill-opacity: 0.2; transform: scale(1); }
        }
        .advanced-pulse-sos {
          animation: advanced-sos 1.2s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
        .premium-tooltip {
          background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 6px; padding: 4px 8px; font-weight: bold; font-size: 11px;
        }
        .waypoint-pin { font-size: 24px; filter: drop-shadow(0 0 5px gold); animation: bounce 2s infinite; }
        .waypoint-tooltip { background: rgba(255,215,0,0.2); border: 1px solid gold; color: gold; font-weight: 900; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>
      <div ref={mapElRef} className={`absolute inset-0 h-full w-full transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#f4f1ea]'}`} />
    </>
  );
}
