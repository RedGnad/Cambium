import Link from "next/link";
import { notFound } from "next/navigation";
import { api, type EvidencePacketDetailDto } from "@/lib/api";
import { EvidenceActions } from "./EvidenceActions";

export const dynamic = "force-dynamic";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let pkt: EvidencePacketDetailDto;
  try {
    pkt = await api.get<EvidencePacketDetailDto>(`/evidence/${id}`);
  } catch {
    notFound();
  }

  const submission = pkt!.constellationSubmissions[0];

  return (
    <div className="space-y-6">
      <nav className="text-xs text-ink-500">
        <Link href="/evidence" className="hover:underline">
          ← all packets
        </Link>
      </nav>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Field Evidence Packet
          </h1>
          <p className="mt-1 break-all text-xs text-ink-500">
            {pkt!.packetHash}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`pill-${pkt!.status}`}>{pkt!.status}</span>
          <span className="pill bg-ink-100 text-ink-700">{pkt!.assuranceLevel}</span>
          {submission ? (
            <span
              className={
                submission.mode === "mock" ? "pill-mock" : "pill-live"
              }
            >
              Constellation: {submission.mode}
            </span>
          ) : null}
        </div>
      </header>

      <EvidenceActions
        packetId={pkt!.id}
        publicVerifySlug={pkt!.publicVerifySlug}
        status={pkt!.status}
      />

      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Constellation submissions
        </h2>
        {pkt!.constellationSubmissions.length === 0 ? (
          <p className="text-sm text-ink-500">Not yet submitted.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {pkt!.constellationSubmissions.map((s, i) => (
              <li key={i} className="rounded border border-ink-200 p-3">
                <div className="flex items-center justify-between">
                  <span
                    className={s.mode === "mock" ? "pill-mock" : "pill-live"}
                  >
                    {s.mode}
                  </span>
                  <span
                    className={
                      s.accepted
                        ? "text-emerald-700"
                        : s.accepted === false
                          ? "text-red-700"
                          : "text-ink-500"
                    }
                  >
                    {s.accepted ? "accepted" : s.accepted === false ? "rejected" : "—"}
                  </span>
                </div>
                <div className="mt-1 text-ink-500">
                  event: <span className="hash">{s.eventId ?? "—"}</span>
                </div>
                {s.message ? (
                  <div className="mt-1 text-ink-600">{s.message}</div>
                ) : null}
                <div className="mt-1 text-[10px] text-ink-400">
                  {new Date(s.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Canonical packet (signed form)
        </h2>
        <pre className="overflow-auto rounded bg-ink-50 p-3 text-[10.5px] leading-snug text-ink-800">
{JSON.stringify(pkt!.packet, null, 2)}
        </pre>
      </section>
    </div>
  );
}
