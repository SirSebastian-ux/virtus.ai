"use client";

import { useState } from "react";

export default function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openBillingPortal() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Could not open billing portal.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Could not open billing portal.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={openBillingPortal}
        disabled={loading}
        className="virtus-theme-card flex w-full items-center justify-between rounded-2xl border border-sky-900/25 px-4 py-4 text-left shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-sky-950/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div>
          <p className="text-sm font-medium virtus-theme-title">
            Manage subscription
          </p>
          <p className="mt-1 text-xs virtus-theme-muted">
            Cancel, update payment, or manage billing
          </p>
        </div>

        <span className="text-sky-300/70">
          {loading ? "..." : "›"}
        </span>
      </button>

      {error ? (
        <p className="mt-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
