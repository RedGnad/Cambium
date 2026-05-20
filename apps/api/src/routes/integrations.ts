import type { FastifyInstance } from "fastify";
import { env } from "../lib/env.js";

export async function integrationRoutes(app: FastifyInstance): Promise<void> {
  app.get("/integrations/constellation", async () => {
    const liveReady =
      env.CONSTELLATION_MODE === "live" &&
      Boolean(env.CONSTELLATION_API_BASE_URL) &&
      Boolean(env.CONSTELLATION_API_KEY) &&
      Boolean(env.CONSTELLATION_ORG_ID) &&
      Boolean(env.CONSTELLATION_TENANT_ID);

    return {
      mode: env.CONSTELLATION_MODE,
      apiBaseUrl: env.CONSTELLATION_API_BASE_URL || null,
      apiKeyConfigured: Boolean(env.CONSTELLATION_API_KEY),
      orgConfigured: Boolean(env.CONSTELLATION_ORG_ID),
      tenantConfigured: Boolean(env.CONSTELLATION_TENANT_ID),
      liveReady,
      submissionEndpoint:
        env.CONSTELLATION_MODE === "live" && env.CONSTELLATION_API_BASE_URL
          ? `${env.CONSTELLATION_API_BASE_URL.replace(/\/$/, "")}/fingerprints`
          : null,
      docsUrl: "https://constellation-main.gitbook.io/digital-evidence/api-specification",
    };
  });
}
