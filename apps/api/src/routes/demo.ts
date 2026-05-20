import type { FastifyInstance } from "fastify";
import { ensureDemoSeed } from "../services/demo-seed-service.js";

export async function demoRoutes(app: FastifyInstance): Promise<void> {
  app.post("/demo/seed", async () => ensureDemoSeed());
}
