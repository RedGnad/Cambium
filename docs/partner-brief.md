# Cambium MRV - Partner Brief

This document is for the field and machine partner who understands real autonomous agriculture workflows and the proprietary constraints around machine data.

## 1. Why This Matters

Agricultural supply chains are moving toward verifiable evidence.

In Europe, regulators and buyers increasingly ask companies to substantiate environmental, traceability and supply-chain claims. A European Commission study reported that 53.3% of examined environmental claims were vague, misleading or unfounded, and that 40% were unsubstantiated. This creates demand for audit-ready proof, not just declarations.

Cambium MRV responds to that need by producing verifiable evidence packets from field operations without exposing proprietary machine data.

## 2. Why Autonomous Machines Matter

Autonomous machines generate high-value evidence:

- operation type;
- timestamps;
- crop type;
- area covered;
- yield estimate;
- GPS path;
- photos;
- sensor events;
- machine logs.

But this data is sensitive.

Raw telemetry can reveal:

- firmware behavior;
- navigation logic;
- safety-critical decisions;
- exact field location;
- commercial yield;
- proprietary machine strategy.

Cambium does not ask for full transparency. It creates a proof layer above the private machine layer.

> The machine stays private. The proof layer becomes verifiable.

## 3. Why Closed-Source Machines Are A Strength

The fact that the machine is closed-source is not a weakness. It is the use case.

Most buyers, auditors or compliance teams want proof. Most machine operators cannot expose raw telemetry, firmware, safety systems or proprietary navigation logic.

Cambium sits in the middle:

```text
private machine layer
  -> privacy transform
  -> public/verifiable proof layer
```

The closed-source constraint makes the product sharper: Cambium is useful exactly because full transparency is unrealistic.

## 4. What We Need From The Partner

Minimum contribution:

- 30-minute discussion about real machine workflows;
- one anonymized or simulated machine session;
- pseudonymous machine ID;
- pseudonymous field ID;
- operation type;
- crop type;
- start/end time;
- approximate area;
- approximate yield if acceptable;
- masked or simplified GPS preview;
- hashes or summaries instead of raw logs;
- feedback on what is realistic or sensitive.

Ideal contribution:

- 2-3 example sessions: HARVEST, SOIL_SCAN, SPRAYING or MACHINE_PASS;
- approximate GPS preview or synthetic path;
- approximate area;
- approximate yield if acceptable;
- explanation of available sensor categories such as camera, olfactory/gas, AI inference, timestamps and machine events;
- review of the final public packet before demo.

## 5. What We Will Never Ask For

We do not need:

- firmware;
- proprietary navigation algorithms;
- safety logic;
- full raw machine logs;
- exact GPS if sensitive;
- high-resolution private photos;
- exact commercial yield;
- machine manufacturer secrets;
- farm identity.

## 6. Business Opportunity

Cambium can become a privacy-preserving evidence layer for:

- green claim substantiation;
- supply-chain compliance;
- carbon farming documentation;
- RWA due diligence;
- cooperative reporting;
- buyer verification;
- audit preparation.

The strongest wedge is not "carbon certification". It is verifiable field evidence without exposing the machine.

## 7. Partner Risk Controls

Data minimization:
We only request the minimum data required to prove the concept.

Pseudonymization:
Machine ID, field ID and operator ID are pseudonymous by default.

No raw machine exposure:
Firmware, navigation logic, safety logic and proprietary telemetry stay private.

GPS privacy:
Exact GPS is never published. The public packet uses a simplified, jittered or region-level preview.

Yield privacy:
Yield is approximate, bucketed or hidden depending on partner preference.

Public demo safety:
The public demo can use simulated data derived from realistic structure, not real sensitive data.

Right to review:
The partner reviews and approves any dataset before it enters the public demo.

No manufacturer disclosure:
Machine brand, vendor and model remain hidden unless explicitly approved.

## 8. Partner Upside

The partner can help define a product before the market gets crowded.

Potential upside:

- early advisor role;
- first pilot partner;
- technical credibility;
- possible equity/advisor agreement later;
- visibility if desired;
- optional anonymity if preferred;
- future paid pilot if the project advances.

## 9. Immediate Next Step

We only need one safe demo dataset.

The first goal is not a commercial integration. The first goal is to prove the concept:

```text
machine session
  -> privacy transform
  -> evidence packet
  -> signature
  -> blockchain fingerprint
  -> verification page
  -> PDF report
```

## 10. Business Credibility

Cambium starts from a practical market gap:

Most MRV and carbon platforms ask farmers or project developers to share data into a third-party system.

Cambium starts from the opposite assumption:

> The raw machine data is too sensitive to expose.

That makes the closed-source machine context an advantage, not a handicap. It gives Cambium a specific privacy/proof use case that generic MRV platforms often miss.

## 11. Pilot Economics

The most likely first payer is not the individual farmer.

More likely payers:

- cooperative;
- food buyer;
- processor;
- exporter;
- carbon project developer;
- RWA issuer;
- agritech vendor;
- auditor or compliance platform.

Why they would pay:

- structured evidence;
- timestamps;
- tamper-evident packet hashes;
- privacy-preserving sharing;
- third-party review;
- PDF export and audit room readiness.

What the farmer or machine operator gets:

- better buyer trust;
- easier audit response;
- less manual documentation;
- stronger proof for sustainable practice programs;
- optional participation in future premium supply chains;
- reduced risk of over-sharing machine data.

Cambium's short-term ROI is not yield improvement. It is evidence readiness.
