import { z } from "zod";
import {
  isoDateTimeSchema,
  latLngSchema,
  operationTypeSchema,
  sha256RefSchema,
} from "./common.js";

// Raw machine session — what the importer accepts.
// All hashes are optional in the import payload because the importer
// computes them from the raw session if absent.
export const machineSessionImportSchema = z
  .object({
    machineCode: z.string().min(1),
    fieldCode: z.string().min(1),
    operationType: operationTypeSchema,
    crop: z.string().min(1).max(60),
    startedAt: isoDateTimeSchema,
    endedAt: isoDateTimeSchema,
    areaCoveredHa: z.number().positive().max(100000),
    yieldKgApprox: z.number().nonnegative().max(1_000_000_000).optional(),
    gpsPathHash: sha256RefSchema.optional(),
    gpsPathPreview: z.array(latLngSchema).min(2).max(2000),
    photoHashes: z.array(sha256RefSchema).max(500).default([]),
    rawLogHash: sha256RefSchema.optional(),
    rawLog: z.unknown().optional(),
    operatorAttestation: z.string().max(120).optional(),
  })
  .refine((s) => new Date(s.endedAt).getTime() > new Date(s.startedAt).getTime(), {
    message: "endedAt must be after startedAt",
    path: ["endedAt"],
  });
export type MachineSessionImport = z.infer<typeof machineSessionImportSchema>;

export const machineSessionSimulateInputSchema = z.object({
  fieldId: z.string().uuid(),
  machineId: z.string().uuid(),
  operationType: operationTypeSchema.default("HARVEST"),
  crop: z.string().min(1).max(60).default("wheat"),
});
export type MachineSessionSimulateInput = z.infer<
  typeof machineSessionSimulateInputSchema
>;

export const machineSessionRecordSchema = z.object({
  id: z.string().uuid(),
  fieldId: z.string().uuid(),
  machineId: z.string().uuid(),
  operationType: operationTypeSchema,
  crop: z.string(),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema,
  areaCoveredHa: z.number(),
  yieldKgApprox: z.number().nullable(),
  rawLogHash: sha256RefSchema,
  gpsPathHash: sha256RefSchema,
  gpsPathPreview: z.array(latLngSchema),
  photoHashes: z.array(sha256RefSchema),
  importSource: z.enum(["json", "simulator"]),
  createdAt: isoDateTimeSchema,
});
export type MachineSessionRecord = z.infer<typeof machineSessionRecordSchema>;
