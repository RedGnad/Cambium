# Cambium MRV - Privacy And Data Boundaries

Privacy is the product, not a side note.

## Principle

Cambium separates the private machine layer from the public proof layer.

```text
private machine data
  -> hashes and privacy transforms
  -> signed evidence packet
  -> public verification
```

## Never Public

Cambium must never publish:

- firmware;
- navigation algorithms;
- safety logic;
- complete machine logs;
- exact raw GPS;
- exact commercial yield if sensitive;
- high-resolution private photos;
- proprietary machine parameters;
- farm identity;
- manufacturer identity unless approved.

## Public Or Verifiable

Cambium may publish:

- evidence packet hash;
- raw log hash;
- GPS path hash;
- photo hashes;
- pseudonymous machine ID;
- pseudonymous field ID;
- operation type;
- crop type;
- approximate time window;
- approximate area;
- approximate or bucketed yield;
- attestation status;
- verification URL.

## Data Minimization

Cambium only asks for the minimum data required to prove the evidence flow.

Minimum demo data:

- pseudonymous field ID;
- pseudonymous machine ID;
- operation type;
- crop;
- approximate time window;
- approximate area;
- approximate yield if acceptable;
- simplified GPS preview;
- raw-log hash or summary;
- optional photo hashes.

## Pseudonymization

Machine ID, field ID and operator ID are pseudonymous by default.

## GPS Privacy

Exact GPS is never published in the public verification packet.

The public packet uses a simplified, jittered or region-level preview depending on privacy level.

## Yield Privacy

Yield is approximate, bucketed or hidden depending on partner preference.

## Public Demo Safety

The public demo can use simulated data derived from realistic structure. No sensitive machine or farm data has to enter the public repo or public verification page.

## Right To Review

Before any real partner data becomes part of a public demo, the partner should review and approve:

- dataset structure;
- field pseudonyms;
- machine pseudonyms;
- GPS preview;
- yield visibility;
- photos or photo hashes;
- public PDF.
