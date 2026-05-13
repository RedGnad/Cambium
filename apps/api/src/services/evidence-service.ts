import { randomUUID } from "node:crypto";
import {
  applyPrivacyTransform,
  buildConstellationPayload,
  buildEvidencePacket,
  canonicalSha256Ref,
  createConstellationAdapter,
  fieldEvidencePacketSchema,
  packetHash,
  signCanonical,
  verifyCanonical,
  type FieldEvidencePacket,
  type LatLng,
  type PacketAttestation,
  type PrivacyLevel,
  type Sha256Ref,
} from "@cambium/shared";
import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";

// Generates a ULID-shaped packet id without adding a ULID dependency.
function newPacketId(): string {
  const ts = Date.now().toString(36).toUpperCase().padStart(10, "0");
  const rand = randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  return `fep_${ts}${rand}`;
}

function deriveSlug(hash: Sha256Ref): string {
  return hash.replace(/^sha256:/, "");
}

export interface CreatePacketFromSessionOptions {
  sessionId: string;
  privacyLevel?: PrivacyLevel; // overrides field-level default
}

export interface PacketWithMeta {
  id: string;
  packet: FieldEvidencePacket;
  packetHash: Sha256Ref;
  status: string;
  publicVerifySlug: string;
  privacyReport: ReturnType<typeof applyPrivacyTransform>["transformReport"];
}

export async function createPacketFromSession(
  opts: CreatePacketFromSessionOptions
): Promise<PacketWithMeta> {
  const session = await prisma.machineSession.findUnique({
    where: { id: opts.sessionId },
    include: { field: true, machine: true },
  });
  if (!session) {
    throw Object.assign(new Error("session not found"), { statusCode: 404 });
  }

  const privacyLevel: PrivacyLevel =
    opts.privacyLevel ?? ((session.field.privacyLevel as PrivacyLevel) || "standard");

  const privacyApplied = applyPrivacyTransform({
    privacyLevel,
    gpsPathPreview: session.gpsPathPreview as LatLng[],
    areaCoveredHa: Number(session.areaCoveredHa),
    yieldKgApprox:
      session.yieldKgApprox !== null ? Number(session.yieldKgApprox) : undefined,
    photoCount: (session.photoHashes as string[]).length,
  });

  const draft = buildEvidencePacket({
    packetId: newPacketId(),
    createdAt: new Date().toISOString(),
    operation: {
      type: session.operationType as FieldEvidencePacket["operation"]["type"],
      crop: session.crop ?? "unknown",
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt.toISOString(),
    },
    field: {
      pseudoFieldId: session.field.fieldCode,
      region: session.field.region ?? undefined,
    },
    machine: {
      pseudoMachineId: session.machine.machineCode,
      machineType: session.machine.machineType,
      vendorVisible: session.machine.vendorVisible,
    },
    privacyApplied,
    privateEvidence: {
      rawLogHash: session.rawLogHash as Sha256Ref,
      gpsPathHash: session.gpsPathHash as Sha256Ref,
      photoHashes: session.photoHashes as Sha256Ref[],
    },
  });

  const draftHash = packetHash(draft);
  const slug = deriveSlug(draftHash);

  const record = await prisma.evidencePacket.create({
    data: {
      sessionId: session.id,
      packetSchema: draft.schema,
      packetJson: draft as object,
      packetHash: draftHash,
      assuranceLevel: draft.assuranceLevel,
      status: "draft",
      publicVerifySlug: slug,
    },
  });

  return {
    id: record.id,
    packet: draft,
    packetHash: draftHash,
    status: record.status,
    publicVerifySlug: slug,
    privacyReport: privacyApplied.transformReport,
  };
}

export interface SignPacketOptions {
  evidencePacketId: string;
  signerId: string;
  statement?: string;
  signatureMode: "demo_server_signer";
}

export async function signEvidencePacket(
  opts: SignPacketOptions
): Promise<PacketWithMeta> {
  const record = await prisma.evidencePacket.findUnique({
    where: { id: opts.evidencePacketId },
  });
  if (!record) {
    throw Object.assign(new Error("evidence packet not found"), { statusCode: 404 });
  }
  if (record.status !== "draft") {
    throw Object.assign(
      new Error(`packet is ${record.status}, only drafts can be signed`),
      { statusCode: 409 }
    );
  }

  const draft = fieldEvidencePacketSchema.parse(record.packetJson);
  if (draft.attestations.length > 0) {
    throw Object.assign(new Error("draft already has attestations"), { statusCode: 409 });
  }

  // Sign the canonical draft form (attestations: []).
  const { signatureHex } = signCanonical(draft, env.DEMO_SIGNER_PRIVATE_KEY);
  const ok = verifyCanonical(draft, signatureHex, env.DEMO_SIGNER_PUBLIC_KEY);
  if (!ok) {
    throw new Error("internal signer/verifier mismatch — refusing to store invalid signature");
  }

  const attestation: PacketAttestation = {
    type: "demo_signer",
    signerId: opts.signerId,
    statement:
      opts.statement ??
      "I attest that this packet represents a field operation generated from machine session data.",
    signature: signatureHex,
    publicKeyHex: env.DEMO_SIGNER_PUBLIC_KEY,
    signedAt: new Date().toISOString(),
  };

  const signed: FieldEvidencePacket = {
    ...draft,
    attestations: [attestation],
  };
  fieldEvidencePacketSchema.parse(signed);

  const signedHash = packetHash(signed);
  const slug = deriveSlug(signedHash);

  const updated = await prisma.evidencePacket.update({
    where: { id: record.id },
    data: {
      packetJson: signed as object,
      packetHash: signedHash,
      farmerSignature: signatureHex,
      publicVerifySlug: slug,
      status: "signed",
      signedAt: new Date(),
    },
  });

  return {
    id: updated.id,
    packet: signed,
    packetHash: signedHash,
    status: updated.status,
    publicVerifySlug: slug,
    privacyReport: {
      privacyLevel: "standard",
      transforms: [],
      warnings: [],
    },
  };
}

