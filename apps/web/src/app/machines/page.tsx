import { api, type MachineDto } from "@/lib/api";
import { CreateMachineForm } from "./CreateMachineForm";

export const dynamic = "force-dynamic";

export default async function MachinesPage() {
  const machines = await api.get<MachineDto[]>("/machines").catch(() => []);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_360px]">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Machines</h1>
        <p className="mt-1 text-sm text-ink-600">
          Cambium stores a pseudonymous machine identity. It does not access
          firmware, navigation logic, safety systems or proprietary telemetry.
        </p>

        <div className="mt-6 space-y-3">
          {machines.length === 0 ? (
            <div className="card text-sm text-ink-500">No machines yet.</div>
          ) : (
            machines.map((m) => (
              <div key={m.id} className="card-tight">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{m.machineCode}</div>
                  <span className="text-[11px] text-ink-500">{m.status}</span>
                </div>
                <div className="mt-1 text-xs text-ink-500">
                  type: {m.machineType} · vendor visible:{" "}
                  {m.vendorVisible ? "yes" : "no"}
                </div>
                {m.publicKeyHex ? (
                  <div className="mt-1 text-[10px] text-ink-400">
                    pubkey: <span className="hash">{m.publicKeyHex}</span>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <aside>
        <div className="card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Register machine
          </h2>
          <CreateMachineForm />
        </div>
      </aside>
    </div>
  );
}
