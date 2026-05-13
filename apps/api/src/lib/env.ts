import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// Load .env from monorepo root.
config({ path: resolve(process.cwd(), "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1),

  CONSTELLATION_MODE: z.enum(["mock", "live"]).default("mock"),
  CONSTELLATION_API_BASE_URL: z.string().optional(),
  CONSTELLATION_API_KEY: z.string().optional(),
  CONSTELLATION_ORG_ID: z.string().default("cambium-demo-org"),
  CONSTELLATION_TENANT_ID: z.string().default("cambium-demo-tenant"),

  DEMO_SIGNER_PRIVATE_KEY: z.string().min(1),
  DEMO_SIGNER_PUBLIC_KEY: z.string().min(1),

  PDF_STORAGE_PATH: z.string().default("./storage/pdf"),
  PRIVATE_STORAGE_PATH: z.string().default("./storage/private"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${formatted}\n\n` +
        `Make sure you ran \`cp .env.example .env\` and \`pnpm --filter @cambium/api gen:demo-keys\`.`
    );
  }
  return parsed.data;
}

export const env = loadEnv();
