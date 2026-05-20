import type { OperationType } from "@cambium/shared";
import { DEMO_OWNER_ID } from "../lib/constants.js";
import { prisma } from "../lib/prisma.js";
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
    nextPath: `/sessions/${session.id}`,
  };
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
