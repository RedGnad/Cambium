import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { fieldEvidencePacketSchema } from "@cambium/shared";

export interface RenderEvidencePdfInput {
  packetJson: object;
  packetHash: string;
  status: string;
  createdAt: string;
  signedAt: string | null;
  submittedAt: string | null;
  submission: {
    mode: string;
    eventId: string | null;
    accepted: boolean | null;
  } | null;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#111" },
  title: { fontSize: 18, marginBottom: 4, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 18 },
  notice: {
    marginBottom: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: "#b8c7bb",
    backgroundColor: "#f2f7f3",
    color: "#264a31",
  },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    textTransform: "uppercase",
    color: "#444",
  },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 130, color: "#555" },
  value: { flex: 1 },
  mono: { fontFamily: "Courier", fontSize: 8 },
  boundary: {
    marginTop: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "#999",
    borderStyle: "solid",
  },
  boundaryTitle: { fontSize: 10, fontWeight: 700, marginBottom: 4 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
  },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function MonoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, styles.mono]}>{value}</Text>
    </View>
  );
}

export async function renderEvidencePdf(
  input: RenderEvidencePdfInput
): Promise<Buffer> {
  const packet = fieldEvidencePacketSchema.parse(input.packetJson);
  const attestation = packet.attestations[0];

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Cambium MRV Evidence Report</Text>
        <Text style={styles.subtitle}>
          Schema {packet.schema} · Assurance {packet.assuranceLevel}
        </Text>

        <View style={styles.notice}>
          <Text>
            This report verifies a privacy-preserving field evidence packet. It
            is not a carbon certificate, legal compliance opinion or disclosure
            of raw machine telemetry.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Row label="Packet ID" value={packet.packetId} />
          <Row label="Status" value={input.status} />
          <Row label="Created" value={input.createdAt} />
          <Row label="Signed" value={input.signedAt ?? "—"} />
          <Row label="Submitted" value={input.submittedAt ?? "—"} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operation</Text>
          <Row label="Type" value={packet.operation.type} />
          <Row label="Crop" value={packet.operation.crop} />
          <Row label="Started at" value={packet.operation.startedAt} />
          <Row label="Ended at" value={packet.operation.endedAt} />
          <Row
            label="Time precision"
            value={packet.operation.timeWindowPrecision}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Field</Text>
          <Row label="Field ID" value={packet.field.fieldId} />
          <Row label="Region" value={packet.field.region ?? "—"} />
          <Row
            label="Area (approx.)"
            value={`${packet.field.areaCoveredHaApprox} ha (${packet.field.areaPrecision})`}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Machine</Text>
          <Row label="Machine ID" value={packet.machine.machineId} />
          <Row label="Type" value={packet.machine.machineType} />
          <Row
            label="Vendor visible"
            value={packet.machine.vendorVisible ? "yes" : "no"}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy-preserving evidence</Text>
          <Row label="GPS policy" value={packet.privacy.gpsPolicy} />
          <Row label="GPS precision" value={packet.privacy.gpsPrecision} />
          <Row label="Yield policy" value={packet.privacy.yieldPolicy} />
          <Row label="Photo policy" value={packet.privacy.photoPolicy} />
          <Row label="Raw log policy" value={packet.privacy.rawLogPolicy} />
          <Row
            label="GPS preview pts"
            value={String(packet.publicEvidence.gpsPathPreview?.length ?? 0)}
          />
          <Row
            label="Yield (approx.)"
            value={
              packet.publicEvidence.yieldKgApprox !== undefined
                ? `${packet.publicEvidence.yieldKgApprox} kg`
                : "withheld"
            }
          />
          <Row
            label="Photo count"
            value={String(packet.publicEvidence.photoCount)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hashes and signatures</Text>
          <MonoRow label="Packet hash" value={input.packetHash} />
          <MonoRow
            label="Raw log hash"
            value={packet.privateEvidenceRefs.rawLogHash}
          />
          <MonoRow
            label="GPS path hash"
            value={packet.privateEvidenceRefs.gpsPathHash}
          />
          {attestation ? (
            <>
              <Row label="Signer" value={attestation.signerId} />
              <Row label="Signer type" value={attestation.type} />
              <Row label="Signed at" value={attestation.signedAt} />
              <MonoRow label="Public key" value={attestation.publicKeyHex} />
              <MonoRow label="Signature" value={attestation.signature} />
            </>
          ) : (
            <Row label="Attestation" value="none (draft)" />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data boundary</Text>
          <Row label="Raw logs" value="not published; hash only" />
          <Row label="Exact GPS" value="not published; transformed preview only" />
          <Row label="Machine logic" value="not exposed" />
          <Row label="Yield" value={packet.privacy.yieldPolicy} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Constellation Digital Evidence</Text>
          {input.submission ? (
            <>
              <Row label="Mode" value={input.submission.mode} />
              <Row
                label="Event ID"
                value={input.submission.eventId ?? "—"}
              />
              <Row
                label="Accepted"
                value={
                  input.submission.accepted === null
                    ? "—"
                    : input.submission.accepted
                      ? "yes"
                      : "no"
                }
              />
            </>
          ) : (
            <Row label="Status" value="not submitted" />
          )}
        </View>

        <View style={styles.boundary}>
          <Text style={styles.boundaryTitle}>Claim boundary</Text>
          <Text>
            Cambium creates verifiable evidence packets that auditors, buyers,
            cooperatives and RWA issuers can inspect. Cambium does not certify
            carbon credits, does not guarantee legal compliance, and does not
            expose proprietary machine logic.
          </Text>
          <Text>
            Intended use: {packet.claimBoundary.intendedUse.join(", ")}.
          </Text>
        </View>

        <Text style={styles.footer}>
          Generated by Cambium MRV · packet hash: {input.packetHash}
        </Text>
      </Page>
    </Document>
  );

  const result = await renderToBuffer(doc);
  return result as Buffer;
}
