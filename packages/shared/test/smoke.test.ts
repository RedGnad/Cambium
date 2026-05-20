import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyPrivacyTransform,
  buildEvidencePacket,
  buildConstellationContent,
  buildConstellationPayload,
  canonicalJsonStringify,
  canonicalSha256Ref,
  fieldEvidencePacketSchema,
  generateKeyPair,
  LiveConstellationAdapter,
  MockConstellationAdapter,
  packetHash,
  signCanonical,
  signConstellationFingerprint,
  verifyCanonical,
  verifyConstellationFingerprint,
} from "../src/index.js";

test("canonical JSON sorts keys deterministically", () => {
  const a = canonicalJsonStringify({ b: 2, a: 1, c: { z: 9, y: 8 } });
  const b = canonicalJsonStringify({ c: { y: 8, z: 9 }, a: 1, b: 2 });
  assert.equal(a, b);
  assert.equal(a, '{"a":1,"b":2,"c":{"y":8,"z":9}}');
});

test("canonical hash is stable across key reordering", () => {
  const h1 = canonicalSha256Ref({ a: 1, b: { x: 10, y: 20 } });
  const h2 = canonicalSha256Ref({ b: { y: 20, x: 10 }, a: 1 });
  assert.equal(h1, h2);
  assert.match(h1, /^sha256:[0-9a-f]{64}$/);
});

test("canonical hash detects tampering", () => {
  const h1 = canonicalSha256Ref({ a: 1 });
  const h2 = canonicalSha256Ref({ a: 2 });
  assert.notEqual(h1, h2);
});

test("end-to-end: build → sign → verify → submit", async () => {
  const privacyApplied = applyPrivacyTransform({
    privacyLevel: "standard",
    gpsPathPreview: [
      [48.8566, 2.3522],
      [48.8568, 2.3525],
      [48.8569, 2.3526],
    ],
    areaCoveredHa: 1.42,
    yieldKgApprox: 860,
    photoCount: 2,
  });

  const draft = buildEvidencePacket({
    packetId: "fep_test_0001",
    createdAt: "2026-06-12T11:05:00.000Z",
    operation: {
      type: "HARVEST",
      crop: "wheat",
      startedAt: "2026-06-12T09:15:00.000Z",
      endedAt: "2026-06-12T10:42:00.000Z",
    },
    field: { pseudoFieldId: "field_pseudo_test", region: "FR-IDF" },
    machine: {
      pseudoMachineId: "machine_pseudo_test",
      machineType: "autonomous_harvester",
      vendorVisible: false,
    },
    privacyApplied,
    privateEvidence: {
      rawLogHash: "sha256:" + "a".repeat(64),
      gpsPathHash: "sha256:" + "b".repeat(64),
      photoHashes: ["sha256:" + "c".repeat(64), "sha256:" + "d".repeat(64)],
    },
  });

  // Re-parsing must succeed.
  fieldEvidencePacketSchema.parse(draft);

  const keys = generateKeyPair();
  const { signatureHex } = signCanonical(draft, keys.privateKeyHex);
  assert.ok(verifyCanonical(draft, signatureHex, keys.publicKeyHex));

  // Tamper detection: changing one byte breaks verification.
  const tampered = { ...draft, packetId: "fep_test_0002" };
  assert.equal(verifyCanonical(tampered, signatureHex, keys.publicKeyHex), false);

  // Add attestation, recompute hash, submit to mock Constellation.
  const signed = {
    ...draft,
    attestations: [
      {
        type: "demo_signer" as const,
        signerId: "test_signer",
        statement: "I attest this packet represents a field operation.",
        signature: signatureHex,
        publicKeyHex: keys.publicKeyHex,
        signedAt: "2026-06-12T11:06:00.000Z",
      },
    ],
  };
  const hash = packetHash(signed);

  const contentInput = {
    packet: signed,
    packetHash: hash,
    signerId: "test_signer",
    eventId: "00000000-0000-4000-8000-000000000000",
    timestamp: "2026-06-12T11:06:01.000Z",
    orgId: "test-org",
    tenantId: "test-tenant",
  };
  const constellationContent = buildConstellationContent(contentInput);
  const constellationSignature = signConstellationFingerprint(
    constellationContent,
    keys.privateKeyHex
  );
  assert.ok(
    verifyConstellationFingerprint(
      constellationContent,
      constellationSignature.signatureHex,
      keys.publicKeyHex
    )
  );

  const payload = buildConstellationPayload({
    ...contentInput,
    signerPublicKeyHex: keys.publicKeyHex,
    signatureHex: constellationSignature.signatureHex,
  });
  assert.equal(payload.attestation.content.documentRef, hash.replace(/^sha256:/, ""));

  const adapter = new MockConstellationAdapter();
  const result = await adapter.submit(payload);
  assert.equal(result.accepted, true);
  assert.equal(result.mode, "mock");
  assert.equal(result.hash, hash);
});

test("live Constellation adapter posts official fingerprints payload", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const adapter = new LiveConstellationAdapter({
    apiBaseUrl: "https://de-api.constellationnetwork.io/v1",
    apiKey: "test-key",
    fetchImpl: (async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify([
          {
            eventId: "00000000-0000-4000-8000-000000000001",
            hash: "a".repeat(64),
            accepted: true,
            message: "accepted",
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as typeof fetch,
  });

  const payload = {
    attestation: {
      content: {
        orgId: "00000000-0000-4000-8000-000000000001",
        tenantId: "00000000-0000-4000-8000-000000000002",
        eventId: "00000000-0000-4000-8000-000000000003",
        signerId: "test",
        documentId: "cambium:fep_test",
        documentRef: "b".repeat(64),
        timestamp: "2026-06-12T11:06:01.000Z",
        version: 1 as const,
      },
      proofs: [
        {
          id: "02" + "c".repeat(64),
          signature: "d".repeat(128),
          algorithm: "SECP256K1_RFC8785_V1" as const,
        },
      ],
    },
    metadata: {
      hash: "b".repeat(64),
      tags: { project: "Cambium MRV" },
    },
  };

  const result = await adapter.submit(payload);
  assert.equal(result.mode, "live");
  assert.equal(result.hash, `sha256:${"a".repeat(64)}`);
  assert.equal(calls[0]?.url, "https://de-api.constellationnetwork.io/v1/fingerprints");
  assert.equal((calls[0]?.init.headers as Record<string, string>)["X-API-Key"], "test-key");
  assert.equal(calls[0]?.init.body, JSON.stringify([payload]));
});
