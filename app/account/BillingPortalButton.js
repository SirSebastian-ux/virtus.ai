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
        className="flex w-full items-center justify-between rounded-2xl border border-sky-900/25 bg-zinc-950/35 px-4 py-4 text-left text-white shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-zinc-950/55 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div>
          <p className="text-sm font-medium text-sky-100">
            Manage subscription
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Cancel, update payment, or manage billing
          </p>
        </div>

        <span className="text-sky-300/60">
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