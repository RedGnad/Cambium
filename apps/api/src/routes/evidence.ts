import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { privacyLevelSchema } from "@cambium/shared";
import { prisma } from "../lib/prisma.js";
import {
  createPacketFromSession,
  signEvidencePacket,
  submitEvidencePacket,
} from "../services/evidence-service.js";
import { renderEvidencePdf } from "../services/pdf-service.js";
import { env } from "../lib/env.js";

const fromSessionBodySchema = z
  .object({
    privacyLevel: privacyLevelSchema.optional(),
  })
  .optional();

const signBodySchema = z.object({
  signerId: z.string().min(1).max(120).default("farmer_demo_001"),
  statement: z.string().max(500).optional(),
  signatureMode: z.literal("demo_server_signer").default("demo_server_signer"),
});

const submitBodySchema = z
  .object({
    // The mode is taken from server env to avoid letting clients flip
    // mock/live silently. We accept the field for parity with the spec
    // but ignore values that don't match server config.
    mode: z.enum(["mock", "live"]).optional(),
  })
  .optional();

function asHttpError(e: unknown): { status: number; message: string } {
  if (typeof e === "object" && e !== null && "statusCode" in e) {
    const ee = e as { statusCode?: number; message?: string };
    return { status: ee.statusCode ?? 500, message: ee.message ?? "error" };
  }
  return { status: 500, message: e instanceof Error ? e.message : "error" };
}

export async function evidenceRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { sessionId: string } }>(
    "/evidence/from-session/:sessionId",
    async (req, reply) => {
      const parsed = fromSessionBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
      }
      try {
        const result = await createPacketFromSession({
          sessionId: req.params.sessionId,
          privacyLevel: parsed.data?.privacyLevel,
        });
        return result;
      } catch (e) {
        const err = asHttpError(e);
        return reply.code(err.status).send({ error: err.message });
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    "/evidence/:id/sign",
    async (req, reply) => {
      const parsed = signBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
      }
      try {
        const result = await signEvidencePacket({
          evidencePacketId: req.params.id,
          signerId: parsed.data.signerId,
          statement: parsed.data.statement,
          signatureMode: parsed.data.signatureMode,
        });
        return result;
      } catch (e) {
        const err = asHttpError(e);
        return reply.code(err.status).send({ error: err.message });
      }
    }
  );

  app.post<{ Params: { id: string } }>(
    "/evidence/:id/submit",
    async (req, reply) => {
      const parsed = submitBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
      }
      try {
        const result = await submitEvidencePacket(req.params.id);
        return result;
      } catch (e) {
        const err = asHttpError(e);
        return reply.code(err.status).send({ error: err.message });
      }
    }
  );

  app.get("/evidence", async () => {
    const rows = await prisma.evidencePacket.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { constellationSubmissions: { take: 1, orderBy: { createdAt: "desc" } } },
    });
    return rows.map((r: (typeof rows)[number]) => ({
      id: r.id,
      packetHash: r.packetHash,
      status: r.status,
      assuranceLevel: r.assuranceLevel,
      publicVerifySlug: r.publicVerifySlug,
      createdAt: r.createdAt.toISOString(),
      signedAt: r.signedAt?.toISOString() ?? null,
      submittedAt: r.submittedAt?.toISOString() ?? null,
      constellationMode: r.constellationSubmissions[0]?.mode ?? null,
    }));
  });

  app.get<{ Params: { id: string } }>("/evidence/:id", async (req, reply) => {
    const row = await prisma.evidencePacket.findUnique({
      where: { id: req.params.id },
      include: { constellationSubmissions: { orderBy: { createdAt: "desc" } } },
    });
    if (!row) return reply.code(404).send({ error: "not_found" });
    return {
      id: row.id,
      packet: row.packetJson,
      packetHash: row.packetHash,
      status: row.status,
      assuranceLevel: row.assuranceLevel,
      publicVerifySlug: row.publicVerifySlug,
      createdAt: row.createdAt.toISOString(),
      signedAt: row.signedAt?.toISOString() ?? null,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      constellationSubmissions: row.constellationSubmissions.map(
        (s: (typeof row.constellationSubmissions)[number]) => ({
          eventId: s.constellationEventId,
          mode: s.mode,
          accepted: s.accepted,
          message: s.message,
          createdAt: s.createdAt.toISOString(),
        })
      ),
    };
  });

  app.get<{ Params: { id: string } }>("/evidence/:id/pdf", async (req, reply) => {
    const row = await prisma.evidencePacket.findUnique({
      where: { id: req.params.id },
      include: { constellationSubmissions: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!row) return reply.code(404).send({ error: "not_found" });
    const verifySlug = row.publicVerifySlug ?? row.packetHash.replace(/^sha256:/, "");
    const pdf = await renderEvidencePdf({
      packetJson: row.packetJson as object,
      packetHash: row.packetHash,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      signedAt: row.signedAt?.toISOString() ?? null,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      verificationUrl: `${env.APP_BASE_URL}/verify/${verifySlug}`,
      submission: row.constellationSubmissions[0]
        ? {
            mode: row.constellationSubmissions[0].mode,
            eventId: row.constellationSubmissions[0].constellationEventId,
            accepted: row.constellationSubmissions[0].accepted,
          }
        : null,
    });
    reply.header("Content-Type", "application/pdf");
    reply.header(
      "Content-Disposition",
      `inline; filename="cambium-evidence-${row.id}.pdf"`
    );
    return reply.send(pdf);
  });
}
