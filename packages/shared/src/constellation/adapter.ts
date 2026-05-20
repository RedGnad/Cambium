import type {
  ConstellationPayload,
  ConstellationSubmissionResult,
} from "../schemas/constellation.js";
import { asSha256Ref } from "./payload.js";

export interface ConstellationAdapter {
  readonly mode: "mock" | "live";
  submit(payload: ConstellationPayload): Promise<ConstellationSubmissionResult>;
}

/**
 * Mock adapter that mirrors the live adapter's response shape so the
 * rest of the system doesn't branch on mode. The mock is intentionally
 * permissive: it accepts any well-formed payload.
 *
 * The response is presented in the UI with an explicit `mode: "mock"`
 * badge — never silently swap mock for live.
 */
export class MockConstellationAdapter implements ConstellationAdapter {
  readonly mode = "mock" as const;

  async submit(
    payload: ConstellationPayload
  ): Promise<ConstellationSubmissionResult> {
    return {
      eventId: payload.attestation.content.eventId,
      hash: asSha256Ref(payload.metadata.hash),
      accepted: true,
      message: "Mock Constellation submission accepted",
      mode: "mock",
      receivedAt: new Date().toISOString(),
    };
  }
}

export interface LiveConstellationAdapterOptions {
  apiBaseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

export class LiveConstellationAdapter implements ConstellationAdapter {
  readonly mode = "live" as const;
  private readonly apiBaseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: LiveConstellationAdapterOptions) {
    if (!opts.apiBaseUrl || !opts.apiKey) {
      throw new Error(
        "LiveConstellationAdapter requires apiBaseUrl and apiKey"
      );
    }
    this.apiBaseUrl = opts.apiBaseUrl.replace(/\/$/, "");
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async submit(
    payload: ConstellationPayload
  ): Promise<ConstellationSubmissionResult> {
    const res = await this.fetchImpl(`${this.apiBaseUrl}/fingerprints`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: JSON.stringify([payload]),
    });

    const text = await res.text();
    const parsed = text ? safeJson(text) : undefined;

    if (!res.ok) {
      throw new Error(
        `Constellation Digital Evidence submission failed (${res.status}): ${summarizeResponse(parsed ?? text)}`
      );
    }

    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!first || typeof first !== "object") {
      throw new Error("Constellation Digital Evidence returned an empty response");
    }

    const result = first as {
      eventId?: string;
      hash?: string;
      accepted?: boolean;
      message?: string;
    };

    return {
      eventId: result.eventId ?? payload.attestation.content.eventId,
      hash: asSha256Ref(result.hash ?? payload.metadata.hash),
      accepted: result.accepted ?? true,
      message: result.message ?? "Live Constellation submission accepted",
      mode: "live",
      receivedAt: new Date().toISOString(),
    };
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function summarizeResponse(value: unknown): string {
  if (typeof value === "string") return value.slice(0, 500);
  try {
    return JSON.stringify(value).slice(0, 500);
  } catch {
    return "unreadable response";
  }
}

export interface ConstellationFactoryEnv {
  mode: "mock" | "live";
  apiBaseUrl?: string;
  apiKey?: string;
}

export function createConstellationAdapter(
  env: ConstellationFactoryEnv
): ConstellationAdapter {
  if (env.mode === "mock") return new MockConstellationAdapter();
  if (!env.apiBaseUrl || !env.apiKey) {
    throw new Error(
      "CONSTELLATION_MODE=live requires CONSTELLATION_API_BASE_URL and CONSTELLATION_API_KEY"
    );
  }
  return new LiveConstellationAdapter({
    apiBaseUrl: env.apiBaseUrl,
    apiKey: env.apiKey,
  });
}
