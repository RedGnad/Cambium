# Cambium MRV

Cambium MRV turns autonomous farm operations into verifiable evidence for green claims, supply-chain due diligence and RWA review, without exposing proprietary machine logic or sensitive farm data.

> The machine stays private. The proof layer becomes verifiable.

## Pitch

Autonomous farm machines generate valuable operational evidence: operation type, timestamps, crop, area covered, approximate yield, GPS path previews, photos, sensor events and machine log hashes.

The same data is sensitive. Raw telemetry can reveal firmware behavior, navigation logic, safety decisions, exact field location, commercial yield and manufacturer-specific strategy.

Cambium creates a privacy-preserving Field Evidence Packet from a real or simulated machine session, signs the canonical packet, anchors its fingerprint through the Constellation Digital Evidence adapter and exposes a public verification page plus PDF report.

## Why Now

The market is moving from environmental claims to audit-ready evidence:

- The European Commission says 53.3% of examined environmental claims were vague, misleading or unfounded, and 40% were unsubstantiated.
- EUDR does not make Cambium automatically relevant to every crop, but it shows the direction of travel: buyers increasingly need plot-level, audit-defensible evidence. The current EU application dates are 30 December 2026 for large and medium operators and 30 June 2027 for micro and small operators.
- The EU Data Act has applied since 12 September 2025 and explicitly increases user access to data from connected devices, including industrial machinery and agriculture.
- CSRD and CSDDD have been simplified, but the core pressure remains: large companies must document sustainability and value-chain impacts with better evidence.
- BLI frames its hackathon around Law, Finance and Compliance, with mentoring and bounties. Cambium fits as LegalTech/RegTech proof infrastructure, not as a generic agriculture app.

Sources and deeper context: [docs/market-study.md](docs/market-study.md).

## What Cambium Does

```text
machine session
  -> privacy transform
  -> Field Evidence Packet v1
  -> canonical hash
  -> demo secp256k1 signature
  -> Constellation Digital Evidence fingerprint
  -> public /verify/:hash page
  -> PDF evidence report
```

Cambium currently:

- creates privacy-preserving Field Evidence Packets;
- computes tamper-evident canonical hashes;
- signs packets with a demo secp256k1 signer;
- submits fingerprints through a Constellation Digital Evidence adapter, in mock or live mode depending on environment configuration;
- exposes a public verification page;
- generates PDF audit reports;
- detects tampering by hashing stored raw JSON before schema parsing.

## What Cambium Does Not Do

Cambium is not an EUDR compliance product.

However, EUDR shows the direction of travel: buyers and operators increasingly need plot-level, audit-defensible evidence. Cambium produces privacy-preserving field evidence packets that can support traceability and due-diligence workflows without exposing raw machine telemetry.

Cambium does not implement CSRD, CSDDD, SBTi FLAG, GHG Protocol, carbon-credit issuance or registry rules directly. Cambium produces the upstream evidence layer that these frameworks increasingly require.

Cambium also does not:

- certify carbon credits;
- guarantee legal compliance;
- expose firmware, safety logic or navigation logic;
- publish raw machine logs;
- publish exact GPS traces;
- mint tokens or NFTs.

## Business Credibility

Cambium is built around a specific market gap:

Most MRV and carbon platforms ask farmers or project developers to share data into a third-party system.

Cambium starts from the opposite assumption:

> The raw machine data is too sensitive to expose.

This makes Cambium relevant for autonomous agriculture, proprietary machine telemetry, supply-chain evidence, green claim substantiation, RWA due diligence and audit-ready field records.

Cambium's first commercial wedge is not carbon credit issuance. The first wedge is privacy-preserving field evidence.

## Demo Flow

The target demo is intentionally hard to miss:

```text
Open demo session
  -> Generate evidence packet
  -> Sign
  -> Submit fingerprint
  -> Verify
  -> Export PDF
```

After seeding, the dashboard exposes a "Run demo flow" action. The seed command creates the demo field, demo machine, harvest session, signed/submitted evidence packet, verify URL and render-tested PDF report.

## Demo In 60 Seconds

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm --filter @cambium/api gen:demo-keys
pnpm --filter @cambium/api db:migrate
pnpm seed:demo
pnpm dev
```

Then open `http://localhost:3000`.

Demo flow:

```text
Open demo session
  -> Generate / inspect Field Evidence Packet
  -> Verify signature and hash
  -> Open public verification page
  -> Export PDF evidence report
```

## Quickstart

Requires Node >= 22, pnpm >= 10 and Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm --filter @cambium/api gen:demo-keys
pnpm --filter @cambium/api db:migrate
pnpm seed:demo
pnpm dev
```

Then open `http://localhost:3000`.

## Current Implementation Status

| Module | Status |
|---|---|
| Monorepo skeleton | done |
| Shared schemas | done |
| Canonical JSON + SHA-256 hash | done |
| secp256k1 signer + verifier | done |
| Privacy transforms | done |
| API | done |
| Web UI | done |
| Demo seed command | done |
| Dashboard demo entry | done |
| Constellation mock adapter | done |
| Constellation live adapter | done — official `/fingerprints` API, requires API key/org/tenant env |
| PDF report | done |
| Tamper detection | done |
| Auth / multi-tenant | not implemented |
| Reviewer attestation, satellite, C2PA, W3C VC | not implemented |

## Deeper Docs

- [Partner brief](docs/partner-brief.md)
- [Market study](docs/market-study.md)
- [Business case](docs/business-case.md)
- [Architecture](docs/architecture.md)
- [Evidence packet](docs/evidence-packet.md)
- [Privacy and data boundaries](docs/privacy-and-data-boundaries.md)
- [Demo script](docs/demo-script.md)
- [Submission draft](docs/submission-draft.md)

## License

To be determined.
