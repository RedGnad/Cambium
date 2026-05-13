import { z } from "zod";
import { hexPubKeySchema } from "./common.js";

export const machineTypeSchema = z.enum([
  "autonomous_harvester",
  "autonomous_tractor",
  "autonomous_sprayer",
  "soil_scanner",
  "uav_scout",
  "ground_sensor_gateway",
  "other",
]);
export type MachineType = z.infer<typeof machineTypeSchema>;

export const machineStatusSchema = z.enum([
  "registered",
  "active",
  "inactive",
  "revoked",
]);
export type MachineStatus = z.infer<typeof machineStatusSchema>;

export const machineCreateInputSchema = z.object({
  machineCode: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9_-]+$/i, "lowercase alphanumeric, dash and underscore only"),
  machineType: machineTypeSchema,
  publicKeyHex: hexPubKeySchema.optional(),
  vendorVisible: z.boolean().default(false),
});
export type MachineCreateInput = z.infer<typeof machineCreateInputSchema>;

export const machineRecordSchema = machineCreateInputSchema.extend({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  status: machineStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
});
export type MachineRecord = z.infer<typeof machineRecordSchema>;
