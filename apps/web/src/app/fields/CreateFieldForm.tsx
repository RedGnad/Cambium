"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function CreateFieldForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        displayName: String(formData.get("displayName") || "").trim(),
        fieldCode: String(formData.get("fieldCode") || "").trim(),
        privacyLevel: String(formData.get("privacyLevel") || "standard"),
      };
      const region = String(formData.get("region") || "").trim();
      if (region) payload.region = region;
      const cropDefault = String(formData.get("cropDefault") || "").trim();
      if (cropDefault) payload.cropDefault = cropDefault;
      const area = String(formData.get("approximateAreaHa") || "").trim();
      if (area) payload.approximateAreaHa = Number(area);

      await api.post("/fields", payload);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      action={onSubmit}
      className="mt-3 space-y-3"
    >
      <div>
        <label className="label">Display name</label>
        <input className="input" name="displayName" required placeholder="Field Alpha" />
      </div>
      <div>
        <label className="label">Field code (pseudonym)</label>
        <input
          className="input"
          name="fieldCode"
          required
          placeholder="field_alpha"
          pattern="[a-z0-9_\-]+"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Region (optional)</label>
          <input className="input" name="region" placeholder="FR-IDF" />
        </div>
        <div>
          <label className="label">Default crop</label>
          <input className="input" name="cropDefault" placeholder="wheat" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Approx. area (ha)</label>
          <input
            className="input"
            name="approximateAreaHa"
            type="number"
            step="0.01"
            min="0"
            placeholder="1.5"
          />
        </div>
        <div>
          <label className="label">Privacy level</label>
          <select className="select" name="privacyLevel" defaultValue="standard">
            <option value="low">low</option>
            <option value="standard">standard</option>
            <option value="high">high</option>
          </select>
        </div>
      </div>
      {error ? <div className="text-xs text-red-700">{error}</div> : null}
      <button type="submit" className="btn w-full" disabled={busy}>
        {busy ? "Creating…" : "Create field"}
      </button>
      <p className="text-[11px] text-ink-500">
        We never request precise addresses or full coordinates here. Privacy
        transforms apply when an evidence packet is built.
      </p>
    </form>
  );
}
