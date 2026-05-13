import type { LatLng, PrivacyLevel } from "../schemas/common.js";
import type { FieldEvidencePacket } from "../schemas/packet.js";

export interface PrivacyPolicyApplied {
  privacy: FieldEvidencePacket["privacy"];
  publicEvidence: {
    gpsPathPreview: LatLng[];
    yieldKgApprox: number | undefined;
    photoCount: number;
  };
  areaPrecision: FieldEvidencePacket["field"]["areaPrecision"];
  approximateAreaHa: number;
  transformReport: PrivacyTransformReport;
}

export interface PrivacyTransformReport {
  privacyLevel: PrivacyLevel;
  transforms: Array<{ field: string; raw: string; public: string }>;
  warnings: string[];
}

export interface PrivacyTransformInput {
  privacyLevel: PrivacyLevel;
  gpsPathPreview: LatLng[];
  areaCoveredHa: number;
  yieldKgApprox: number | null | undefined;
  photoCount: number;
}

// Round to a step (e.g., step=0.1 → rounds to 1 decimal).
function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function roundToFixed(value: number, step: number, decimals: number): number {
  return Number(roundTo(value, step).toFixed(decimals));
}

// Keeps roughly `target` points by even-stride sampling. Always preserves
// first and last points so the preview still hints at the operation's
// start and end without revealing every waypoint.
export function simplifyByStride(points: LatLng[], target: number): LatLng[] {
  if (points.length <= target) return [...points];
  if (target < 2) target = 2;
  const out: LatLng[] = [];
  const stride = (points.length - 1) / (target - 1);
  for (let i = 0; i < target; i++) {
    const idx = Math.min(points.length - 1, Math.round(i * stride));
    out.push(points[idx]!);
  }
  return out;
}

// Reduces a path to its bounding rectangle (4 corners + closing point).
// Hides the actual trajectory, exposes only the area footprint.
export function boundingRectangle(points: LatLng[]): LatLng[] {
  if (points.length === 0) return [];
  let minLat = points[0]![0];
  let maxLat = points[0]![0];
  let minLng = points[0]![1];
  let maxLng = points[0]![1];
  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return [
    [minLat, minLng],
    [minLat, maxLng],
    [maxLat, maxLng],
    [maxLat, minLng],
    [minLat, minLng],
  ];
}

export function applyPrivacyTransform(
  input: PrivacyTransformInput
): PrivacyPolicyApplied {
  const { privacyLevel, gpsPathPreview, areaCoveredHa, photoCount } = input;
  const yieldKg = input.yieldKgApprox ?? undefined;

  switch (privacyLevel) {
    case "low": {
      const preview = simplifyByStride(gpsPathPreview, 64);
      const area = roundToFixed(areaCoveredHa, 0.01, 2);
      const yieldOut = yieldKg !== undefined ? roundTo(yieldKg, 10) : undefined;
      return {
        privacy: {
          gpsPolicy: "masked_preview_and_hash_only",
          gpsPrecision: "preview_simplified",
          yieldPolicy: "approximate",
          photoPolicy: "hash_only",
          rawLogPolicy: "hash_only",
        },
        publicEvidence: {
          gpsPathPreview: preview,
          yieldKgApprox: yieldOut,
          photoCount,
        },
        areaPrecision: "rounded_0.01ha",
        approximateAreaHa: area,
        transformReport: {
          privacyLevel,
          transforms: [
            {
              field: "gpsPath",
              raw: "exact path hidden",
              public: `simplified preview (${preview.length} pts) + hash`,
            },
            {
              field: "areaHa",
              raw: "exact value hidden",
              public: `rounded to 0.01 ha (${area})`,
            },
            {
              field: "yieldKg",
              raw: "exact value hidden",
              public:
                yieldOut !== undefined
                  ? `rounded to 10 kg (${yieldOut})`
                  : "absent",
            },
            { field: "rawLog", raw: "full log hidden", public: "sha256 hash only" },
            { field: "photos", raw: "raw photos hidden", public: "sha256 hashes only" },
          ],
          warnings: [
            "GPS preview at low privacy may still reveal field location patterns.",
          ],
        },
      };
    }
    case "standard": {
      const preview = simplifyByStride(gpsPathPreview, 24);
      const area = roundToFixed(areaCoveredHa, 0.1, 1);
      const yieldOut = yieldKg !== undefined ? roundTo(yieldKg, 50) : undefined;
      return {
        privacy: {
          gpsPolicy: "masked_preview_and_hash_only",
          gpsPrecision: "preview_simplified",
          yieldPolicy: "approximate",
          photoPolicy: "hash_only",
          rawLogPolicy: "hash_only",
        },
        publicEvidence: {
          gpsPathPreview: preview,
          yieldKgApprox: yieldOut,
          photoCount,
        },
        areaPrecision: "rounded_0.1ha",
        approximateAreaHa: area,
        transformReport: {
          privacyLevel,
          transforms: [
            {
              field: "gpsPath",
              raw: "exact path hidden",
              public: `simplified preview (${preview.length} pts) + hash`,
            },
            {
              field: "areaHa",
              raw: "exact value hidden",
              public: `rounded to 0.1 ha (${area})`,
            },
            {
              field: "yieldKg",
              raw: "exact value hidden",
              public:
                yieldOut !== undefined
                  ? `rounded to 50 kg (${yieldOut})`
                  : "absent",
            },
            { field: "rawLog", raw: "full log hidden", public: "sha256 hash only" },
            { field: "photos", raw: "raw photos hidden", public: "sha256 hashes only" },
          ],
          warnings: [],
        },
      };
    }
    case "high": {
      const preview = boundingRectangle(gpsPathPreview);
      const area = roundToFixed(areaCoveredHa, 0.5, 1);
      return {
        privacy: {
          gpsPolicy: "bounding_region_and_hash_only",
          gpsPrecision: "bounding_region",
          yieldPolicy: "hidden",
          photoPolicy: "hash_only",
          rawLogPolicy: "hash_only",
        },
        publicEvidence: {
          gpsPathPreview: preview,
          yieldKgApprox: undefined,
          photoCount,
        },
        areaPrecision: "rounded_0.5ha",
        approximateAreaHa: area,
        transformReport: {
          privacyLevel,
          transforms: [
            {
              field: "gpsPath",
              raw: "exact path hidden",
              public: "bounding rectangle only + hash",
            },
            {
              field: "areaHa",
              raw: "exact value hidden",
              public: `rounded to 0.5 ha (${area})`,
            },
            { field: "yieldKg", raw: "exact value hidden", public: "withheld" },
            { field: "rawLog", raw: "full log hidden", public: "sha256 hash only" },
            { field: "photos", raw: "raw photos hidden", public: "sha256 hashes only" },
          ],
          warnings: [],
        },
      };
    }
  }
}