export interface SubmitPacketResult {
  id: string;
  packetHash: Sha256Ref;
  status: string;
  constellation: {
    mode: "mock" | "live";
    eventId: string;
    hash: Sha256Ref;
    accepted: boolean;
    message: string;
  };
  verifyUrl: string;
}

export async function submitEvidencePacket(
  evidencePacketId: string
): Promise<SubmitPacketResult> {
  const record = await prisma.evidencePacket.findUnique({
    where: { id: evidencePacketId },
  });
  if (!record) {
    throw Object.assign(new Error("evidence packet not found"), { statusCode: 404 });
  }
  if (record.status !== "signed") {
    throw Object.assign(
      new Error(`packet status is ${record.status}, must be 'signed' before submit`),
      { statusCode: 409 }
    );
  }

  const packet = fieldEvidencePacketSchema.parse(record.packetJson);
  const attestation = packet.attestations[0];
  if (!attestation) {
    throw new Error("signed packet has no attestation");
  }

  const adapter = createConstellationAdapter({
    mode: env.CONSTELLATION_MODE,
    apiBaseUrl: env.CONSTELLATION_API_BASE_URL,
    apiKey: env.CONSTELLATION_API_KEY,
  });

  const eventId = randomUUID();
  const timestamp = new Date().toISOString();

  const payload = buildConstellationPayload({
    packet,
    packetHash: record.packetHash as Sha256Ref,
    signerPublicKeyHex: attestation.publicKeyHex,
    signatureHex: attestation.signature,
    signerId: attestation.signerId,
    eventId,
    timestamp,
    orgId: env.CONSTELLATION_ORG_ID,
    tenantId: env.CONSTELLATION_TENANT_ID,
  });

  const result = await adapter.submit(payload);

  await prisma.$transaction([
    prisma.constellationSubmission.create({
      data: {
        evidencePacketId: record.id,
        constellationEventId: result.eventId,
        constellationHash: result.hash,
        accepted: result.accepted,
        message: result.message,
        requestPayload: payload as object,
        responsePayload: result as object,
        mode: result.mode,
      },
    }),
    prisma.evidencePacket.update({
      where: { id: record.id },
      data: {
        status: result.accepted ? "submitted" : "disputed",
        submittedAt: new Date(),
      },
    }),
  ]);

  return {
    id: record.id,
    packetHash: record.packetHash as Sha256Ref,
    status: result.accepted ? "submitted" : "disputed",
    constellation: {
      mode: result.mode,
      eventId: result.eventId,
      hash: result.hash,
      accepted: result.accepted,
      message: result.message,
    },
    verifyUrl: `${env.APP_BASE_URL}/verify/${deriveSlug(record.packetHash as Sha256Ref)}`,
  };
}

export interface VerifyResult {
  status: "verified" | "tampered" | "not_found";
  packetHash: Sha256Ref;
  packet?: FieldEvidencePacket;
  constellation?: {
    mode: "mock" | "live";
    eventId: string | null;
    accepted: boolean | null;
    submittedAt: string | null;
  };
  signatureValid?: boolean;
}

export async function verifyByHashOrSlug(hashOrSlug: string): Promise<VerifyResult> {
  const candidates = [
    hashOrSlug,
    hashOrSlug.startsWith("sha256:") ? hashOrSlug : `sha256:${hashOrSlug}`,
  ];

  const record = await prisma.evidencePacket.findFirst({
    where: {
      OR: [
        { packetHash: { in: candidates } },
        { publicVerifySlug: hashOrSlug.replace(/^sha256:/, "") },
      ],
    },
    include: { constellationSubmissions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!record) {
    return { status: "not_found", packetHash: `sha256:${"0".repeat(64)}` };
  }

  // Hash the RAW packet JSON before any schema parsing. Zod's default
  // .strip() mode would silently drop unknown fields injected by a
  // tamperer, masking the tamper. The canonical hash must reflect the
  // exact stored document.
  const rawRecomputed = canonicalSha256Ref(record.packetJson);
  const hashMatches = rawRecomputed === record.packetHash;

  // Parse for display, but only after hash check.
  let packet: FieldEvidencePacket | undefined;
  let schemaValid = true;
  try {
    packet = fieldEvidencePacketSchema.parse(record.packetJson);
  } catch {
    schemaValid = false;
  }

  if (!hashMatches || !schemaValid) {
    return {
      status: "tampered",
      packetHash: record.packetHash as Sha256Ref,
      packet,
      signatureValid: false,
    };
  }

  const attestation = packet!.attestations[0];
  const signatureValid = attestation
    ? verifyCanonical(
        { ...packet!, attestations: [] },
        attestation.signature,
        attestation.publicKeyHex
      )
    : undefined;

  const submission = record.constellationSubmissions[0];

  return {
    status: "verified",
    packetHash: record.packetHash as Sha256Ref,
    packet,
    constellation: submission
      ? {
          mode: submission.mode as "mock" | "live",
          eventId: submission.constellationEventId,
          accepted: submission.accepted,
          submittedAt: submission.createdAt.toISOString(),
        }
      : undefined,
    signatureValid,
  };
}
