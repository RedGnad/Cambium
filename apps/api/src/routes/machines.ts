import type { FastifyInstance } from "fastify";
import { machineCreateInputSchema } from "@cambium/shared";
import { prisma } from "../lib/prisma.js";
import { DEMO_OWNER_ID } from "../lib/constants.js";

function serialize(m: Awaited<ReturnType<typeof prisma.machine.findFirstOrThrow>>) {
  return {
    id: m.id,
    machineCode: m.machineCode,
    machineType: m.machineType,
    publicKeyHex: m.publicKeyHex ?? undefined,
    vendorVisible: m.vendorVisible,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function machineRoutes(app: FastifyInstance): Promise<void> {
  app.post("/machines", async (req, reply) => {
    const parsed = machineCreateInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
    }
    const data = parsed.data;
    try {
      const created = await prisma.machine.create({
        data: {
          ownerId: DEMO_OWNER_ID,
          machineCode: data.machineCode,
          machineType: data.machineType,
          publicKeyHex: data.publicKeyHex,
          vendorVisible: data.vendorVisible,
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
        return reply.code(409).send({ error: "machine_code_already_exists" });
      }
      throw e;
    }
  });

  app.get("/machines", async () => {
    const rows = await prisma.machine.findMany({
      where: { ownerId: DEMO_OWNER_ID },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(serialize);
  });

  app.get<{ Params: { id: string } }>("/machines/:id", async (req, reply) => {
    const row = await prisma.machine.findUnique({ where: { id: req.params.id } });
    if (!row) return reply.code(404).send({ error: "not_found" });
    return serialize(row);
  });
}
