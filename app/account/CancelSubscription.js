"use client";

import { useEffect, useState } from "react";

const LABELS = { life_coach: "Life Coach", plus: "Trainer", premium: "Mentor" };
function showDate(seconds) {
  if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) return "the end of your current billing period";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(Number(seconds) * 1000));
}

export default function CancelSubscription({ hasStripeCustomer = false }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(hasStripeCustomer);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [processingId, setProcessingId] = useState("");

  useEffect(() => {
    if (!hasStripeCustomer) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/stripe/subscription", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load subscription status.");
        if (active) setSubscriptions(data.subscriptions || []);
      } catch (err) {
        if (active) setError(err.message || "Subscription status unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [hasStripeCustomer]);

  async function confirmCancellation(subscriptionId) {
    setError("");
    setProcessingId(subscriptionId);
    try {
      const res = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.subscription?.cancellationScheduled) {
        throw new Error(data.error || "Cancellation could not be confirmed.");
      }
      setSubscriptions((items) => items.map((item) => item.id === subscriptionId ? data.subscription : item));
      setConfirmId("");
    } catch (err) {
      setError(err.message || "Unable to schedule cancellation.");
    } finally {
      setProcessingId("");
    }
  }

  return (
    <section className="rounded-2xl border border-[#d8bd85]/35 p-4" aria-label="Subscription cancellation">
      <h3 className="text-sm font-semibold virtus-theme-title">Stop subscription renewal</h3>
      <p className="mt-1 text-xs virtus-theme-muted">
        Cancel your individual membership without deleting your Virtus AI account.
      </p>
      {!hasStripeCustomer ? (
        <p className="mt-3 text-xs virtus-theme-muted">
          No individual Stripe subscription is linked to this account. If you subscribed through Google Play,
          cancel automatic renewal in <a className="underline text-[#e9c78b]" href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noopener noreferrer">Google Play subscriptions</a>.
          If you paid on the Virtus website, <a className="underline text-[#e9c78b]" href="/support">contact support</a> so your billing record can be verified.
        </p>
      ) : null}
      {loading ? <p className="mt-3 text-xs virtus-theme-muted">Checking billing status...</p> : null}
      {hasStripeCustomer && !loading && subscriptions.length === 0 && !error
        ? <p className="mt-3 text-xs virtus-theme-muted">No active individual Stripe subscription found.</p> : null}
      {subscriptions.map((subscription) => (
        <div key={subscription.id} className="mt-4 border-t border-[#d8bd85]/20 pt-3">
          <p className="text-sm font-medium virtus-theme-title">{LABELS[subscription.plan] || "Virtus AI membership"}</p>
          {subscription.cancellationScheduled ? (
            <p className="mt-2 text-sm text-[#e9c78b]" role="status">
              Cancellation scheduled. Your access continues until {showDate(subscription.cancelAt || subscription.periodEnd)}. Renewal is stopped.
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs virtus-theme-muted">
                Your current paid access continues until {showDate(subscription.periodEnd)} if you cancel now.
              </p>
              {confirmId === subscription.id ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm virtus-theme-title">Stop automatic renewal at the end of this billing period?</p>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" disabled={Boolean(processingId)} onClick={() => confirmCancellation(subscription.id)}
                      className="rounded-xl border border-red-400/60 px-4 py-2 text-sm text-red-200 hover:bg-red-950/30 disabled:opacity-50">
                      {processingId === subscription.id ? "Scheduling..." : "Confirm cancellation"}
                    </button>
                    <button type="button" disabled={Boolean(processingId)} onClick={() => setConfirmId("")}
                      className="rounded-xl border border-[#d8bd85]/40 px-4 py-2 text-sm virtus-theme-title disabled:opacity-50">
                      Keep subscription
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmId(subscription.id)}
                  className="mt-3 rounded-xl border border-[#d8bd85]/45 px-4 py-2 text-sm virtus-theme-title hover:border-[#e9c78b]">
                  Cancel subscription
                </button>
              )}
            </>
          )}
        </div>
      ))}
      {error ? <p className="mt-3 text-sm text-red-300" role="alert">{error}</p> : null}
    </section>
  );
}
