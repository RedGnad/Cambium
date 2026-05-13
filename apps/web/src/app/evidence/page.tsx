import Link from "next/link";
import { api, type EvidencePacketDto } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function EvidenceListPage() {
  const packets = await api.get<EvidencePacketDto[]>("/evidence").catch(() => []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Evidence packets</h1>
        <p className="mt-1 text-sm text-ink-600">
          Field Evidence Packets (v1) — cryptographically signed snapshots of
          privacy-transformed machine sessions.
        </p>
      </header>

      <div className="space-y-3">
        {packets.length === 0 ? (
          <div className="card text-sm text-ink-500">
            No packets yet. Build one from a session.
          </div>
        ) : (
          packets.map((p) => (
            <Link
              key={p.id}
              href={`/evidence/${p.id}`}
              className="card-tight block transition hover:border-cambium-400"
            >
              <div className="flex items-center justify-between">
                <span className="hash">{p.packetHash}</span>
                <div className="flex items-center gap-2">
                  <span className={`pill-${p.status}`}>{p.status}</span>
                  {p.constellationMode ? (
                    <span
                      className={
                        p.constellationMode === "mock" ? "pill-mock" : "pill-live"
                      }
                    >
                      Constellation: {p.constellationMode}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-1 text-xs text-ink-500">
                {p.assuranceLevel} · created {new Date(p.createdAt).toLocaleString()}
                {p.signedAt
                  ? ` · signed ${new Date(p.signedAt).toLocaleString()}`
                  : ""}
                {p.submittedAt
                  ? ` · submitted ${new Date(p.submittedAt).toLocaleString()}`
                  : ""}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
