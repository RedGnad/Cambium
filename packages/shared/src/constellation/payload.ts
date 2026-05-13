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

export function buildConstellationPayload(
  input: BuildConstellationPayloadInput
): ConstellationPayload {
  const { packet } = input;
  return {
    attestation: {
      content: {
        orgId: input.orgId,
        tenantId: input.tenantId,
        eventId: input.eventId,
        signerId: input.signerId,
        documentId: `cambium:${packet.packetId}`,
        documentRef: input.packetHash,
        timestamp: input.timestamp,
        version: 1,
      },
      proofs: [
        {
          id: input.signerPublicKeyHex,
          signature: input.signatureHex,
          algorithm: CONSTELLATION_SIGNATURE_ALGO,
        },
      ],
    },
    metadata: {
      hash: input.packetHash,
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
