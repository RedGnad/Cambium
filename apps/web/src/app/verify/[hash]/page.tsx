import { MapClient } from "@/components/MapClient";
import { getServerApiBase } from "@/lib/api";

export const dynamic = "force-dynamic";

interface VerifiedResponse {
  status: "verified";
  evidenceId: string;
  packetHash: string;
  signatureValid: boolean | null;
  packetId: string;
  createdAt: string;
  assuranceLevel: string;
  operation: {
    type: string;
    crop: string;
    startedAt: string;
    endedAt: string;
    timeWindowPrecision: string;
  };
  field: { fieldId: string; region?: string; areaCoveredHaApprox: number; areaPrecision: string };
  machine: { machineId: string; machineType: string; vendorVisible: boolean };
  privacy: Record<string, string>;
  publicEvidence: {
    gpsPathPreview?: Array<[number, number]>;
    yieldKgApprox?: number;
    photoCount: number;
  };
  privateEvidenceRefs: { rawLogHash: string; gpsPathHash: string; photoCount: number };
  attestations: Array<{
    type: string;
    signerId: string;
    statement: string;
    publicKeyHex: string;
    signedAt: string;
  }>;
  claimBoundary: {
    doesNotCertifyCarbon: boolean;
    doesNotGuaranteeCompliance: boolean;
    doesNotExposeMachineLogic: boolean;
    intendedUse: string[];
  };
  constellation: {
    mode: "mock" | "live";
    eventId: string | null;
    accepted: boolean | null;
    submittedAt: string | null;
  } | null;
}

interface TamperedResponse {
  status: "tampered";
  evidenceId?: string;
  packetHash: string;
  signatureValid: boolean;
  message: string;
}

type VerifyResponse = VerifiedResponse | TamperedResponse;

