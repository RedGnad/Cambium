import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 as nobleSha256 } from "@noble/hashes/sha256";
import { sha512 } from "@noble/hashes/sha512";
import { bytesToHex, hexToBytes } from "./hash.js";
import { canonicalJsonBytes } from "./canonical.js";

export interface SecpKeyPair {
  privateKeyHex: string;
  publicKeyHex: string; // 33-byte compressed, hex
}

export function generateKeyPair(): SecpKeyPair {
  const priv = secp256k1.utils.randomPrivateKey();
  const pub = secp256k1.getPublicKey(priv, true);
  return {
    privateKeyHex: bytesToHex(priv),
    publicKeyHex: bytesToHex(pub),
  };
}

export function publicKeyFromPrivateKey(
  privateKeyHex: string,
  compressed = true
): string {
  return bytesToHex(secp256k1.getPublicKey(hexToBytes(privateKeyHex), compressed));
}

/**
 * Signs a canonical-JSON-encoded value using secp256k1.
 * The signed digest is sha256(canonicalJson(value)) — the same digest
 * that produces the packetHash. This binds the signature to the
 * canonical packet, not to a particular serialization.
 *
 * Returns a 64-byte compact signature, hex-encoded.
 */
export function signCanonical(
  value: unknown,
  privateKeyHex: string
): { signatureHex: string; digestHex: string } {
  const bytes = canonicalJsonBytes(value);
  const digest = nobleSha256(bytes);
  const priv = hexToBytes(privateKeyHex);
  const sig = secp256k1.sign(digest, priv);
  return {
    signatureHex: sig.toCompactHex(),
    digestHex: bytesToHex(digest),
  };
}

/**
 * Verifies a canonical-JSON signature.
 * Recomputes the canonical encoding and digest before verifying.
 */
export function verifyCanonical(
  value: unknown,
  signatureHex: string,
  publicKeyHex: string
): boolean {
  try {
    const bytes = canonicalJsonBytes(value);
    const digest = nobleSha256(bytes);
    const pub = hexToBytes(publicKeyHex);
    const sig = hexToBytes(
      signatureHex.startsWith("0x") ? signatureHex.slice(2) : signatureHex
    );
    return secp256k1.verify(sig, digest, pub);
  } catch {
    return false;
  }
}

/**
 * Verifies a raw digest signature (when you already have the digest bytes,
 * e.g. for Constellation submission flows where the digest is the packetHash).
 */
export function verifyDigest(
  digestHex: string,
  signatureHex: string,
  publicKeyHex: string
): boolean {
  try {
    const digest = hexToBytes(digestHex);
    const pub = hexToBytes(publicKeyHex);
    const sig = hexToBytes(
      signatureHex.startsWith("0x") ? signatureHex.slice(2) : signatureHex
    );
    return secp256k1.verify(sig, digest, pub);
  } catch {
    return false;
  }
}

/**
 * Constellation Digital Evidence signature protocol.
 *
 * Docs require:
 *   1. RFC 8785 canonical JSON over the FingerprintValue content.
 *   2. SHA-256 of those UTF-8 bytes.
 *   3. Convert that digest to hex, treat it as UTF-8 bytes.
 *   4. SHA-512 over those hex bytes, truncated to 32 bytes.
 *   5. ECDSA secp256k1 signature encoded as DER hex.
 */
export function signConstellationFingerprint(
  fingerprintValue: unknown,
  privateKeyHex: string
): { signatureHex: string; digestHex: string } {
  const canonicalBytes = canonicalJsonBytes(fingerprintValue);
  const sha256Bytes = nobleSha256(canonicalBytes);
  const sha256Hex = bytesToHex(sha256Bytes);
  const sha512Bytes = sha512(new TextEncoder().encode(sha256Hex));
  const digest = sha512Bytes.slice(0, 32);
  const priv = hexToBytes(privateKeyHex);
  const sig = secp256k1.sign(digest, priv);
  return {
    signatureHex: sig.toDERHex(),
    digestHex: bytesToHex(digest),
  };
}

export function verifyConstellationFingerprint(
  fingerprintValue: unknown,
  signatureHex: string,
  publicKeyHex: string
): boolean {
  try {
    const canonicalBytes = canonicalJsonBytes(fingerprintValue);
    const sha256Bytes = nobleSha256(canonicalBytes);
    const sha256Hex = bytesToHex(sha256Bytes);
    const sha512Bytes = sha512(new TextEncoder().encode(sha256Hex));
    const digest = sha512Bytes.slice(0, 32);
    const pub = hexToBytes(publicKeyHex);
    const sig = hexToBytes(
      signatureHex.startsWith("0x") ? signatureHex.slice(2) : signatureHex
    );
    return secp256k1.verify(sig, digest, pub);
  } catch {
    return false;
  }
}
