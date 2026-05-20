"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type SubmitResultDto } from "@/lib/api";

export function EvidenceActions({
  packetId,
  publicVerifySlug,
  status,
}: {
  packetId: string;
  publicVerifySlug: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmitResultDto | null>(null);

  async function sign() {
    setError(null);
    setBusy("sign");
    try {
      await api.post(`/evidence/${packetId}/sign`, {
        signerId: "farmer_demo_001",
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    setError(null);
    setBusy("submit");
    try {
      const r = await api.post<SubmitResultDto>(`/evidence/${packetId}/submit`);
      setSubmitted(r);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <div className="font-medium">
            {status === "draft" && "Step 1 of 3 — sign the packet"}
            {status === "signed" && "Step 2 of 3 — submit fingerprint to Constellation"}
            {status === "submitted" && "Step 3 of 3 — verify publicly"}
            {!["draft", "signed", "submitted"].includes(status) && status}
          </div>
          <div className="text-xs text-ink-500">
            {status === "draft" &&
              "Signing uses the server-side demo secp256k1 key. For production, replace with farmer-held key."}
            {status === "signed" &&
              "Only the packet fingerprint is submitted. Sensitive farm data never leaves Cambium."}
            {status === "submitted" &&
              "Anyone with the verify URL can confirm integrity without seeing raw evidence."}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "draft" ? (
            <>
              <span className="pill-draft">demo signer</span>
              <button className="btn" disabled={busy !== null} onClick={sign}>
                {busy === "sign" ? "Signing…" : "Sign packet"}
              </button>
            </>
          ) : null}
          {status === "signed" ? (
            <button className="btn" disabled={busy !== null} onClick={submit}>
              {busy === "submit" ? "Submitting…" : "Submit to Constellation"}
            </button>
          ) : null}
          {status === "submitted" ? (
            <a
              className="btn"
              href={submitted ? submitted.verifyUrl : `/verify/${publicVerifySlug}`}
            >
              Open verify page
            </a>
          ) : null}
          <a
            className="btn-secondary"
            href={`/api/proxy/evidence/${packetId}/pdf`}
            target="_blank"
            rel="noreferrer"
          >
            Download PDF
          </a>
        </div>
      </div>
      {error ? <div className="mt-2 text-xs text-red-700">{error}</div> : null}
    </section>
  );
}
