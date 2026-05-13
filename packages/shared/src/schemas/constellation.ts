import { z } from "zod";
import {
  constellationModeSchema,
  hexSignatureSchema,
  isoDateTimeSchema,
  sha256RefSchema,
} from "./common.js";

export const CONSTELLATION_SIGNATURE_ALGO = "SECP256K1_RFC8785_V1" as const;

export const constellationProofSchema = z.object({
  id: z.string(),
  signature: hexSignatureSchema,
  algorithm: z.literal(CONSTELLATION_SIGNATURE_ALGO),
});

export const constellationAttestationContentSchema = z.object({
  orgId: z.string(),
  tenantId: z.string(),
  eventId: z.string().uuid(),
  signerId: z.string(),
  documentId: z.string(),
  documentRef: sha256RefSchema,
  timestamp: isoDateTimeSchema,
  version: z.literal(1),
});

export const constellationPayloadSchema = z.object({
  attestation: z.object({
    content: constellationAttestationContentSchema,
    proofs: z.array(constellationProofSchema).min(1),
  }),
  metadata: z.object({
    hash: sha256RefSchema,
    tags: z.record(z.string(), z.string()),
  }),
});
export type ConstellationPayload = z.infer<typeof constellationPayloadSchema>;

export const constellationSubmissionResultSchema = z.object({
  eventId: z.string(),
  hash: sha256RefSchema,
  accepted: z.boolean(),
  message: z.string(),
  mode: constellationModeSchema,
  receivedAt: isoDateTimeSchema,
});
export type ConstellationSubmissionResult = z.infer<
  typeof constellationSubmissionResultSchema
>;
