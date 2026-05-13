import Link from "next/link";
import { api, type FieldDto, type MachineDto, type SessionDto } from "@/lib/api";
import { SessionImporter } from "./SessionImporter";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const [fields, machines, sessions] = await Promise.all([
    api.get<FieldDto[]>("/fields").catch(() => []),
    api.get<MachineDto[]>("/machines").catch(() => []),
    api.get<SessionDto[]>("/sessions").catch(() => []),
  ]);

  const canImport = fields.length > 0 && machines.length > 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Machine sessions</h1>
        <p className="mt-1 text-sm text-ink-600">
          Import a real machine session JSON or generate a deterministic simulated
          session. The raw log itself is never stored — only its sha256 hash.
        </p>
      </header>

      {canImport ? (
        <SessionImporter fields={fields} machines={machines} />
      ) : (
        <div className="card text-sm text-ink-600">
          You need at least one <Link className="text-cambium underline" href="/fields">field</Link>{" "}
          and one <Link className="text-cambium underline" href="/machines">machine</Link>{" "}
          before importing or simulating a session.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Recent sessions
        </h2>
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="card text-sm text-ink-500">No sessions yet.</div>
          ) : (
            sessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="card-tight block transition hover:border-cambium-400"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {s.operationType} · {s.crop ?? "—"}
                  </div>
                  <span className="text-[11px] uppercase text-ink-500">
                    {s.importSource}
                  </span>
                </div>
                <div className="mt-1 text-xs text-ink-500">
                  {new Date(s.startedAt).toLocaleString()} →{" "}
                  {new Date(s.endedAt).toLocaleString()} · {s.gpsPathPreview.length}{" "}
                  GPS pts · {s.areaCoveredHa ?? "—"} ha
                  {s.yieldKgApprox !== null
                    ? ` · ≈ ${s.yieldKgApprox} kg yield`
                    : ""}
                </div>
                <div className="mt-1 text-[10px] text-ink-400">
                  raw log: <span className="hash">{s.rawLogHash}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
