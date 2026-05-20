import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import { env } from "./lib/env.js";
import { healthRoutes } from "./routes/health.js";
import { fieldRoutes } from "./routes/fields.js";
import { machineRoutes } from "./routes/machines.js";
import { sessionRoutes } from "./routes/sessions.js";
import { privacyRoutes } from "./routes/privacy.js";
import { evidenceRoutes } from "./routes/evidence.js";
import { verifyRoutes } from "./routes/verify.js";
import { demoRoutes } from "./routes/demo.js";
import { integrationRoutes } from "./routes/integrations.js";

export async function buildApiApp(
  options: FastifyServerOptions = {}
): Promise<FastifyInstance> {
  const app = Fastify({
    ...options,
    logger:
      options.logger ??
      ({
        level: env.NODE_ENV === "production" ? "info" : "debug",
        transport:
          env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } }
            : undefined,
      } as FastifyServerOptions["logger"]),
  });

  await app.register(cors, {
    origin: [env.APP_BASE_URL],
    credentials: true,
  });

  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(fieldRoutes);
      await api.register(machineRoutes);
      await api.register(sessionRoutes);
      await api.register(privacyRoutes);
      await api.register(evidenceRoutes);
      await api.register(verifyRoutes);
      await api.register(demoRoutes);
      await api.register(integrationRoutes);
    },
    { prefix: "/api" }
  );

  app.setErrorHandler((err, _req, reply) => {
    app.log.error({ err }, "request_failed");
    if (reply.sent) return;
    const message = err instanceof Error ? err.message : "unknown";
    reply.code(500).send({ error: "internal_error", message });
  });

  return app;
}
