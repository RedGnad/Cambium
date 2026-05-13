import type {
  ConstellationPayload,
  ConstellationSubmissionResult,
} from "../schemas/constellation.js";

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
      hash: payload.metadata.hash,
      accepted: true,
      message: "Mock Constellation submission accepted",
      mode: "mock",
      receivedAt: new Date().toISOString(),
    };
  }
}

/**
 * Live adapter scaffold. Intentionally throws until a real endpoint
 * contract is wired in. We refuse to invent the on-the-wire format —
 * point this at the actual Constellation Digital Evidence API once
 * its documentation is provided.
 */
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
    _payload: ConstellationPayload
  ): Promise<ConstellationSubmissionResult> {
    throw new Error(
      "LiveConstellationAdapter is not wired yet — provide the Constellation " +
        "Digital Evidence API endpoint contract before switching mode to live."
    );
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
