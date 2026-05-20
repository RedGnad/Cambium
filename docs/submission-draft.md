# Cambium MRV - Submission Draft

## One-Liner

Cambium MRV turns autonomous farm operations into privacy-preserving, tamper-evident evidence packets for green-claim substantiation, supply-chain due diligence and RWA review.

## Problem

Buyers, auditors and finance teams increasingly need field-level evidence. Farmers and machine operators cannot safely publish raw autonomous-machine telemetry because it can expose location, yield, safety behavior, navigation strategy and proprietary machine logic.

## Solution

Cambium creates a proof layer above the private machine layer:

```text
machine session
  -> privacy transform
  -> evidence packet
  -> canonical hash
  -> signature
  -> Constellation fingerprint
  -> public verification page
  -> PDF report
```

## Why Blockchain

The blockchain layer is not used for tokens or speculation. It is used as a public, tamper-evident timestamp and fingerprint layer for an evidence packet whose raw source data stays private.

## What Is Built

- Fastify API with Prisma/PostgreSQL.
- Next.js UI.
- Zod schemas for fields, machines, sessions and packets.
- Privacy transforms.
- Canonical hashing.
- secp256k1 demo signer and verifier.
- Constellation Digital Evidence adapter in mock mode.
- Public verifier.
- PDF report.
- Seeded demo flow.

## Claim Boundary

Cambium is not an EUDR compliance product, carbon-credit registry, legal verifier or token marketplace.

Cambium produces upstream, privacy-preserving field evidence that can support due-diligence and audit workflows.

## Demo

```bash
pnpm install
pnpm db:up
pnpm --filter @cambium/api db:migrate
pnpm seed:demo
pnpm dev
```

Then:

```text
Run demo flow -> Generate evidence packet -> Sign -> Submit -> Verify -> Export PDF
```

The seed command also prepares a signed and submitted demo packet so the verification page and PDF can be opened even if the presenter skips manual setup.
