import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { DEMO_OWNER_ID } from "./lib/constants.js";
import { healthRoutes } from "./routes/health.js";
import { fieldRoutes } from "./routes/fields.js";
import { machineRoutes } from "./routes/machines.js";
import { sessionRoutes } from "./routes/sessions.js";
import { privacyRoutes } from "./routes/privacy.js";
import { evidenceRoutes } from "./routes/evidence.js";
import { verifyRoutes } from "./routes/verify.js";

async function bootstrap() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } }
          : undefined,
    },
  });

  await app.register(cors, {
    origin: [env.APP_BASE_URL],
    credentials: true,
  });

  await app.register(async (api) => {
    await api.register(healthRoutes);
    await api.register(fieldRoutes);
    await api.register(machineRoutes);
    await api.register(sessionRoutes);
    await api.register(privacyRoutes);
    await api.register(evidenceRoutes);
    await api.register(verifyRoutes);
  }, { prefix: "/api" });

  app.setErrorHandler((err, _req, reply) => {
    app.log.error({ err }, "request_failed");
    if (reply.sent) return;
    const message = err instanceof Error ? err.message : "unknown";
    reply.code(500).send({ error: "internal_error", message });
  });

  const close = async () => {
    app.log.info("shutting down");
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);

  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  app.log.info(
    { port: env.API_PORT, constellation: env.CONSTELLATION_MODE, owner: DEMO_OWNER_ID },
    "cambium-api ready"
  );
}

bootstrap().catch((err) => {
  console.error("bootstrap_failed", err);
  process.exit(1);
});
