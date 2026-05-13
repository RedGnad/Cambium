import { z } from "zod";
import { privacyLevelSchema } from "./common.js";

export const fieldCreateInputSchema = z.object({
  displayName: z.string().min(1).max(120),
  fieldCode: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9_-]+$/i, "lowercase alphanumeric, dash and underscore only"),
  region: z.string().min(2).max(20).optional(),
  cropDefault: z.string().min(1).max(60).optional(),
  approximateAreaHa: z.number().positive().max(100000).optional(),
  privacyLevel: privacyLevelSchema.default("standard"),
});
export type FieldCreateInput = z.infer<typeof fieldCreateInputSchema>;

export const fieldRecordSchema = fieldCreateInputSchema.extend({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  createdAt: z.string().datetime({ offset: true }),
});
export type FieldRecord = z.infer<typeof fieldRecordSchema>;
