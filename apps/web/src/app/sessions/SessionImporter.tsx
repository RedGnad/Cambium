"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type FieldDto, type MachineDto, type SessionDto } from "@/lib/api";

const OPERATION_TYPES = [
  "HARVEST",
  "SOIL_SCAN",
  "SPRAYING",
  "MACHINE_PASS",
  "PHOTO_CAPTURE",
  "SENSOR_LOG",
];

export function SessionImporter({
  fields,
  machines,
}: {
  fields: FieldDto[];
  machines: MachineDto[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"simulate" | "paste">("simulate");

  return (
    <section className="card">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          className={
            tab === "simulate"
              ? "btn"
              : "btn-secondary"
          }
          onClick={() => setTab("simulate")}
        >
          Generate simulated session
        </button>
        <button
          type="button"
          className={tab === "paste" ? "btn" : "btn-secondary"}
          onClick={() => setTab("paste")}
        >
          Paste JSON
        </button>
      </div>

      {tab === "simulate" ? (
        <SimulateForm fields={fields} machines={machines} onDone={(s) => router.push(`/sessions/${s.id}`)} />
      ) : (
        <PasteForm fields={fields} machines={machines} onDone={(s) => router.push(`/sessions/${s.id}`)} />
      )}
    </section>
  );
}

function SimulateForm({
  fields,
  machines,
  onDone,
}: {
  fields: FieldDto[];
  machines: MachineDto[];
  onDone: (s: SessionDto) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    setBusy(true);
    try {
      const session = await api.post<SessionDto>("/sessions/simulate", {
        fieldId: String(formData.get("fieldId")),
        machineId: String(formData.get("machineId")),
        operationType: String(formData.get("operationType")),
        crop: String(formData.get("crop") || "wheat"),
      });
      onDone(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setBusy(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Field</label>
          <select className="select" name="fieldId" required defaultValue={fields[0]?.id}>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.displayName} ({f.fieldCode})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Machine</label>
          <select className="select" name="machineId" required defaultValue={machines[0]?.id}>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.machineCode}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Operation</label>
          <select className="select" name="operationType" defaultValue="HARVEST">
            {OPERATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Crop</label>
          <input className="input" name="crop" defaultValue="wheat" />
        </div>
      </div>
      {error ? <div className="text-xs text-red-700">{error}</div> : null}
      <button type="submit" className="btn" disabled={busy}>
        {busy ? "Simulating…" : "Generate session"}
      </button>
      <p className="text-[11px] text-ink-500">
        Simulator is deterministic per (field, machine, operation). It produces
        a serpentine GPS path, synthetic sensor list and content hashes — no real
        farm data.
      </p>
    </form>
  );
}

const SAMPLE_JSON = JSON.stringify(
  {
    machineCode: "machine_demo_001",
    fieldCode: "field_alpha",
    operationType: "HARVEST",
    crop: "wheat",
    startedAt: "2026-06-12T09:15:00Z",
    endedAt: "2026-06-12T10:42:00Z",
    areaCoveredHa: 1.42,
    yieldKgApprox: 860,
    gpsPathPreview: [
      [48.8566, 2.3522],
      [48.8569, 2.3526],
    ],
    photoHashes: [],
  },
  null,
  2
);

function PasteForm({
  fields,
  machines,
  onDone,
}: {
  fields: FieldDto[];
  machines: MachineDto[];
  onDone: (s: SessionDto) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [json, setJson] = useState(SAMPLE_JSON);

  const parsed = useMemo(() => {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [json]);

  async function onSubmit(formData: FormData) {
    setError(null);
    setWarnings([]);
    setBusy(true);
    try {
      if (!parsed) throw new Error("invalid JSON");
      const result = await api.post<SessionDto>("/sessions/import", {
        fieldId: String(formData.get("fieldId")),
        machineId: String(formData.get("machineId")),
        session: parsed,
      });
      if (result.privacyWarnings?.length) setWarnings(result.privacyWarnings);
      onDone(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setBusy(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Field</label>
          <select className="select" name="fieldId" required defaultValue={fields[0]?.id}>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.displayName} ({f.fieldCode})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Machine</label>
          <select className="select" name="machineId" required defaultValue={machines[0]?.id}>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.machineCode}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Session JSON</label>
        <textarea
          className="textarea h-64"
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        {!parsed ? (
          <div className="mt-1 text-[11px] text-red-700">JSON does not parse.</div>
        ) : null}
      </div>
      {warnings.length > 0 ? (
        <ul className="rounded bg-amber-50 p-2 text-[11px] text-amber-800">
          {warnings.map((w) => (
            <li key={w}>· {w}</li>
          ))}
        </ul>
      ) : null}
      {error ? <div className="text-xs text-red-700">{error}</div> : null}
      <button type="submit" className="btn" disabled={busy || !parsed}>
        {busy ? "Importing…" : "Import session"}
      </button>
    </form>
  );
}
