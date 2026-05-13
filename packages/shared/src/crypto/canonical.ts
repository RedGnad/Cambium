/**
 * Minimal RFC 8785 (JSON Canonicalization Scheme) implementation.
 *
 * Guarantees:
 *  - Object keys are sorted lexicographically by UTF-16 code units.
 *  - No insignificant whitespace.
 *  - String escaping matches JSON.stringify (ECMA-404).
 *  - Numbers use ECMAScript Number.prototype.toString, matching JCS §3.2.2.
 *
 * Limitations vs full RFC 8785:
 *  - Does not normalize Unicode in strings (JCS requires NFC).
 *    Inputs must already be NFC-normalized. We document this rather than
 *    silently apply NFC because re-normalizing in the signer is expensive
 *    and can mask producer-side bugs.
 *
 * This module must remain dependency-free.
 */

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [k: string]: Json };

function isPlainObject(value: unknown): value is Record<string, Json> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function encodeNumber(n: number): string {
  if (!Number.isFinite(n)) {
    throw new Error(`canonical JSON does not support non-finite number: ${n}`);
  }
  // Negative zero is canonicalized to positive zero (JCS §3.2.2.3).
  if (Object.is(n, -0)) return "0";
  return String(n);
}

function encodeString(s: string): string {
  return JSON.stringify(s);
}

function encode(value: Json): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return encodeNumber(value);
  if (typeof value === "string") return encodeString(value);
  if (Array.isArray(value)) {
    return "[" + value.map(encode).join(",") + "]";
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    const parts: string[] = [];
    for (const k of keys) {
      const v = value[k];
      if (v === undefined) continue;
      parts.push(encodeString(k) + ":" + encode(v));
    }
    return "{" + parts.join(",") + "}";
  }
  throw new Error(
    `canonical JSON: unsupported value type at encode: ${typeof value}`
  );
}

/**
 * Serializes a value as canonical JSON.
 *
 * Throws if the input contains non-finite numbers, undefined values at the
 * top level, functions, symbols, Dates, Maps, Sets, class instances, or other
 * non-JSON values. Sanitize before calling.
 */
export function canonicalJsonStringify(value: unknown): string {
  return encode(value as Json);
}

/**
 * Returns a UTF-8 byte buffer of the canonical encoding.
 * This is what hash and signature inputs should consume.
 */
export function canonicalJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalJsonStringify(value));
}