async function fetchVerification(hash: string): Promise<VerifyResponse | null> {
  try {
    const res = await fetch(`${getServerApiBase()}/verify/${encodeURIComponent(hash)}`, {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as VerifyResponse;
  } catch {
    return null;
  }
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const data = await fetchVerification(hash);

  if (!data) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">No packet found</h1>
        <p className="mt-2 text-sm text-ink-600">
          No evidence packet matches the hash <code className="hash">{hash}</code>.
        </p>
      </div>
    );
  }

  if (data.status === "tampered") {
    return (
      <div className="space-y-4">
        <header className="rounded-md border border-red-200 bg-red-50 p-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-red-800">
              Tampered packet
            </h1>
            <span className="pill-tampered">tampered</span>
          </div>
          <p className="mt-2 break-all text-[11px] text-red-700">
            {data.packetHash}
          </p>
          <p className="mt-3 text-xs text-red-700">{data.message}</p>
        </header>
        <div className="card text-xs text-ink-600">
          The stored document no longer matches its canonical hash. Operation
          details are intentionally hidden — they cannot be trusted.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-md border border-cambium-100 bg-cambium-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-cambium-700">
            Verified Field Evidence Packet
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={data.status === "verified" ? "pill-verified" : "pill-tampered"}
            >
              {data.status}
            </span>
            <span className="pill bg-ink-100 text-ink-700">
              {data.assuranceLevel}
            </span>
            {data.constellation ? (
              <span
                className={
                  data.constellation.mode === "mock"
                    ? "pill-mock"
                    : "pill-live"
                }
              >
                Constellation: {data.constellation.mode}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-2 break-all text-[11px] text-ink-600">
          {data.packetHash}
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <p className="max-w-2xl text-xs text-cambium-700">
            This page verifies integrity and provenance of the evidence packet.
            It does not disclose proprietary machine logic, certify carbon
            credits or guarantee legal compliance.
          </p>
          <a
            className="btn-secondary bg-white"
            href={`/api/proxy/evidence/${data.evidenceId}/pdf`}
            target="_blank"
            rel="noreferrer"
          >
            Export PDF
          </a>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Field label="Operation" value={`${data.operation.type} · ${data.operation.crop}`} />
        <Field
          label="Time window"
          value={`${new Date(data.operation.startedAt).toLocaleString()} → ${new Date(data.operation.endedAt).toLocaleString()}`}
        />
        <Field
          label="Area (approx.)"
          value={`${data.field.areaCoveredHaApprox} ha · ${data.field.areaPrecision}`}
        />
        <Field label="Field" value={data.field.fieldId} />
        <Field label="Machine" value={data.machine.machineId} />
        <Field
          label="Constellation"
          value={
            data.constellation
              ? `${data.constellation.mode} · ${
                  data.constellation.accepted ? "accepted" : "pending"
                }`
              : "not submitted"
          }
        />
        <Field
          label="Signature"
          value={
            data.signatureValid === true
              ? "valid"
              : data.signatureValid === false
                ? "invalid"
                : "—"
          }
        />
        <Field label="Verification URL" value={`/verify/${hash}`} />
      </section>

      <section className="card">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Public GPS evidence
        </h2>
        <MapClient
          points={data.publicEvidence.gpsPathPreview ?? []}
          height={300}
          label={`${data.publicEvidence.gpsPathPreview?.length ?? 0} points · privacy policy: ${data.privacy.gpsPolicy}`}
        />
      </section>

      <section className="card border-cambium-100 bg-cambium-50/60">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cambium-700">
          Private by design
        </h2>
        <div className="grid gap-2 text-xs text-cambium-700 sm:grid-cols-2 lg:grid-cols-5">
          <div>Raw machine log: not public</div>
          <div>Exact GPS: not public</div>
          <div>Firmware: never accessed</div>
          <div>Navigation logic: never accessed</div>
          <div>Photos: hash-only</div>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          What is private vs public
        </h2>
        <table className="w-full text-xs">
          <thead className="text-ink-500">
            <tr>
              <th className="py-1 text-left font-medium">Item</th>
              <th className="py-1 text-left font-medium">Policy</th>
              <th className="py-1 text-left font-medium">Commitment</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-ink-100">
              <td className="py-2 font-medium">Raw machine log</td>
              <td className="py-2 text-ink-500">{data.privacy.rawLogPolicy}</td>
              <td className="py-2"><span className="hash">{data.privateEvidenceRefs.rawLogHash}</span></td>
            </tr>
            <tr className="border-t border-ink-100">
              <td className="py-2 font-medium">Exact GPS path</td>
              <td className="py-2 text-ink-500">{data.privacy.gpsPolicy}</td>
              <td className="py-2"><span className="hash">{data.privateEvidenceRefs.gpsPathHash}</span></td>
            </tr>
            <tr className="border-t border-ink-100">
              <td className="py-2 font-medium">Photos</td>
              <td className="py-2 text-ink-500">{data.privacy.photoPolicy}</td>
              <td className="py-2">{data.privateEvidenceRefs.photoCount} hashes</td>
            </tr>
            <tr className="border-t border-ink-100">
              <td className="py-2 font-medium">Yield</td>
              <td className="py-2 text-ink-500">{data.privacy.yieldPolicy}</td>
              <td className="py-2">
                {data.publicEvidence.yieldKgApprox !== undefined
                  ? `${data.publicEvidence.yieldKgApprox} kg (rounded)`
                  : "withheld"}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {data.attestations.length > 0 ? (
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Attestations
          </h2>
          <ul className="space-y-3 text-xs">
            {data.attestations.map((a, i) => (
              <li key={i}>
                <div className="font-medium">
                  {a.signerId} ({a.type})
                </div>
                <div className="mt-0.5 text-ink-500">{a.statement}</div>
                <div className="mt-1 text-[10px] text-ink-400">
                  signed {new Date(a.signedAt).toLocaleString()}
                </div>
                <div className="mt-1 text-[10px]">
                  pubkey: <span className="hash">{a.publicKeyHex}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card border-cambium-100 bg-cambium-50/60">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cambium-700">
          Claim boundary
        </h2>
        <ul className="space-y-1 text-xs text-cambium-700">
          <li>Does not certify carbon credits.</li>
          <li>Does not guarantee compliance.</li>
          <li>Does not expose proprietary machine logic.</li>
          <li>Intended use: {data.claimBoundary.intendedUse.join(", ")}.</li>
        </ul>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-tight">
      <div className="text-[11px] uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}
