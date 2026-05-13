import type { FastifyInstance } from "fastify";
import { verifyByHashOrSlug } from "../services/evidence-service.js";

export async function verifyRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { hash: string } }>("/verify/:hash", async (req, reply) => {
    const result = await verifyByHashOrSlug(req.params.hash);
    if (result.status === "not_found") {
      return reply.code(404).send({
        status: "not_found",
        message: "No evidence packet matches this hash or slug.",
      });
    }
    if (result.status === "tampered" || !result.packet) {
      // Tampered packets get a minimal response — no point exposing
      // operation/field/machine fields from a document we cannot trust.
      return {
        status: "tampered",
        packetHash: result.packetHash,
        signatureValid: result.signatureValid ?? false,
        message:
          "The stored document does not match its canonical hash or schema. Treat the evidence as invalid.",
      };
    }
    // Public verification endpoint — never leak private references.
    const packet = result.packet;
    return {
      status: result.status,
      packetHash: result.packetHash,
      signatureValid: result.signatureValid ?? null,
      packetSchema: packet.schema,
      packetId: packet.packetId,
      createdAt: packet.createdAt,
      assuranceLevel: packet.assuranceLevel,
      operation: packet.operation,
      field: packet.field,
      machine: packet.machine,
      privacy: packet.privacy,
      publicEvidence: packet.publicEvidence,
      privateEvidenceRefs: {
        // We expose the *hashes* because they ARE the public commitment;
        // the underlying raw data is never exposed.
        rawLogHash: packet.privateEvidenceRefs.rawLogHash,
        gpsPathHash: packet.privateEvidenceRefs.gpsPathHash,
        photoCount: packet.privateEvidenceRefs.photoHashes.length,
      },
      attestations: packet.attestations.map((a) => ({
        type: a.type,
        signerId: a.signerId,
        statement: a.statement,
        publicKeyHex: a.publicKeyHex,
        signedAt: a.signedAt,
      })),
      claimBoundary: packet.claimBoundary,
      constellation: result.constellation ?? null,
    };
  });
}
