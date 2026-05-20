import {
  CONSTELLATION_SIGNATURE_ALGO,
  type ConstellationPayload,
} from "../schemas/constellation.js";
import type { FieldEvidencePacket } from "../schemas/packet.js";
import type { Sha256Ref } from "../schemas/common.js";

export interface BuildConstellationPayloadInput {
  packet: FieldEvidencePacket;
  packetHash: Sha256Ref;
  signerPublicKeyHex: string;
  signatureHex: string;
  signerId: string;
  eventId: string; // uuid
  timestamp: string; // ISO 8601
  orgId: string;
  tenantId: string;
}

export type BuildConstellationContentInput = Omit<
  BuildConstellationPayloadInput,
  "signerPublicKeyHex" | "signatureHex"
>;

export function stripSha256Prefix(hash: Sha256Ref): string {
  return hash.replace(/^sha256:/, "");
}

export function asSha256Ref(hash: string): Sha256Ref {
  return (hash.startsWith("sha256:") ? hash : `sha256:${hash}`) as Sha256Ref;
}

export function buildConstellationContent(
  input: BuildConstellationContentInput
): ConstellationPayload["attestation"]["content"] {
  const { packet } = input;
  return {
    orgId: input.orgId,
    tenantId: input.tenantId,
    eventId: input.eventId,
    signerId: input.signerId,
    documentId: `cambium:${packet.packetId}`,
    documentRef: stripSha256Prefix(input.packetHash),
    timestamp: input.timestamp,
    version: 1,
  };
}

export function buildConstellationPayload(
  input: BuildConstellationPayloadInput
): ConstellationPayload {
  const { packet } = input;
  return {
    attestation: {
      content: buildConstellationContent(input),
      proofs: [
        {
          id: input.signerPublicKeyHex,
          signature: input.signatureHex,
          algorithm: CONSTELLATION_SIGNATURE_ALGO,
        },
      ],
    },
    metadata: {
      hash: stripSha256Prefix(input.packetHash),
      tags: {
        project: "Cambium MRV",
        operationType: packet.operation.type,
        crop: packet.operation.crop,
        fieldId: packet.field.fieldId,
        status: "attested",
        assuranceLevel: packet.assuranceLevel,
      },
    },
  };
}
