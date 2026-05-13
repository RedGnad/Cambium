import type { AssuranceLevel, Sha256Ref } from "../schemas/common.js";
import {
  FIELD_EVIDENCE_PACKET_SCHEMA_ID,
  type FieldEvidencePacket,
  fieldEvidencePacketSchema,
} from "../schemas/packet.js";
import type { PrivacyPolicyApplied } from "../privacy/transform.js";
import { canonicalSha256Ref } from "../crypto/hash.js";

export interface BuildPacketInput {
  packetId: string;
  createdAt: string; // ISO 8601
  assuranceLevel?: AssuranceLevel;

  operation: {
    type: FieldEvidencePacket["operation"]["type"];
    crop: string;
    startedAt: string;
    endedAt: string;
    timeWindowPrecision?: FieldEvidencePacket["operation"]["timeWindowPrecision"];
  };
  field: {
    pseudoFieldId: string;
    region?: string;
  };
  machine: {
    pseudoMachineId: string;
    machineType: string;
    vendorVisible: boolean;
  };

  privacyApplied: PrivacyPolicyApplied;

  privateEvidence: {
    rawLogHash: Sha256Ref;
    gpsPathHash: Sha256Ref;
    photoHashes: Sha256Ref[];
  };

  intendedUse?: FieldEvidencePacket["claimBoundary"]["intendedUse"];
}

/**
 * Builds an unsigned Field Evidence Packet v1 from session, field, machine
 * and privacy inputs. The packet is deterministic given the same inputs.
 *
 * The `attestations` array is intentionally empty here. Signatures are added
 * by the sign step, which produces a new packet variant containing the
 * attestation and a stable packetHash recomputed over the signed form.
 */
export function buildEvidencePacket(input: BuildPacketInput): FieldEvidencePacket {
  const packet: FieldEvidencePacket = {
    schema: FIELD_EVIDENCE_PACKET_SCHEMA_ID,
    packetId: input.packetId,
    createdAt: input.createdAt,
    assuranceLevel: input.assuranceLevel ?? "AL1",
    operation: {
      type: input.operation.type,
      crop: input.operation.crop,
      startedAt: input.operation.startedAt,
      endedAt: input.operation.endedAt,
      timeWindowPrecision: input.operation.timeWindowPrecision ?? "minute",
    },
    field: {
      fieldId: input.field.pseudoFieldId,
      ...(input.field.region !== undefined && { region: input.field.region }),
      areaCoveredHaApprox: input.privacyApplied.approximateAreaHa,
      areaPrecision: input.privacyApplied.areaPrecision,
    },
    machine: {
      machineId: input.machine.pseudoMachineId,
      machineType: input.machine.machineType,
      vendorVisible: input.machine.vendorVisible,
    },
    privacy: input.privacyApplied.privacy,
    publicEvidence: {
      gpsPathPreview: input.privacyApplied.publicEvidence.gpsPathPreview,
      ...(input.privacyApplied.publicEvidence.yieldKgApprox !== undefined && {
        yieldKgApprox: input.privacyApplied.publicEvidence.yieldKgApprox,
      }),
      photoCount: input.privacyApplied.publicEvidence.photoCount,
    },
    privateEvidenceRefs: {
      rawLogHash: input.privateEvidence.rawLogHash,
      gpsPathHash: input.privateEvidence.gpsPathHash,
      photoHashes: input.privateEvidence.photoHashes,
    },
    attestations: [],
    claimBoundary: {
      doesNotCertifyCarbon: true,
      doesNotGuaranteeCompliance: true,
      doesNotExposeMachineLogic: true,
      intendedUse: input.intendedUse ?? [
        "supply_chain_evidence",
        "green_claim_support",
        "rwa_due_diligence",
      ],
    },
  };

  // Validate before returning. If a producer misuses this builder we want a
  // fast, descriptive error rather than a malformed packet entering the DB.
  return fieldEvidencePacketSchema.parse(packet);
}

/**
 * Canonical hash of a packet — the value that gets anchored to Constellation.
 *
 * Important: the hash is computed over the entire packet, *including*
 * attestations. This means signing a packet changes its hash. The convention
 * used by the API is:
 *   - draft packet → packetHashDraft  (attestations: [])
 *   - signed packet → packetHash      (attestations: [farmerAttestation])
 * Only the signed-form hash is submitted to Constellation.
 */
export function packetHash(packet: FieldEvidencePacket): Sha256Ref {
  return canonicalSha256Ref(packet);
}
