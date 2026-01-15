"use client";

import { useEffect } from "react";

export default function ClientRoot() {
  useEffect(() => {
    // Load Leaflet ONLY in browser
    import("leaflet").then((L) => {
      const leaflet = L.default;

      // Fix missing marker icons in Next.js
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;

      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
    });
  }, []);

  return null;
}
