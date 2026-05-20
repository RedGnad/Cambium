# Cambium MRV - Architecture

## System Shape

```text
apps/web       Next.js App Router, Tailwind, Leaflet
apps/api       Fastify, Prisma, PostgreSQL
packages/shared
  schemas      Zod packet/session/field/machine schemas
  privacy      GPS, yield and public-preview transforms
  crypto       canonical JSON, SHA-256, secp256k1 helpers
  evidence     Field Evidence Packet builder
  constellation Digital Evidence payload adapter
```

## Main Flow

```text
Field + machine registration
  -> machine session import or simulation
  -> privacy preview
  -> evidence packet build
  -> canonical packet hash
  -> demo signature
  -> Constellation mock/live adapter
  -> public verification
  -> PDF report
```

## API Surfaces

- `POST /api/fields`
- `GET /api/fields`
- `POST /api/machines`
- `GET /api/machines`
- `POST /api/sessions/import`
- `POST /api/sessions/simulate`
- `GET /api/sessions`
- `POST /api/privacy/preview-transform`
- `POST /api/evidence/from-session/:sessionId`
- `POST /api/evidence/:id/sign`
- `POST /api/evidence/:id/submit`
- `GET /api/evidence/:id/pdf`
- `GET /api/verify/:hash`
- `POST /api/demo/seed`
- `GET /api/integrations/constellation`

## Trust Boundary

The public verifier never receives raw logs, exact GPS, firmware, safety logic or full-resolution photos.

The public verifier receives:

- packet hash;
- pseudonymous field ID;
- pseudonymous machine ID;
- approximate operation metadata;
- public GPS preview;
- private evidence hashes;
- signer metadata;
- claim boundary;
- Constellation submission metadata.

## Current Non-Goals

- multi-tenant auth;
- real machine adapter;
- reviewer attestation;
- satellite corroboration;
- C2PA;
- W3C VC;
- carbon-credit issuance;
- legal compliance automation.
