import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 as nobleSha256 } from "@noble/hashes/sha256";
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
