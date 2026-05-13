# Cambium MRV

Cambium MRV turns autonomous farm operations into verifiable evidence for green claims, supply-chain compliance and RWA due diligence — **without exposing proprietary machine logic or sensitive farm data**.

> The machine stays private. The proof layer becomes verifiable.

## Problem

Autonomous farm machines generate valuable operational data — harvest sessions, soil scans, machine passes, timestamps, crop type, yield estimates, GPS traces, photos. This data is also **sensitive**: raw telemetry can reveal proprietary firmware behaviour, navigation logic, safety-critical decisions, exact farm locations, commercial yields.

Buyers, auditors, cooperatives and RWA issuers need evidence. Farmers and machine operators need confidentiality. Cambium separates the **machine layer** from the **proof layer**.

## Core flow

```
machine session
  → privacy transform
  → Field Evidence Packet (v1)
  → canonical hash (SHA-256 over RFC 8785 JSON)
  → demo signature (secp256k1)
  → Constellation Digital Evidence fingerprint
  → public /verify/:hash page
  → PDF evidence report
```

## Claim boundary

Cambium **does**:

- create privacy-preserving Field Evidence Packets;
- compute tamper-evident canonical hashes;
- sign packets;
- submit fingerprints to Constellation Digital Evidence;
- expose a public verification page;
- generate PDF audit reports.

Cambium **does not**:

- certify carbon credits;
- guarantee legal compliance;
- expose firmware or navigation logic;
- publish raw machine logs;
- publish exact GPS traces;
- mint tokens or NFTs.

## Repository layout

```
cambium/
├── apps/
│   ├── web/          Next.js App Router + Tailwind + Leaflet
│   └── api/          Fastify + Prisma + PostgreSQL
├── packages/
│   └── shared/       Zod schemas, canonical JSON, crypto helpers
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Getting started

Requires Node ≥ 22, pnpm ≥ 10, Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:up                                  # start Postgres
pnpm --filter @cambium/api gen:demo-keys    # write DEMO_SIGNER_* into .env
pnpm --filter @cambium/api db:migrate       # apply Prisma migrations
pnpm dev                                    # start web + api in parallel
```

Then open `http://localhost:3000`.

## Implementation status

This repository tracks implementation honestly — features only appear in the UI when their full code path works end-to-end.

| Module | Status |
|---|---|
| Monorepo skeleton | done |
| Shared schemas (Zod) | done — 4/4 crypto + tamper tests pass |
| Canonical JSON + SHA-256 hash | done — RFC 8785-like, deterministic across key reordering |
| secp256k1 signer + verifier | done — @noble/curves |
| Privacy transforms (low/standard/high) | done — pure functions, unit-tested via shared smoke test |
| API (Fastify + Prisma) | done — 14 endpoints, full flow exercised end-to-end |
| Web (Next.js + Tailwind + Leaflet) | done — 7 pages, server components + client forms |
| Constellation mock adapter | done — accepts submissions, returns deterministic shape |
| Constellation live adapter | **scaffolded only** — `submit()` throws, awaiting real endpoint contract |
| PDF report | done — server-side @react-pdf/renderer, 2-page A4 |
| Tamper detection | done — verify endpoint hashes raw DB JSON *before* Zod parsing, returns `tampered` with a minimal response and never leaks fields from an untrusted document |
| Auth / multi-tenant | **not implemented** — single hardcoded demo owner |
| Reviewer attestation, satellite, C2PA, W3C VC | **not implemented** — roadmap items, intentionally absent |

Updated as features land.

## Assurance levels

Cambium does not display a binary verified / not-verified status. Each packet carries an assurance level:

| Level | Name | Description |
|---|---|---|
| AL0 | Hash-only | Document unchanged since anchoring. |
| AL1 | Farmer-attested | Operator signed the declaration. |
| AL2 | Machine-attested | Machine or gateway signed or produced the session. |
| AL3 | Sensor-backed | Logs, sensors, calibration and hash-chain coherent. |
| AL4 | Independently corroborated | Satellite, weighbridge, buyer or reviewer confirms. |
| AL5 | Standard-ready | Dossier structured for third-party verification. |

