import type { OperationType } from "@cambium/shared";
import { DEMO_OWNER_ID } from "../lib/constants.js";
import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import {
  createPacketFromSession,
  signEvidencePacket,
  submitEvidencePacket,
} from "./evidence-service.js";
import { renderEvidencePdf } from "./pdf-service.js";
import { simulateSession } from "./session-simulator.js";

const DEMO_FIELD = {
  fieldCode: "field_demo_alpha",
  displayName: "Demo Field Alpha",
  region: "FR-IDF",
  cropDefault: "wheat",
  approximateAreaHa: 4.8,
  privacyLevel: "standard",
};

const DEMO_MACHINE = {
  machineCode: "machine_demo_001",
  machineType: "autonomous_harvester",
  vendorVisible: false,
};

const DEMO_OPERATION: OperationType = "HARVEST";

export interface DemoSeedResult {
  field: {
    id: string;
    fieldCode: string;
    displayName: string;
  };
  machine: {
    id: string;
    machineCode: string;
    machineType: string;
  };
  session: {
    id: string;
    operationType: string;
    crop: string | null;
    importSource: string;
  };
  evidencePacket: {
    id: string;
    packetHash: string;
    status: string;
    publicVerifySlug: string;
  };
  verifyUrl: string;
  pdf: {
    rendered: boolean;
    bytes: number;
  };
  nextPath: string;
}

export async function ensureDemoSeed(): Promise<DemoSeedResult> {
  const field = await prisma.field.upsert({
    where: { fieldCode: DEMO_FIELD.fieldCode },
    update: {
      displayName: DEMO_FIELD.displayName,
      region: DEMO_FIELD.region,
      cropDefault: DEMO_FIELD.cropDefault,
      approximateAreaHa: DEMO_FIELD.approximateAreaHa,
      privacyLevel: DEMO_FIELD.privacyLevel,
    },
    create: {
      ownerId: DEMO_OWNER_ID,
      ...DEMO_FIELD,
    },
  });

  const machine = await prisma.machine.upsert({
    where: { machineCode: DEMO_MACHINE.machineCode },
    update: {
      machineType: DEMO_MACHINE.machineType,
      vendorVisible: DEMO_MACHINE.vendorVisible,
    },
    create: {
      ownerId: DEMO_OWNER_ID,
      ...DEMO_MACHINE,
    },
  });

  const existingSession = await prisma.machineSession.findFirst({
    where: {
      fieldId: field.id,
      machineId: machine.id,
      operationType: DEMO_OPERATION,
      crop: DEMO_FIELD.cropDefault,
      importSource: "demo_seed",
    },
    orderBy: { createdAt: "desc" },
  });

  const session =
    existingSession ??
    (await prisma.machineSession.create({
      data: {
        fieldId: field.id,
        machineId: machine.id,
        importSource: "demo_seed",
        ...sessionDataForSeed(field.fieldCode, machine.machineCode),
      },
    }));

  const evidencePacket = await ensureSubmittedEvidencePacket(session.id);
  const publicVerifySlug =
    evidencePacket.publicVerifySlug ?? evidencePacket.packetHash.replace(/^sha256:/, "");
  const verifyUrl = `${env.APP_BASE_URL}/verify/${publicVerifySlug}`;
  const pdfBytes = await renderSeedPdf(evidencePacket.id, verifyUrl);

  return {
    field: {
      id: field.id,
      fieldCode: field.fieldCode,
      displayName: field.displayName,
    },
    machine: {
      id: machine.id,
      machineCode: machine.machineCode,
      machineType: machine.machineType,
    },
    session: {
      id: session.id,
      operationType: session.operationType,
      crop: session.crop,
      importSource: session.importSource,
    },
    evidencePacket: {
      id: evidencePacket.id,
      packetHash: evidencePacket.packetHash,
      status: evidencePacket.status,
      publicVerifySlug,
    },
    verifyUrl,
    pdf: {
      rendered: true,
      bytes: pdfBytes,
    },
    nextPath: `/sessions/${session.id}`,
  };
}

async function ensureSubmittedEvidencePacket(sessionId: string) {
  const existingSubmitted = await prisma.evidencePacket.findFirst({
    where: { sessionId, status: "submitted" },
    orderBy: { createdAt: "desc" },
  });
  if (existingSubmitted) return existingSubmitted;

  const reusable = await prisma.evidencePacket.findFirst({
    where: {
      sessionId,
      status: { in: ["draft", "signed"] },
    },
    orderBy: { createdAt: "desc" },
  });

  const draft =
    reusable ??
    (await createPacketFromSession({
      sessionId,
      privacyLevel: "standard",
    }));

  const draftId = draft.id;
  const current = await prisma.evidencePacket.findUniqueOrThrow({
    where: { id: draftId },
  });

  if (current.status === "draft") {
    await signEvidencePacket({
      evidencePacketId: current.id,
      signerId: "farmer_demo_001",
      statement:
        "Demo attestation: this packet represents a simulated autonomous harvest session for Cambium MRV.",
      signatureMode: "demo_server_signer",
    });
  }

  const signed = await prisma.evidencePacket.findUniqueOrThrow({
    where: { id: current.id },
  });
  if (signed.status === "signed") {
    await submitEvidencePacket(signed.id);
  }

  return prisma.evidencePacket.findUniqueOrThrow({
    where: { id: current.id },
  });
}

async function renderSeedPdf(evidencePacketId: string, verifyUrl: string): Promise<number> {
  const row = await prisma.evidencePacket.findUniqueOrThrow({
    where: { id: evidencePacketId },
    include: { constellationSubmissions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const pdf = await renderEvidencePdf({
    packetJson: row.packetJson as object,
    packetHash: row.packetHash,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    signedAt: row.signedAt?.toISOString() ?? null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    verificationUrl: verifyUrl,
    submission: row.constellationSubmissions[0]
      ? {
          mode: row.constellationSubmissions[0].mode,
          eventId: row.constellationSubmissions[0].constellationEventId,
          accepted: row.constellationSubmissions[0].accepted,
        }
      : null,
  });
  return pdf.byteLength;
}

function sessionDataForSeed(fieldCode: string, machineCode: string) {
  const sim = simulateSession({
    fieldCode,
    machineCode,
    operationType: DEMO_OPERATION,
    crop: DEMO_FIELD.cropDefault,
    seed: "cambium-top1-demo-harvest-v1",
  });

  return {
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
  };
}
