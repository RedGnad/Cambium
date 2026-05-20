# Cambium MRV - Demo Script

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm --filter @cambium/api gen:demo-keys
pnpm --filter @cambium/api db:migrate
pnpm seed:demo
pnpm dev
```

Open `http://localhost:3000`.

`pnpm seed:demo` prepares the full evidence dossier:

1. Creates the demo field.
2. Creates the demo autonomous harvester.
3. Creates the demo HARVEST session.
4. Generates the Field Evidence Packet.
5. Signs the packet with the demo signer.
6. Submits the fingerprint through Constellation mock or live mode.
7. Creates the public verify URL.
8. Render-tests the PDF report.

To run against Constellation Digital Evidence live mode, configure:

```bash
CONSTELLATION_MODE=live
CONSTELLATION_API_BASE_URL=https://de-api.constellationnetwork.io/v1
CONSTELLATION_API_KEY=...
CONSTELLATION_ORG_ID=...
CONSTELLATION_TENANT_ID=...
```

The UI exposes integration readiness at `http://localhost:3000/integrations`.

## Judge Flow

1. Click "Run demo flow" on the dashboard.
2. Open the seeded HARVEST session.
3. Review private evidence references: raw log hash, GPS path hash and photo hashes.
4. Preview the privacy transform.
5. Build the Field Evidence Packet.
6. Sign the packet with the demo server signer.
7. Submit the fingerprint to Constellation mock or live mode.
8. Open the public verify page.
9. Export the PDF report.

## Narration

Cambium turns a private autonomous-machine session into an audit-ready public proof packet.

The raw machine data never becomes public. The verifier sees the proof layer: pseudonymous field and machine IDs, approximate operation data, private evidence hashes, a signature, an anchor event and a clear claim boundary.

## Things To Point Out

- The public verifier can confirm packet integrity without seeing raw telemetry.
- Tamper detection hashes raw stored JSON before schema parsing.
- The claim boundary says Cambium supports evidence workflows; it does not certify compliance or carbon credits.
- The demo is seeded so judges do not have to invent field and machine records manually.
- Mock submissions are visibly labelled. Live submissions use Constellation Digital Evidence `/fingerprints`.
