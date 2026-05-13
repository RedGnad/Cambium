import { z } from "zod";
import {
  assuranceLevelSchema,
  hexSignatureSchema,
  isoDateTimeSchema,
  latLngSchema,
  operationTypeSchema,
  sha256RefSchema,
} from "./common.js";

export const FIELD_EVIDENCE_PACKET_SCHEMA_ID =
  "cambium.field-evidence-packet.v1" as const;

export const packetOperationSchema = z.object({
  type: operationTypeSchema,
  crop: z.string(),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema,
  timeWindowPrecision: z.enum(["minute", "hour", "day"]).default("minute"),
});

export const packetFieldSchema = z.object({
  fieldId: z.string(),
  region: z.string().optional(),
  areaCoveredHaApprox: z.number(),
  areaPrecision: z.enum([
    "rounded_0.01ha",
    "rounded_0.1ha",
    "rounded_0.5ha",
    "bucketed",
  ]),
});

export const packetMachineSchema = z.object({
  machineId: z.string(),
  machineType: z.string(),
  vendorVisible: z.boolean(),
});

export const packetPrivacySchema = z.object({
  gpsPolicy: z.enum([
    "exact_hash_only",
    "masked_preview_and_hash_only",
    "bounding_region_and_hash_only",
  ]),
  gpsPrecision: z.enum([
    "preview_simplified",
    "preview_jittered",
    "bounding_region",
  ]),
  yieldPolicy: z.enum(["exact", "approximate", "hidden"]),
  photoPolicy: z.enum(["hash_only", "hidden"]),
  rawLogPolicy: z.enum(["hash_only", "hidden"]),
});

export const packetPublicEvidenceSchema = z.object({
  gpsPathPreview: z.array(latLngSchema).optional(),
  yieldKgApprox: z.number().optional(),
  photoCount: z.number().int().nonnegative(),
});

export const packetPrivateRefsSchema = z.object({
  rawLogHash: sha256RefSchema,
  gpsPathHash: sha256RefSchema,
  photoHashes: z.array(sha256RefSchema),
});

export const packetAttestationSchema = z.object({
  type: z.enum(["farmer", "machine", "reviewer", "operator", "demo_signer"]),
  signerId: z.string(),
  statement: z.string(),
  signature: hexSignatureSchema,
  publicKeyHex: z.string(),
  signedAt: isoDateTimeSchema,
});
export type PacketAttestation = z.infer<typeof packetAttestationSchema>;

export const packetClaimBoundarySchema = z.object({
  doesNotCertifyCarbon: z.literal(true),
  doesNotGuaranteeCompliance: z.literal(true),
  doesNotExposeMachineLogic: z.literal(true),
  intendedUse: z.array(
    z.enum([
      "supply_chain_evidence",
      "green_claim_support",
      "rwa_due_diligence",
      "audit_trail",
    ])
  ),
});

// Field Evidence Packet v1 — canonical schema.
// Key order in this object literal also defines the encoding order
// when re-serialized via canonicalJsonStringify (which sorts keys
// lexicographically regardless). Keep this schema stable.
export const fieldEvidencePacketSchema = z.object({
  schema: z.literal(FIELD_EVIDENCE_PACKET_SCHEMA_ID),
  packetId: z.string(),
  createdAt: isoDateTimeSchema,
  assuranceLevel: assuranceLevelSchema,
  operation: packetOperationSchema,
  field: packetFieldSchema,
  machine: packetMachineSchema,
  privacy: packetPrivacySchema,
  publicEvidence: packetPublicEvidenceSchema,
  privateEvidenceRefs: packetPrivateRefsSchema,
  attestations: z.array(packetAttestationSchema),
  claimBoundary: packetClaimBoundarySchema,
});
export type FieldEvidencePacket = z.infer<typeof fieldEvidencePacketSchema>;
