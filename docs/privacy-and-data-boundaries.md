# Cambium MRV - Privacy And Data Boundaries

Privacy is the product, not a side note.

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

## No Raw Machine Exposure

Cambium does not need:

- firmware;
- proprietary navigation algorithms;
- safety logic;
- full raw machine logs;
- exact GPS;
- high-resolution private photos;
- exact commercial yield;
- machine manufacturer secrets;
- farm identity.

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

