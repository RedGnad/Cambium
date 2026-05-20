import { api, type ConstellationIntegrationDto } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const constellation = await api
    .get<ConstellationIntegrationDto>("/integrations/constellation")
    .catch(() => null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-ink-600">
          Live proof adapters used by Cambium evidence packets.
        </p>
      </header>

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Constellation Digital Evidence</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-600">
              Cambium submits signed field-evidence fingerprints to the official
              Digital Evidence <code className="hash">/fingerprints</code> API
              when live credentials are configured. Mock mode keeps the same
              payload shape and is visibly labelled in the UI.
            </p>
          </div>
          <span
            className={
              constellation?.mode === "live" ? "pill-live" : "pill-mock"
            }
          >
            {constellation?.mode ?? "unreachable"}
          </span>
        </div>

        {constellation ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard label="Live ready" value={constellation.liveReady ? "yes" : "no"} />
            <StatusCard
              label="API key"
              value={constellation.apiKeyConfigured ? "configured" : "missing"}
            />
            <StatusCard
              label="Org / tenant"
              value={
                constellation.orgConfigured && constellation.tenantConfigured
                  ? "configured"
                  : "missing"
              }
            />
            <StatusCard
              label="Endpoint"
              value={constellation.submissionEndpoint ?? "mock only"}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            API unreachable.
          </div>
        )}

        <div className="mt-5 rounded-md border border-ink-200 bg-ink-50 p-4 text-xs text-ink-600">
          <div className="font-medium text-ink-800">Live configuration</div>
          <pre className="mt-2 overflow-auto text-[11px] leading-relaxed">
{`CONSTELLATION_MODE=live
CONSTELLATION_API_BASE_URL=https://de-api.constellationnetwork.io/v1
CONSTELLATION_API_KEY=...
CONSTELLATION_ORG_ID=...
CONSTELLATION_TENANT_ID=...`}
          </pre>
          <a
            href={constellation?.docsUrl ?? "https://constellation-main.gitbook.io/digital-evidence/api-specification"}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-cambium hover:underline"
          >
            Digital Evidence API specification
          </a>
        </div>
      </section>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-tight">
      <div className="text-[11px] uppercase tracking-wide text-ink-500">
        {label}
      </div>
      <div className="mt-1 break-all text-sm font-medium text-ink-900">{value}</div>
    </div>
  );
}
