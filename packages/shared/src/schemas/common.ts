import { z } from "zod";

export const operationTypeSchema = z.enum([
  "HARVEST",
  "SOIL_SCAN",
  "SPRAYING",
  "MACHINE_PASS",
  "PHOTO_CAPTURE",
  "SENSOR_LOG",
]);
export type OperationType = z.infer<typeof operationTypeSchema>;

export const privacyLevelSchema = z.enum(["low", "standard", "high"]);
export type PrivacyLevel = z.infer<typeof privacyLevelSchema>;

export const assuranceLevelSchema = z.enum([
  "AL0",
  "AL1",
  "AL2",
  "AL3",
  "AL4",
  "AL5",
]);
export type AssuranceLevel = z.infer<typeof assuranceLevelSchema>;

export const packetStatusSchema = z.enum([
  "draft",
  "signed",
  "submitted",
  "verified",
  "disputed",
  "revoked",
]);
export type PacketStatus = z.infer<typeof packetStatusSchema>;

export const constellationModeSchema = z.enum(["mock", "live"]);
export type ConstellationMode = z.infer<typeof constellationModeSchema>;

// SHA-256 multihash-style prefixed hex string, e.g. "sha256:abcd..."
export const sha256RefSchema = z
  .string()
  .regex(/^sha256:[0-9a-f]{64}$/i, "expected sha256:<64-hex>");
export type Sha256Ref = z.infer<typeof sha256RefSchema>;

// secp256k1 compressed or uncompressed pubkey, hex-encoded (with or without 0x).
export const hexPubKeySchema = z
  .string()
  .regex(/^(0x)?[0-9a-f]{66}([0-9a-f]{64})?$/i, "expected secp256k1 hex pubkey");
export type HexPubKey = z.infer<typeof hexPubKeySchema>;

// secp256k1 signature, hex-encoded (compact 64-byte or DER).
export const hexSignatureSchema = z
  .string()
  .regex(/^(0x)?[0-9a-f]{128,144}$/i, "expected secp256k1 hex signature");
export type HexSignature = z.infer<typeof hexSignatureSchema>;

export const isoDateTimeSchema = z.string().datetime({ offset: true });

// [latitude, longitude] tuple
export const latLngSchema = z.tuple([
  z.number().min(-90).max(90),
  z.number().min(-180).max(180),
]);
export type LatLng = z.infer<typeof latLngSchema>;
