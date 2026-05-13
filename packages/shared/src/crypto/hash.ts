import { sha256 as nobleSha256 } from "@noble/hashes/sha256";
import { canonicalJsonBytes } from "./canonical.js";
import type { Sha256Ref } from "../schemas/common.js";

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]!;
    out += byte.toString(16).padStart(2, "0");
  }
  return out;
}

export function sha256Hex(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return toHex(nobleSha256(bytes));
}

export function sha256Ref(input: Uint8Array | string): Sha256Ref {
  return `sha256:${sha256Hex(input)}`;
}

/**
 * Canonical hash of a JSON-serializable value.
 * Uses canonical JSON (RFC 8785-like) so two structurally identical inputs
 * always produce the same hash, regardless of key ordering or formatting.
 */
export function canonicalSha256Ref(value: unknown): Sha256Ref {
  return sha256Ref(canonicalJsonBytes(value));
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) {
    throw new Error("hex string has odd length");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return toHex(bytes);
}
