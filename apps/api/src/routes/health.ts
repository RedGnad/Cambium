import type { FastifyInstance } from "fastify";
import { env } from "../lib/env.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    ok: true,
    service: "cambium-api",
    constellation: env.CONSTELLATION_MODE,
  }));
}
