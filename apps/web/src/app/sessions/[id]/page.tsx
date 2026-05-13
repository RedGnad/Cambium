import Link from "next/link";
import { notFound } from "next/navigation";
import { api, type SessionDto } from "@/lib/api";
import { PrivacyAndBuild } from "./PrivacyAndBuild";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let session: SessionDto;
  try {
    session = await api.get<SessionDto>(`/sessions/${id}`);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-ink-500">
        <Link href="/sessions" className="hover:underline">
          ← all sessions
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {session!.operationType} · {session!.crop ?? "—"}
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Session {session!.id.slice(0, 8)}… · imported via {session!.importSource}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Field label="Started" value={new Date(session!.startedAt).toLocaleString()} />
        <Field label="Ended" value={new Date(session!.endedAt).toLocaleString()} />
        <Field
          label="Duration"
          value={`${Math.round(
            (new Date(session!.endedAt).getTime() -
              new Date(session!.startedAt).getTime()) /
              60000
          )} min`}
        />
        <Field label="Area covered" value={`${session!.areaCoveredHa ?? "—"} ha`} />
        <Field
          label="Yield (raw)"
          value={
            session!.yieldKgApprox !== null
              ? `${session!.yieldKgApprox} kg`
              : "—"
          }
        />
        <Field label="GPS points" value={`${session!.gpsPathPreview.length}`} />
      </section>

      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Private-evidence references (hashes only)
        </h2>
        <dl className="grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-ink-500">rawLogHash</dt>
            <dd className="hash">{session!.rawLogHash}</dd>
          </div>
          <div>
            <dt className="text-ink-500">gpsPathHash</dt>
            <dd className="hash">{session!.gpsPathHash}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink-500">photoHashes ({session!.photoHashes.length})</dt>
            <dd className="space-y-1">
              {session!.photoHashes.length === 0 ? (
                <span className="text-ink-500">none</span>
              ) : (
                session!.photoHashes.map((h) => (
                  <div key={h} className="hash">
                    {h}
                  </div>
                ))
              )}
            </dd>
          </div>
        </dl>
      </section>

      <PrivacyAndBuild session={session!} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-tight">
      <div className="text-[11px] uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}
