import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { DEMO_OWNER_ID } from "./lib/constants.js";
import { buildApiApp } from "./app.js";

async function bootstrap() {
  const app = await buildApiApp();

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
