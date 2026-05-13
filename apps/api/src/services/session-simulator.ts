import { sha256Ref, type LatLng, type OperationType } from "@cambium/shared";

export interface SimulateOptions {
  operationType: OperationType;
  crop: string;
  fieldCode: string;
  machineCode: string;
  // Used as a deterministic seed so demo runs are reproducible.
  seed?: string;
}

export interface SimulatedSession {
  machineCode: string;
  fieldCode: string;
  operationType: OperationType;
  crop: string;
  startedAt: string;
  endedAt: string;
  areaCoveredHa: number;
  yieldKgApprox?: number;
  gpsPathHash: string;
  gpsPathPreview: LatLng[];
  photoHashes: string[];
  rawLogHash: string;
  rawLogSummary: { sampleCount: number; sensors: string[]; durationMs: number };
}

// Mulberry32 — small, deterministic PRNG.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const operationProfiles: Record<
  OperationType,
  { hectaresMin: number; hectaresMax: number; yieldPerHa?: [number, number]; photoCount: [number, number] }
> = {
  HARVEST: { hectaresMin: 0.8, hectaresMax: 4.2, yieldPerHa: [4500, 8500], photoCount: [2, 6] },
  SOIL_SCAN: { hectaresMin: 1.2, hectaresMax: 6.0, photoCount: [0, 2] },
  SPRAYING: { hectaresMin: 1.0, hectaresMax: 5.0, photoCount: [1, 3] },
  MACHINE_PASS: { hectaresMin: 0.6, hectaresMax: 3.0, photoCount: [0, 2] },
  PHOTO_CAPTURE: { hectaresMin: 0.1, hectaresMax: 1.0, photoCount: [4, 12] },
  SENSOR_LOG: { hectaresMin: 0.5, hectaresMax: 4.0, photoCount: [0, 1] },
};

const sensorsByOperation: Record<OperationType, string[]> = {
  HARVEST: ["yield_meter", "moisture", "gps", "imu", "speed"],
  SOIL_SCAN: ["em38_conductivity", "ph_probe", "moisture", "gps"],
  SPRAYING: ["flow_meter", "tank_level", "wind", "gps", "speed"],
  MACHINE_PASS: ["gps", "imu", "speed", "odometry"],
  PHOTO_CAPTURE: ["camera_meta", "gps", "lighting"],
  SENSOR_LOG: ["temperature", "humidity", "gps"],
};

export function simulateSession(opts: SimulateOptions): SimulatedSession {
  const rand = mulberry32(seedFromString(opts.seed ?? `${opts.fieldCode}|${opts.machineCode}|${opts.operationType}`));
  const profile = operationProfiles[opts.operationType];

  const endedAt = new Date();
  // Operation duration: 30–110 minutes.
  const durationMinutes = Math.floor(30 + rand() * 80);
  const startedAt = new Date(endedAt.getTime() - durationMinutes * 60_000);

  const areaCoveredHa = Number(
    (profile.hectaresMin + rand() * (profile.hectaresMax - profile.hectaresMin)).toFixed(3)
  );

  const yieldKgApprox = profile.yieldPerHa
    ? Math.round(areaCoveredHa * (profile.yieldPerHa[0] + rand() * (profile.yieldPerHa[1] - profile.yieldPerHa[0])))
    : undefined;

  // Center the simulated field somewhere in continental France for the demo.
  const centerLat = 48.0 + rand() * 3.0;
  const centerLng = 1.0 + rand() * 5.0;
  const pointCount = 40 + Math.floor(rand() * 60);
  const path: LatLng[] = [];
  // Serpentine pattern across a small rectangle.
  const rowCount = 6 + Math.floor(rand() * 4);
  const rowSpacing = 0.0005 + rand() * 0.0003;
  const rowLength = 0.0015 + rand() * 0.0008;
  for (let i = 0; i < pointCount; i++) {
    const row = Math.floor((i / pointCount) * rowCount);
    const t = (i / pointCount) * rowCount - row;
    const forward = row % 2 === 0 ? t : 1 - t;
    const lat = Number((centerLat + row * rowSpacing - (rowCount * rowSpacing) / 2).toFixed(6));
    const lng = Number((centerLng + forward * rowLength - rowLength / 2).toFixed(6));
    path.push([lat, lng]);
  }

  const [photoMin, photoMax] = profile.photoCount;
  const photoCount = photoMin + Math.floor(rand() * (photoMax - photoMin + 1));
  const photoHashes: string[] = [];
  for (let i = 0; i < photoCount; i++) {
    photoHashes.push(sha256Ref(`${opts.fieldCode}|${opts.machineCode}|photo|${i}|${rand()}`));
  }

  const sensors = sensorsByOperation[opts.operationType];
  const sampleCount = Math.floor(durationMinutes * 60 / 5); // ~5s cadence
  const rawLogSummary = {
    sampleCount,
    sensors,
    durationMs: durationMinutes * 60_000,
  };

  // Hash the raw log summary + path as a stand-in for a real machine log.
  // In production this would be sha256 over the actual binary log file.
  const rawLogHash = sha256Ref(
    JSON.stringify({
      machineCode: opts.machineCode,
      fieldCode: opts.fieldCode,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      sensors,
      sampleCount,
      pathPoints: path.length,
    })
  );

  const gpsPathHash = sha256Ref(JSON.stringify(path));

  return {
    machineCode: opts.machineCode,
    fieldCode: opts.fieldCode,
    operationType: opts.operationType,
    crop: opts.crop,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    areaCoveredHa,
    yieldKgApprox,
    gpsPathHash,
    gpsPathPreview: path,
    photoHashes,
    rawLogHash,
    rawLogSummary,
  };
}