The MVP targets **AL1–AL2**.

## Market context

> All figures and deadlines below are sourced — see the **Sources** list at the
> end of this section. Where regulation is still moving (Omnibus I, ESRS
> revision, GHG Protocol Guidance), we note the status rather than pretend
> the rules are settled.

### Why now — the regulatory stack creates a structural demand for verifiable field evidence

Four EU regulations and three international frameworks are converging on the
same operational requirement: **machine-readable, audit-defensible, per-plot
evidence of what happened on a piece of land**. Cambium does not implement any
one of these standards — it produces the evidence trail they all need to
consume.

#### EU Deforestation Regulation (EUDR)

| Field | Value |
|---|---|
| In-scope commodities | timber, rubber, soy, palm oil, coffee, cocoa, cattle (and derived products: leather, chocolate, etc.) |
| Core obligation | **per-plot geolocation** of where each commodity was produced; polygon mapping for larger areas; due-diligence statement filed via TRACES NT per consignment |
| Deforestation cut-off date | 31 December 2020 |
| Application date — large/medium operators | **30 December 2026** |
| Application date — micro/SMEs | 30 June 2027 |
| Implication for Cambium | An EUDR-compliant operator must attach a geolocated, deforestation-free declaration to every consignment. Cambium produces exactly the geolocated, hashed, signed evidence packet that backs that declaration — without exposing the operator's raw routes or proprietary machine logs. |

#### EU CSRD + amended ESRS

| Field | Value |
|---|---|
| Reform path | EFRAG submitted Amended ESRS in Nov 2025; mandatory data points cut ~61%; expected Commission adoption mid-2026 |
| Wave 2 thresholds (post-Omnibus I) | > 1,000 FTE **and** > €450 M net turnover |
| Wave 2 first reporting year | financial year **2027**, filed in 2028, under Amended ESRS |
| Wave 1 transition | continues under existing ESRS through 2026, switches to Amended ESRS from 2027 |
| Implication for Cambium | Companies with material agricultural Scope 3 exposure (food & beverage, retailers, FMCG, traders) need source-data audit trails to defend ESRS E1/E4/E5 disclosures. Cambium packets give the auditor a tamper-evident chain back to the actual operation. |

#### CSDDD (post Omnibus I, Feb 2026)

| Field | Value |
|---|---|
| Scope (narrowed by Omnibus I) | > 5,000 employees **and** > €1.5 B turnover (≈ 70% reduction in scope vs original) |
| Mandatory compliance | July **2029** |
| Transposition deadline | 26 July **2028** |
| Implication for Cambium | Even after narrowing, in-scope firms must run due diligence across their value chain. Field Evidence Packets are an upstream input to that diligence — they prove the *what/where/when* without forcing suppliers to expose proprietary data. |

#### CBAM

| Field | Value |
|---|---|
| Definitive phase | started **1 January 2026** |
| Initial scope | cement, iron & steel, aluminium, **fertilisers**, electricity, hydrogen |
| Pending extension | Dec 2025 Commission proposal to add selected downstream products by 2028 (under negotiation) |
| Implication for Cambium | Fertilisers are already in CBAM scope; agricultural inputs and downstream food are not — yet. Cambium is positioned for the extension rather than the initial wave. |

#### SBTi FLAG (Forest, Land & Agriculture)

- **Required** for any company in food production, F&B processing, food
  & staples retail, or tobacco — and for any other sector whose FLAG-related
  emissions are > 20% of total Scopes 1+2+3.
- Net-zero target year: 2050 or earlier.
- **No-deforestation commitment is mandatory** (no FLAG target without it).
  Default cut-off date: 2020.
- Requires ongoing MRV — land-use baselines, activity data, continuous
  monitoring, audit-ready trail.
- **Implication for Cambium**: Field Evidence Packets are a primary feed for
  the MRV stack a FLAG-committed company has to maintain, especially for
  multi-supplier or smallholder cohorts where direct measurement is otherwise
  unverifiable.

#### GHG Protocol Land Sector & Removals (LSR) Standard

