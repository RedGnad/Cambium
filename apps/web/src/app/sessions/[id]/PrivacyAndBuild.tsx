"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type PrivacyPreviewDto, type SessionDto } from "@/lib/api";
import { MapClient } from "@/components/MapClient";

type Level = "low" | "standard" | "high";

export function PrivacyAndBuild({ session }: { session: SessionDto }) {
  const router = useRouter();
  const [level, setLevel] = useState<Level>("standard");
  const [preview, setPreview] = useState<PrivacyPreviewDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .post<PrivacyPreviewDto>("/privacy/preview-transform", {
        sessionId: session.id,
        privacyLevel: level,
      })
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [level, session.id]);

  async function build() {
    setError(null);
    setBuilding(true);
    try {
      const result = await api.post<{ id: string }>(
        `/evidence/from-session/${session.id}`,
        { privacyLevel: level }
      );
      router.push(`/evidence/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setBuilding(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Privacy transform preview
          </h2>
          <p className="mt-1 max-w-xl text-xs text-ink-500">
            Exact GPS, raw logs and sensitive machine data stay private. Cambium
            only exposes the proof layer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["low", "standard", "high"] as Level[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={l === level ? "btn" : "btn-secondary"}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Raw input → Public packet
          </h3>
          {loading ? (
            <div className="text-sm text-ink-500">Computing…</div>
          ) : preview ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-ink-500">
                  <th className="py-1 text-left font-medium">field</th>
                  <th className="py-1 text-left font-medium">raw</th>
                  <th className="py-1 text-left font-medium">public</th>
                </tr>
              </thead>
              <tbody>
                {preview.transforms.map((t) => (
                  <tr key={t.field} className="border-t border-ink-100">
                    <td className="py-2 pr-2 font-medium">{t.field}</td>
                    <td className="py-2 pr-2 text-ink-500">{t.raw}</td>
                    <td className="py-2">{t.public}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {preview?.warnings?.length ? (
            <ul className="mt-3 rounded bg-amber-50 p-2 text-[11px] text-amber-800">
              {preview.warnings.map((w) => (
                <li key={w}>· {w}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="card">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Public GPS evidence (after transform)
          </h3>
          <MapClient
            points={preview?.publicPreview.gpsPathPreview ?? []}
            height={260}
            label={
              preview
                ? `${preview.publicPreview.gpsPathPreview.length} points · area ≈ ${preview.publicPreview.areaCoveredHaApprox} ha (${preview.publicPreview.areaPrecision})`
                : ""
            }
          />
        </div>
      </div>

      {error ? <div className="text-xs text-red-700">{error}</div> : null}

      <div className="flex items-center justify-between rounded-md border border-cambium-100 bg-cambium-50 p-4">
        <div className="text-sm text-cambium-700">
          The machine stays private. The proof layer becomes verifiable.
        </div>
        <button onClick={build} disabled={building || loading || !preview} className="btn">
          {building ? "Building…" : "Build Field Evidence Packet"}
        </button>
      </div>
    </section>
  );
}
