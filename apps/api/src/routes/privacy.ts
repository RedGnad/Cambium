import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { applyPrivacyTransform, privacyLevelSchema, type LatLng } from "@cambium/shared";
import { prisma } from "../lib/prisma.js";

const previewBodySchema = z.object({
  sessionId: z.string().uuid(),
  privacyLevel: privacyLevelSchema,
});

export async function privacyRoutes(app: FastifyInstance): Promise<void> {
  app.post("/privacy/preview-transform", async (req, reply) => {
    const parsed = previewBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });
    }
    const session = await prisma.machineSession.findUnique({
      where: { id: parsed.data.sessionId },
    });
    if (!session) return reply.code(404).send({ error: "session_not_found" });

    const applied = applyPrivacyTransform({
      privacyLevel: parsed.data.privacyLevel,
      gpsPathPreview: session.gpsPathPreview as LatLng[],
      areaCoveredHa: Number(session.areaCoveredHa),
      yieldKgApprox:
        session.yieldKgApprox !== null ? Number(session.yieldKgApprox) : undefined,
      photoCount: (session.photoHashes as string[]).length,
    });

    return {
      privacyLevel: parsed.data.privacyLevel,
      transforms: applied.transformReport.transforms,
      warnings: applied.transformReport.warnings,
      publicPreview: {
        areaCoveredHaApprox: applied.approximateAreaHa,
        areaPrecision: applied.areaPrecision,
        gpsPathPreview: applied.publicEvidence.gpsPathPreview,
        yieldKgApprox: applied.publicEvidence.yieldKgApprox,
        photoCount: applied.publicEvidence.photoCount,
      },
      privacyPolicy: applied.privacy,
    };
  });
}
