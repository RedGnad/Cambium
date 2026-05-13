"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at import time. Loading it via next/dynamic with
// ssr:false keeps it client-only without leaking into the server bundle.
export const MapClient = dynamic(
  () => import("./GpsPreviewMap").then((m) => m.GpsPreviewMap),
  { ssr: false }
);
