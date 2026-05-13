import type { FastifyInstance } from "fastify";
import { fieldCreateInputSchema } from "@cambium/shared";
import { prisma } from "../lib/prisma.js";
import { DEMO_OWNER_ID } from "../lib/constants.js";

function serialize(f: Awaited<ReturnType<typeof prisma.field.findFirstOrThrow>>) {
  return {
    id: f.id,
    fieldCode: f.fieldCode,
    displayName: f.displayName,
    region: f.region ?? undefined,
    cropDefault: f.cropDefault ?? undefined,
    approximateAreaHa:
      f.approximateAreaHa !== null ? Number(f.approximateAreaHa) : undefined,
    privacyLevel: f.privacyLevel,
    createdAt: f.createdAt.toISOString(),
  };
}

export async function fieldRoutes(app: FastifyInstance): Promise<void> {
  app.post("/fields", async (req, reply) => {
    const parsed = fieldCreateInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
    }
    const data = parsed.data;
    try {
      const created = await prisma.field.create({
        data: {
          ownerId: DEMO_OWNER_ID,
          fieldCode: data.fieldCode,
          displayName: data.displayName,
          region: data.region,
          cropDefault: data.cropDefault,
          approximateAreaHa: data.approximateAreaHa,
          privacyLevel: data.privacyLevel,
        },
      });
      return serialize(created);
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code: string }).code === "P2002"
      ) {
        return reply.code(409).send({ error: "field_code_already_exists" });
      }
      throw e;
    }
  });

  app.get("/fields", async () => {
    const rows = await prisma.field.findMany({
      where: { ownerId: DEMO_OWNER_ID },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(serialize);
  });

  app.get<{ Params: { id: string } }>("/fields/:id", async (req, reply) => {
    const row = await prisma.field.findUnique({ where: { id: req.params.id } });
    if (!row) return reply.code(404).send({ error: "not_found" });
    return serialize(row);
  });
}
