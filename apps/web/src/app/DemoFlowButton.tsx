"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type DemoSeedDto } from "@/lib/api";

export function DemoFlowButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDemoFlow() {
    setBusy(true);
    setError(null);
    try {
      const seed = await api.post<DemoSeedDto>("/demo/seed");
      router.push(seed.nextPath);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" className="btn" onClick={runDemoFlow} disabled={busy}>
        {busy ? "Preparing demo..." : "Run demo flow"}
      </button>
      {error ? <div className="text-xs text-red-700">{error}</div> : null}
    </div>
  );
}
