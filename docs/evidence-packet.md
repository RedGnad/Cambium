# Cambium MRV - Evidence Packet

The Field Evidence Packet is the public, privacy-preserving artifact Cambium creates from a machine session.

## Packet Purpose

The packet answers:

- what happened;
- roughly where it happened;
- when it happened;
- which pseudonymous field and machine were involved;
- what sensitive evidence exists privately;
- how the public packet was transformed;
- whether the packet has been signed and anchored.

## Public Fields

The public packet can include:

- operation type;
- crop;
- approximate time window;
- pseudonymous field ID;
- pseudonymous machine ID;
- machine type;
- approximate area;
- public GPS preview;
- approximate or hidden yield;
- photo count;
- privacy policy;
- claim boundary.

## Private Evidence References

The packet does not publish raw evidence. It publishes commitments:

- raw log hash;
- exact GPS path hash;
- photo hashes;
- canonical packet hash;
- signature.

In production, raw evidence would remain in a partner-controlled store, encrypted vault or data room.

## Assurance Levels

| Level | Name | Description |
|---|---|---|
| AL0 | Hash-only | Document unchanged since anchoring. |
| AL1 | Farmer-attested | Operator signed the declaration. |
| AL2 | Machine-attested | Machine or gateway signed or produced the session. |
| AL3 | Sensor-backed | Logs, sensors, calibration and hash-chain coherent. |
| AL4 | Independently corroborated | Satellite, weighbridge, buyer or reviewer confirms. |
| AL5 | Standard-ready | Dossier structured for third-party verification. |

The current MVP targets AL1-AL2.

## Claim Boundary

The packet must remain explicit:

- does not certify carbon credits;
- does not guarantee legal compliance;
- does not expose proprietary machine logic;
- intended for audit preparation, supply-chain evidence and due-diligence support.

