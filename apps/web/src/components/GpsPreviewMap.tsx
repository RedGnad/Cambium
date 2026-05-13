"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

interface Props {
  points: Array<[number, number]>;
  height?: number;
  label?: string;
}

// Self-contained Leaflet renderer. We don't import react-leaflet here to
// avoid React-version coupling pain; the imperative map API is small enough.
export function GpsPreviewMap({ points, height = 280, label }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || points.length === 0) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    const map = L.map(ref.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const latlngs = points.map(([lat, lng]) => L.latLng(lat, lng));
    const isPolygon =
      points.length >= 4 &&
      points[0]![0] === points[points.length - 1]![0] &&
      points[0]![1] === points[points.length - 1]![1];

    if (isPolygon) {
      L.polygon(latlngs, { color: "#2f5d3e", weight: 2, fillOpacity: 0.15 }).addTo(map);
    } else {
      L.polyline(latlngs, { color: "#2f5d3e", weight: 3, opacity: 0.85 }).addTo(map);
      L.circleMarker(latlngs[0]!, { radius: 4, color: "#2f5d3e" }).addTo(map);
      L.circleMarker(latlngs[latlngs.length - 1]!, {
        radius: 4,
        color: "#244a31",
      }).addTo(map);
    }

    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [16, 16] });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <div
        className="rounded-md border border-dashed border-ink-300 bg-ink-50 px-4 py-6 text-center text-xs text-ink-500"
        style={{ height }}
      >
        no path data
      </div>
    );
  }

  return (
    <div>
      <div ref={ref} style={{ height, width: "100%" }} />
      {label ? (
        <div className="mt-1 text-[11px] text-ink-500">{label}</div>
      ) : null}
    </div>
  );
}