- **Standard published 30 January 2026**; effective 1 January 2027.
- Accompanying **Guidance** expected Q2 2026.
- Developed over 5 years with 300+ external reviewers, 96 pilot companies.
- **Implication for Cambium**: LSR is what corporate accountants will use to
  book agricultural removals and emissions in their inventories. The
  underlying data is what Cambium captures.

#### ICVCM Core Carbon Principles

- 10 CCPs, organised under Governance / Emissions Impact / Sustainable
  Development.
- Sustainable agriculture methodologies were **first approved with the CCP
  label** (CAR and Verra methodologies) — agriculture is now an integrity-
  graded category in the voluntary market.

### Market size

| Segment | 2024 / 2025 size | Forward view | Source |
|---|---|---|---|
| Voluntary Carbon Market (overall) | ~€2.5 B (2025) | ~€3 B (2026), ~€15 B by 2035 (CAGR ~20.6%) | Ecosystem Marketplace / AlliedOffsets |
| VCM — removal credits | premium tier already paying 3× over avoidance | ~56% CAGR (analyst consensus) | Carbon Direct, Sylvera |
| Voluntary agriculture carbon credits | $36.1 M (2024) | CAGR **31.9%** through 2034 | Global Market Insights |
| Tokenized RWA (total, ex-stablecoins) | $26 B+ on-chain | $100 B+ by end of 2026 (analyst projections) | RWA.xyz / MetaMask |
| Tokenized commodities | $7.37 B (Apr 2026), 74% gold | Agri commodities still **early-stage** | CoinMarketCap, Chainalysis |

Two structural shifts inside these numbers matter for Cambium:

1. **Price discrimination is back.** High-rated VCM credits traded at >300%
   premium over low-rated credits in H1 2025; the average spot for high-quality
   ARR credits moved from $14 to $26/tCO2e during 2025. The price is paid for
   *defensible evidence*, not just claimed tonnage.
2. **The 2023 Verra incident is still resetting buyer behaviour.** The Guardian
   investigation found 90%+ of one major registry's forest credits to be
   non-additional. Corporate buyers (Gucci, Disney, Shell named publicly) now
   demand source-data audit trails before contracting. The whole sector pivoted
   to "show the evidence."

### The data sovereignty problem (the moat regulators care about)

Cambium's privacy stance isn't a marketing choice — it tracks an explicit EU
policy line:

- **EU Code of Conduct on Agricultural Data Sharing by Contractual Agreement**
  (2018, signed by COPA-COGECA, CEMA, FEFAC, CEETTAR, CEJA, ECPA, EFFAB,
  Fertilizers Europe) explicitly recognises the **farmer as the owner of raw
  data**, with informed consent required for any sharing.
- **EU Data Act** (in force 2025) extends a similar data-sovereignty principle
  across IoT data more broadly.
- Autonomous-machine telemetry is locked in **proprietary file formats**
  (.dat, .gsd, .rbin, .agdata) and proprietary platforms (John Deere
  Operations Center, Case IH FieldOps). ISO 11783 (ISOBUS) standardises the
  bus, not the cloud format.

A platform that asks farmers to upload raw machine logs to prove their
practices is asking them to violate the policy direction. A platform that
extracts a privacy-transformed evidence packet locally and only anchors the
fingerprint is aligned with it.

### Competitive landscape

