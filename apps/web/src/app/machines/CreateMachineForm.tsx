"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const MACHINE_TYPES = [
  "autonomous_harvester",
  "autonomous_tractor",
  "autonomous_sprayer",
  "soil_scanner",
  "uav_scout",
  "ground_sensor_gateway",
  "other",
];

export function CreateMachineForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        machineCode: String(formData.get("machineCode") || "").trim(),
        machineType: String(formData.get("machineType") || ""),
        vendorVisible: formData.get("vendorVisible") === "on",
      };
      const pub = String(formData.get("publicKeyHex") || "").trim();
      if (pub) payload.publicKeyHex = pub;
      await api.post("/machines", payload);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={onSubmit} className="mt-3 space-y-3">
      <div>
        <label className="label">Machine code (pseudonym)</label>
        <input
          className="input"
          name="machineCode"
          required
          placeholder="machine_demo_001"
          pattern="[a-z0-9_\-]+"
        />
      </div>
      <div>
        <label className="label">Machine type</label>
        <select className="select" name="machineType" required defaultValue="autonomous_harvester">
          {MACHINE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Public key (hex, optional)</label>
        <input
          className="input"
          name="publicKeyHex"
          placeholder="03ab… or 0x04…"
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-ink-700">
        <input type="checkbox" name="vendorVisible" />
        Vendor identity is visible in the public packet
      </label>
      {error ? <div className="text-xs text-red-700">{error}</div> : null}
      <button type="submit" className="btn w-full" disabled={busy}>
        {busy ? "Registering…" : "Register machine"}
      </button>
    </form>
  );
}
