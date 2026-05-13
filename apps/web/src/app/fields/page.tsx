import { api, type FieldDto } from "@/lib/api";
import { CreateFieldForm } from "./CreateFieldForm";

export const dynamic = "force-dynamic";

export default async function FieldsPage() {
  const fields = await api.get<FieldDto[]>("/fields").catch(() => []);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_360px]">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Fields</h1>
        <p className="mt-1 text-sm text-ink-600">
          Pseudonymous plot identifiers. We do not request exact field addresses
          and we keep precise GPS off the proof layer.
        </p>

        <div className="mt-6 space-y-3">
          {fields.length === 0 ? (
            <div className="card text-sm text-ink-500">No fields yet.</div>
          ) : (
            fields.map((f) => (
              <div key={f.id} className="card-tight">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{f.displayName}</div>
                  <span className="text-[11px] text-ink-500">{f.privacyLevel}</span>
                </div>
                <div className="mt-1 text-xs text-ink-500">
                  code: <span className="hash">{f.fieldCode}</span>
                  {f.region ? <> · region: {f.region}</> : null}
                  {f.cropDefault ? <> · crop: {f.cropDefault}</> : null}
                  {f.approximateAreaHa ? <> · ≈ {f.approximateAreaHa} ha</> : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <aside>
        <div className="card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            New field
          </h2>
          <CreateFieldForm />
        </div>
      </aside>
    </div>
  );
}