| Company | Layer | Where Cambium overlaps | Where Cambium differs |
|---|---|---|---|
| **Indigo Ag** | Soil carbon programme + MRV pipeline (>9% market share 2024) | Both produce MRV evidence | Indigo is a credit-issuance programme; Cambium is a vendor- and registry-neutral evidence layer |
| **Boomitra** | Satellite + AI MRV for smallholders (Earthshot Prize) | Both produce hash-anchored evidence | Boomitra is remote-sensing first; Cambium is machine-data first — they're complements, not substitutes |
| **Regrow** | MRV platform across 15+ crops, 5 continents | Both target corporate Scope 3 / FLAG | Regrow is a SaaS for project developers; Cambium is the per-operation proof artifact |
| **Agreena, Agoro, GreenCollar** | Soil carbon programmes | Top-5 share with the above (~35% combined in 2024) | Same delta — programmes, not evidence layers |
| **Pachama, Sylvera, BeZero, Renoster** | Credit-rating / due diligence | Both serve buyers needing evidence quality | Raters score *existing* credits; Cambium produces the *underlying* evidence the raters now demand |
| **TraceX, Geora, AgriLedger, Ripe.io** | Blockchain supply-chain traceability | Both anchor records to a chain | These are supply-chain ledgers; Cambium is a single-operation evidence packet |
| **Constellation Network — Digital Evidence** | Tamper-proof data fingerprinting (DAG L1, DoD + Panasonic engagements) | Cambium *uses* Digital Evidence as its anchoring layer | Constellation is the notary; Cambium is the agriculture-specific producer that feeds it |

The most striking gap in the table: nobody in the agri-MRV column is
explicitly engineered around **privacy-preserving extraction from
autonomous-machine logs**. Indigo, Boomitra, Regrow assume farmers and
project developers will share data with them under contract. Cambium starts
from the opposite premise — the machine data never has to leave the
operator's control, only its commitments do.

### Where Cambium sits on the value chain

```
[ Autonomous farm machine / sensor gateway ]
                │
                │  proprietary telemetry stays local
                ▼
[ Cambium MRV — privacy transform + Field Evidence Packet v1 ]
                │
                │  signed packet hash only
                ▼
[ Constellation Digital Evidence — anchored fingerprint ]
                │
                ├──▶ EUDR due diligence statement (TRACES NT input)
                ├──▶ CSRD / ESRS audit trail (ESRS E1, E4, E5 evidence)
                ├──▶ SBTi FLAG MRV (activity data + no-deforestation proof)
                ├──▶ GHG Protocol LSR inventory (per-operation removal record)
                ├──▶ VCM project documentation (CCP-aligned evidence)
                └──▶ RWA / supply-chain due diligence (per-lot provenance)
```

Every consumer in the right column today struggles with the same upstream
problem: **the operator owns the data the regulator wants to see, and can't
share it without exposing trade secrets**. Cambium is the layer that resolves
that asymmetry.

### What Cambium is not (kept honest)

- Not a carbon credit registry — does not issue, retire or transfer credits.
- Not a credit-rating agency — does not score project quality.
- Not a satellite remote-sensing provider — uses machine logs as primary
  evidence; satellite corroboration is on the AL4 roadmap, not the MVP.
- Not a token, not an NFT, not a marketplace.
- Not a substitute for a third-party verifier under ICVCM, Verra, Gold
  Standard, ACR, CAR, Plan Vivo or Puro.earth — it is an evidence input that
  *those verifiers* can audit.
- Not a legal compliance product — the claim boundary is enforced in every
  packet and on every public verification page.

### Open questions we are not pretending to have answered

- **Will Constellation Digital Evidence be the long-term anchor?** Probably
  also Ethereum L2 (Base) and a public Merkle batch for resilience. The
  adapter interface is built to allow it; today only the Constellation mock
  is wired.
- **What does AL3 (sensor-backed) look like in practice?** Calibration
  records, weighbridge tickets and signed sensor observations need a
  standard format we have not yet specified.
- **Smallholder cohorts.** A useful next move, but the privacy story is
  different (consent and data-stewardship rather than machine-secret
  protection). Out of scope for v1.

### Sources

EU regulation:

