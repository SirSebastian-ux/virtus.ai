"use client";

import { useState } from "react";

export default function BillingPortalButton({ hasStripeCustomer = false, currentPlan = "Life Coach" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openBillingPortal() {
    if (!hasStripeCustomer) return;
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
        disabled={loading || !hasStripeCustomer}
        className="virtus-theme-card flex w-full items-center justify-between rounded-2xl border border-sky-900/25 px-4 py-4 text-left shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-sky-950/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div>
          <p className="text-sm font-medium virtus-theme-title">
            Manage subscription
          </p>
          <p className="mt-1 text-xs virtus-theme-muted">
            {hasStripeCustomer ? "Cancel, update payment, or manage billing" : "Billing portal not linked to this account"}
          </p>
        </div>

        <span className="text-sky-300/70">
          {loading ? "..." : "›"}
        </span>
      </button>

      {!hasStripeCustomer ? (
        <div className="virtus-billing-status mt-3 rounded-xl border border-[#eac78b]/35 bg-[#063b31]/70 px-4 py-3 text-sm text-[#e9d4a5]" role="status">
          <p className="font-semibold text-[#f2d798]">{currentPlan} membership is active in Virtus.</p>
          <p className="mt-1 text-xs leading-5 text-[#c9dad0]">No Virtus Stripe billing profile is linked to this account. Your existing coaching access is unchanged. If you expected a paid Virtus subscription, contact support to verify the payment before connecting a billing record. Do not purchase again to fix this message.</p>
          <a className="mt-2 inline-block text-xs font-semibold text-[#f4d78c] underline underline-offset-4" href="/support">Contact support</a>
        </div>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
