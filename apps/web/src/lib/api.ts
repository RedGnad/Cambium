// Web -> API client.
//   - Browser: hits /api/proxy/*.
//   - Local server rendering: hits the Fastify API directly.
//   - Vercel server rendering: either hits an external API_BASE_URL or the
//     embedded Next route handler at /api/proxy.
function cleanBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

function isLocalhost(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function getServerApiBase(): string {
  const configured = process.env.API_BASE_URL;
  if (configured && !(process.env.VERCEL && isLocalhost(configured))) {
    return `${cleanBaseUrl(configured)}/api`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/proxy`;
  }

  return "http://localhost:4000/api";
}

const BASE = typeof window === "undefined" ? getServerApiBase() : "/api/proxy";

async function http<T>(
  method: string,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
    ...init,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && data.error) ||
      `HTTP ${res.status}`;
    throw new Error(String(message));
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => http<T>("GET", path, undefined, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    http<T>("POST", path, body, init),
};

export interface FieldDto {
  id: string;
  fieldCode: string;
  displayName: string;
  region?: string;
  cropDefault?: string;
  approximateAreaHa?: number;
  privacyLevel: "low" | "standard" | "high";
  createdAt: string;
}

export interface MachineDto {
  id: string;
  machineCode: string;
  machineType: string;
  publicKeyHex?: string;
  vendorVisible: boolean;
  status: string;
  createdAt: string;
}

export interface SessionDto {
  id: string;
  fieldId: string;
  machineId: string;
  operationType: string;
  crop?: string;
  startedAt: string;
  endedAt: string;
  areaCoveredHa: number | null;
  yieldKgApprox: number | null;
  rawLogHash: string;
  gpsPathHash: string;
  gpsPathPreview: Array<[number, number]>;
  photoHashes: string[];
  importSource: string;
  createdAt: string;
  privacyWarnings?: string[];
  rawLogSummary?: { sampleCount: number; sensors: string[]; durationMs: number };
}

export interface EvidencePacketDto {
  id: string;
  packetHash: string;
  status: string;
  assuranceLevel: string;
  publicVerifySlug: string;
  createdAt: string;
  signedAt: string | null;
  submittedAt: string | null;
  constellationMode?: string | null;
}

export interface EvidencePacketDetailDto extends EvidencePacketDto {
  packet: object;
  constellationSubmissions: Array<{
    eventId: string | null;
    mode: string;
    accepted: boolean | null;
    message: string | null;
    createdAt: string;
  }>;
}

export interface PrivacyPreviewDto {
  privacyLevel: "low" | "standard" | "high";
  transforms: Array<{ field: string; raw: string; public: string }>;
  warnings: string[];
  publicPreview: {
    areaCoveredHaApprox: number;
    areaPrecision: string;
    gpsPathPreview: Array<[number, number]>;
    yieldKgApprox?: number;
    photoCount: number;
  };
  privacyPolicy: Record<string, string>;
}

export interface SubmitResultDto {
  id: string;
  packetHash: string;
  status: string;
  constellation: {
    mode: "mock" | "live";
    eventId: string;
    hash: string;
    accepted: boolean;
    message: string;
  };
  verifyUrl: string;
}

export interface DemoSeedDto {
  field: {
    id: string;
    fieldCode: string;
    displayName: string;
  };
  machine: {
    id: string;
    machineCode: string;
    machineType: string;
  };
  session: {
    id: string;
    operationType: string;
    crop: string | null;
    importSource: string;
  };
  evidencePacket: {
    id: string;
    packetHash: string;
    status: string;
    publicVerifySlug: string;
  };
  verifyUrl: string;
  pdf: {
    rendered: boolean;
    bytes: number;
  };
  nextPath: string;
}

export interface ConstellationIntegrationDto {
  mode: "mock" | "live";
  apiBaseUrl: string | null;
  apiKeyConfigured: boolean;
  orgConfigured: boolean;
  tenantConfigured: boolean;
  liveReady: boolean;
  submissionEndpoint: string | null;
  docsUrl: string;
}