- [EU Deforestation Regulation — Commission overview](https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en)
- [EUDR — traceability and geolocation guidance (Green Forum)](https://green-forum.ec.europa.eu/nature-and-biodiversity/deforestation-regulation-implementation/traceability-and-geolocation-commodities-subject-eudr_en)
- [EUDR 2026 update — PSQR](https://psqr.eu/publications-resources/eu-deforestation-regulation-eudr-2026-update-new-deadlines-for-companies/)
- [Amended ESRS — what changed for 2026 reporting (Coolset)](https://www.coolset.com/academy/the-amended-esrs-what-has-changed-and-what-it-means-for-2026-csrd-reporting)
- [EU Sustainability Reporting — Omnibus updates (Deloitte)](https://dart.deloitte.com/USDART/home/publications/deloitte/heads-up/2026/eu-sustainability-reporting-omnibus-esrs-updates)
- [Omnibus I — CSDDD and CSRD reforms (Clifford Chance)](https://www.cliffordchance.com/insights/resources/blogs/business-and-human-rights-insights/2026/02/omnibus-i-the-european-union-concludes-csddd-and-csrd-reforms.html)
- [CSDDD Omnibus I amendments enter into force (BHRRC)](https://www.business-humanrights.org/en/latest-news/csddd-omnibus/)
- [Carbon Border Adjustment Mechanism — Commission overview](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en)
- [CBAM definitive phase Jan 2026 (Asuene)](https://asuene.com/us/blog/cbam-enters-its-definitive-phase-on-january-1-2026-what-companies-must-be-ready-for)

International frameworks:

- [SBTi Forest, Land & Agriculture (FLAG)](https://sciencebasedtargets.org/sectors/forest-land-and-agriculture)
- [SBTi FLAG Guidance — companies' brief](https://files.sciencebasedtargets.org/production/files/SBTi-FLAG-Guidance-in-Brief.pdf)
- [GHG Protocol Land Sector & Removals Standard](https://ghgprotocol.org/land-sector-and-removals-standard)
- [LSR Standard — what you need to know (GHG Protocol)](https://ghgprotocol.org/blog/land-sector-and-removals-standard-what-you-need-know)
- [ICVCM Core Carbon Principles](https://icvcm.org/core-carbon-principles/)
- [ICVCM approves first sustainable agriculture methodologies](https://icvcm.org/integrity-council-approves-first-sustainable-agriculture-methodologies-from-car-and-verra/)

Market size & integrity:

- [State of the Voluntary Carbon Market 2025 (Ecosystem Marketplace)](https://3298623.fs1.hubspotusercontent-na1.net/hubfs/3298623/SOVCM%202025/Ecosystem%20Marketplace%20State%20of%20the%20Voluntary%20Carbon%20Market%202025.pdf)
- [VCM size, trends, forecasts (AlliedOffsets)](https://blog.alliedoffsets.com/what-is-the-voluntary-carbon-market-everything-you-need-to-know-in-2026)
- [Carbon market trends 2026 (Sylvera)](https://www.sylvera.com/blog/carbon-market-trends)
- [Voluntary agriculture carbon credit market 2025-2034 (Global Market Insights)](https://www.gminsights.com/industry-analysis/voluntary-agriculture-carbon-credit-market)
- [Tokenized RWAs and on-chain commodities (Chainalysis)](https://www.chainalysis.com/blog/tokenized-real-world-assets-on-chain-commodities/)
- [Top tokenized RWA by market cap (CoinMarketCap)](https://coinmarketcap.com/real-world-assets/)

Data sovereignty & ag-tech context:

- [EU Code of Conduct on Agricultural Data Sharing by Contractual Agreement](https://fefac.eu/wp-content/uploads/2020/07/eu_code_of_conduct_on_agricultural_data_sharing-1.pdf)
- [The future of agricultural data-sharing policy in Europe (Nature)](https://www.nature.com/articles/s41599-024-03710-1)
- [Digitalising the EU agricultural sector (Commission)](https://digital-strategy.ec.europa.eu/en/policies/digitalisation-agriculture)
- [Precision Agriculture: Benefits and Challenges (US GAO)](https://www.gao.gov/products/gao-24-105962)

Competitive landscape:

- [Indigo Ag MRV pipeline](https://www.indigoag.com/blog/whats-the-deal-with-mrv)
- [Boomitra — satellite + AI carbon removal](https://boomitra.com/)
- [Regrow MRV platform](https://www.regrow.ag/platform/mrv)
- [Constellation Digital Evidence — live](https://medium.com/constellationlabs/constellations-digital-evidence-is-live-tap-the-easy-button-for-tamper-proof-data-fc3698147b3f)
- [Constellation Digital Evidence product page](https://constellationnetwork.io/digital-evidence/)

## License

To be determined.
