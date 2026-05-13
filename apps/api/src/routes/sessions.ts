import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  machineSessionImportSchema,
  machineSessionSimulateInputSchema,
  sha256Ref,
  type LatLng,
} from "@cambium/shared";
import { prisma } from "../lib/prisma.js";
import { simulateSession } from "../services/session-simulator.js";

const importBodySchema = z.object({
  fieldId: z.string().uuid(),
  machineId: z.string().uuid(),
  session: machineSessionImportSchema,
});

function serialize(s: Awaited<ReturnType<typeof prisma.machineSession.findFirstOrThrow>>) {
  return {
    id: s.id,
    fieldId: s.fieldId,
    machineId: s.machineId,
    operationType: s.operationType,
    crop: s.crop ?? undefined,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt.toISOString(),
    areaCoveredHa: s.areaCoveredHa !== null ? Number(s.areaCoveredHa) : null,
    yieldKgApprox: s.yieldKgApprox !== null ? Number(s.yieldKgApprox) : null,
    rawLogHash: s.rawLogHash,
    gpsPathHash: s.gpsPathHash,
    gpsPathPreview: s.gpsPathPreview as LatLng[],
    photoHashes: s.photoHashes as string[],
    importSource: s.importSource,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.post("/sessions/import", async (req, reply) => {
    const parsed = importBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
    }
    const { fieldId, machineId, session } = parsed.data;

    const [field, machine] = await Promise.all([
      prisma.field.findUnique({ where: { id: fieldId } }),
      prisma.machine.findUnique({ where: { id: machineId } }),
    ]);
    if (!field) return reply.code(404).send({ error: "field_not_found" });
    if (!machine) return reply.code(404).send({ error: "machine_not_found" });

    // If the importer didn't compute hashes, we compute them now. The raw
    // log itself is never persisted — only its hash enters the evidence trail.
    const rawLogHash =
      session.rawLogHash ??
      sha256Ref(
        JSON.stringify({
          machineCode: session.machineCode,
          fieldCode: session.fieldCode,
          operationType: session.operationType,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          raw: session.rawLog ?? null,
        })
      );
    const gpsPathHash = session.gpsPathHash ?? sha256Ref(JSON.stringify(session.gpsPathPreview));

    const warnings: string[] = [];
    if (session.rawLog !== undefined) {
      warnings.push("rawLog content was hashed and discarded — only its sha256 enters the database.");
    }
    if (session.machineCode !== machine.machineCode) {
      warnings.push("Provided session.machineCode does not match resolved machine — ignored.");
    }
    if (session.fieldCode !== field.fieldCode) {
      warnings.push("Provided session.fieldCode does not match resolved field — ignored.");
    }
    warnings.push("GPS preview will be simplified or masked when an evidence packet is built.");

    const created = await prisma.machineSession.create({
      data: {
        fieldId,
        machineId,
        operationType: session.operationType,
        crop: session.crop,
        startedAt: new Date(session.startedAt),
        endedAt: new Date(session.endedAt),
        areaCoveredHa: session.areaCoveredHa,
        yieldKgApprox: session.yieldKgApprox,
        rawLogHash,
        gpsPathHash,
        gpsPathPreview: session.gpsPathPreview as unknown as object,
        photoHashes: session.photoHashes as unknown as object,
        importSource: "json",
      },
    });

    return { ...serialize(created), privacyWarnings: warnings };
  });

  app.post("/sessions/simulate", async (req, reply) => {
    const parsed = machineSessionSimulateInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
    }
    const { fieldId, machineId, operationType, crop } = parsed.data;

    const [field, machine] = await Promise.all([
      prisma.field.findUnique({ where: { id: fieldId } }),
      prisma.machine.findUnique({ where: { id: machineId } }),
    ]);
    if (!field) return reply.code(404).send({ error: "field_not_found" });
    if (!machine) return reply.code(404).send({ error: "machine_not_found" });

    const sim = simulateSession({
      fieldCode: field.fieldCode,
      machineCode: machine.machineCode,
      operationType,
      crop,
    });

    const created = await prisma.machineSession.create({
      data: {
        fieldId,
        machineId,
        operationType: sim.operationType,
        crop: sim.crop,
        startedAt: new Date(sim.startedAt),
        endedAt: new Date(sim.endedAt),
        areaCoveredHa: sim.areaCoveredHa,
        yieldKgApprox: sim.yieldKgApprox ?? null,
        rawLogHash: sim.rawLogHash,
        gpsPathHash: sim.gpsPathHash,
        gpsPathPreview: sim.gpsPathPreview as unknown as object,
        photoHashes: sim.photoHashes as unknown as object,
        importSource: "simulator",
      },
    });

    return { ...serialize(created), rawLogSummary: sim.rawLogSummary };
  });

  app.get("/sessions", async () => {
    const rows = await prisma.machineSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map(serialize);
  });

  app.get<{ Params: { id: string } }>("/sessions/:id", async (req, reply) => {
    const row = await prisma.machineSession.findUnique({ where: { id: req.params.id } });
    if (!row) return reply.code(404).send({ error: "not_found" });
    return serialize(row);
  });
}
