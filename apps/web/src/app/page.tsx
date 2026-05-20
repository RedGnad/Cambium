import Link from "next/link";
import { api, type FieldDto, type MachineDto, type SessionDto, type EvidencePacketDto } from "@/lib/api";
import { DemoFlowButton } from "./DemoFlowButton";

export const dynamic = "force-dynamic";

async function loadCounts() {
  try {
    const [fields, machines, sessions, evidence] = await Promise.all([
      api.get<FieldDto[]>("/fields"),
      api.get<MachineDto[]>("/machines"),
      api.get<SessionDto[]>("/sessions"),
      api.get<EvidencePacketDto[]>("/evidence"),
    ]);
    return {
      fields: fields.length,
      machines: machines.length,
      sessions: sessions.length,
      evidenceTotal: evidence.length,
      evidenceSubmitted: evidence.filter((e) => e.status === "submitted").length,
      latestPackets: evidence.slice(0, 5),
    };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const data = await loadCounts();

  if (!data) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">API unreachable</h1>
        <p className="mt-2 text-sm text-ink-600">
          Could not reach the Cambium API at <code className="hash">/api/proxy</code>.
          Locally, run <code className="hash">pnpm dev</code> at the repo root.
          On Vercel, configure an external Postgres <code className="hash">DATABASE_URL</code>
          and demo signer keys, or set <code className="hash">API_BASE_URL</code> to a
          deployed Cambium API host.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-ink-600">
              The machine stays private. The proof layer becomes verifiable.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sessions" className="btn-secondary">
              Import session
            </Link>
            <DemoFlowButton />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Fields" value={data.fields} href="/fields" />
        <StatCard label="Machines" value={data.machines} href="/machines" />
        <StatCard label="Sessions imported" value={data.sessions} href="/sessions" />
        <StatCard
          label="Evidence packets"
          value={`${data.evidenceTotal}`}
          sub={`${data.evidenceSubmitted} submitted`}
          href="/evidence"
        />
      </section>

      <section className="card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          Latest evidence packets
        </h2>
        {data.latestPackets.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">
            No packets yet. Start by creating a field, registering a machine, and
            simulating a session.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {data.latestPackets.map((p) => (
              <li key={p.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/evidence/${p.id}`}
                    className="font-medium text-cambium hover:underline"
                  >
                    {p.packetHash.slice(0, 24)}…
                  </Link>
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card-tight transition hover:border-cambium-400"
    >
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink-900">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-ink-500">{sub}</div> : null}
    </Link>
  );
}
