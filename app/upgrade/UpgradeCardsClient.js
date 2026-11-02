"use client";

import { Capacitor } from "@capacitor/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

function getCheckoutSuccessMessage(searchParams) {
  const success = searchParams.get("success");

  if (success !== "true") return "";

  const selectedPlan = searchParams.get("plan");
  const selectedBilling = searchParams.get("billing");

  const planLabel =
    selectedPlan === "plus"
      ? "Trainer"
      : selectedPlan === "premium"
      ? "Mentor"
      : selectedPlan === "life_coach" ? "Life Coach" : "Membership";

  const billingLabel =
    selectedBilling === "yearly"
      ? "yearly"
      : selectedBilling === "monthly"
      ? "monthly"
      : "";

  return billingLabel
    ? `${planLabel} ${billingLabel} checkout completed. Membership activation is being confirmed.`
    : `${planLabel} checkout completed. Membership activation is being confirmed.`;
}

export default function UpgradeCardsClient({ currentPlan, isAuthenticated }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [error, setError] = useState("");
  const [isNativeIosApp] = useState(() => {
    if (typeof window === "undefined") return false;

    return Capacitor.getPlatform() === "ios";
  });
  const successMessage = getCheckoutSuccessMessage(searchParams);

  useEffect(() => {
    function syncUpgradeAppearance() {
      const savedAppearance = localStorage.getItem("virtus_appearance");
      const nextAppearance = savedAppearance === "light" ? "light" : "dark";

      document.documentElement.setAttribute(
        "data-virtus-appearance",
        nextAppearance
      );
    }

    syncUpgradeAppearance();

    window.addEventListener("storage", syncUpgradeAppearance);
    window.addEventListener("focus", syncUpgradeAppearance);

    return () => {
      window.removeEventListener("storage", syncUpgradeAppearance);
      window.removeEventListener("focus", syncUpgradeAppearance);
    };
  }, []);

  useEffect(() => {
    if (!successMessage) return;

    router.refresh();

    // Keep confirmation visible until Stripe webhook updates the account.
  }, [successMessage, router]);

  useEffect(() => {
    function resetCheckoutLoading() {
      setLoadingPlan(null);
    }

    window.addEventListener("focus", resetCheckoutLoading);
    window.addEventListener("pageshow", resetCheckoutLoading);

    return () => {
      window.removeEventListener("focus", resetCheckoutLoading);
      window.removeEventListener("pageshow", resetCheckoutLoading);
    };
  }, []);

  const isGuestSelection = !isAuthenticated;
  const isYearly = billingCycle === "yearly";

  const canChooseFree = currentPlan === "free";
  const canChoosePlus = currentPlan === "free" || currentPlan === "plus";
  const canChoosePremium =
    currentPlan === "free" || currentPlan === "plus" || currentPlan === "premium";

  async function handlePlanChange(plan) {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (plan === currentPlan) { setError("This is already your current plan."); return; }
    if (isNativeIosApp) { setError("Manage paid plans at virtusaiworld.com in your browser."); return; }
    setLoadingPlan(plan); setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan,billingCycle})});
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Unable to open checkout.");
      window.location.assign(data.url);
    } catch (e) { setError(e.message || "Checkout unavailable."); setLoadingPlan(null); }
  }

  const cardClass =
    "virtus-plan-card virtus-theme-card flex h-full flex-col rounded-3xl border border-[#d8bd85]/45 bg-gradient-to-b from-[#114337] via-[#0a302a] to-[#061f1d] p-7 shadow-xl shadow-black/35 transition hover:-translate-y-1 hover:border-[#f0d69e] hover:shadow-[#d8bd85]/10";

  const premiumCardClass =
    "virtus-plan-card virtus-theme-card flex h-full flex-col rounded-3xl border border-[#e9c983]/85 bg-gradient-to-b from-[#23503e] via-[#104033] to-[#07261f] p-7 shadow-2xl shadow-[#d8bd85]/15 ring-1 ring-[#d8bd85]/20 transition hover:-translate-y-1 hover:border-[#fff0bf]";

  const planLabelClass =
    "text-xs uppercase tracking-[0.18em] text-[#edc786]";

  const titleClass =
    "mt-3 text-2xl font-semibold tracking-tight text-[#fff5d9]";

  const descriptionClass =
    "mt-4 text-sm leading-6 text-[#c6d9ce]";

  const featureListClass =
    "mt-6 space-y-3 text-sm leading-6 text-[#eff4e8]";

  const featureDotClass =
    "mt-2 h-2 w-2 shrink-0 rounded-full bg-[#eccd8c]";

  const activeButtonClass =
    "mt-7 rounded-xl border border-[#ddc18a] bg-[#e6c98e] px-4 py-3 text-sm font-bold text-[#073127] transition hover:bg-[#ffe7ad] disabled:opacity-50";

  const primaryButtonClass =
    "mt-7 rounded-xl border border-[#f3dca4] bg-gradient-to-r from-[#cfaa64] via-[#f4dda6] to-[#cba15e] px-4 py-3 text-sm font-bold text-[#08352c] shadow-lg shadow-black/20 transition hover:brightness-110 disabled:opacity-50";

  const currentButtonClass =
    "mt-7 rounded-xl border border-[#a98e5f]/40 bg-[#0b2923] px-4 py-3 text-sm text-[#d0b984]";

  const noteClass =
    "mt-5 rounded-xl border border-[#b99d6c]/30 bg-[#082620]/70 px-4 py-3 text-sm leading-6 text-[#cdd8ca]";

  const toggleButtonClass = (value) =>
    billingCycle === value
      ? "rounded-full border border-[#f0ce8f] bg-[#e8c98d] px-4 py-2 text-sm font-semibold text-[#092e25] shadow-sm"
      : "rounded-full border border-transparent px-4 py-2 text-sm font-medium text-[#c0cebe] transition hover:bg-[#174d3e] hover:text-[#ffe6b1]";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[#d7b879]/35 bg-gradient-to-r from-[#0a352b] to-[#082721] p-5 shadow-lg shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#edc786]">
            Billing
          </p>
          <p className="mt-1 text-sm virtus-theme-muted">
            Choose monthly or annual billing.
          </p>
          <p className="mt-3 max-w-2xl rounded-xl border border-[#ac956b]/30 bg-[#082a24] px-4 py-3 text-sm leading-6 text-[#c6d8cd]">
            Secure Stripe checkout. Existing subscriptions keep their current billing until you choose to change plans.
          </p>
        </div>

        <div className="inline-flex w-full rounded-full border border-[#d4b57d]/40 bg-[#051e1b] p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={toggleButtonClass("monthly")}
          >
            Monthly
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={toggleButtonClass("yearly")}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="virtus-interior-plan-grid grid items-stretch gap-6">
        {isGuestSelection || currentPlan === "free" ? (
          <section className={cardClass}>
            <div className="flex-1">
              <p className={planLabelClass}>Life Coach</p>

              <h2 className={titleClass}>Conscious personal growth</h2>

              <div className="virtus-theme-card-soft mt-4 rounded-2xl border border-[#d8bd85]/35 bg-[#092820]/70 px-4 py-4">
                <p className="virtus-plan-price text-2xl font-semibold virtus-theme-title">
                  {isYearly ? "$119.88" : "$9.99"}{" "}
                  <span className="text-sm font-normal virtus-theme-muted">
                    / {isYearly ? "year" : "month"}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-[#eac789]">
                  {isYearly ? "Billed annually · $9.99/month equivalent" : "Billed monthly"}
                </p>
              </div>

              <p className={descriptionClass}>
                A Life Coach experience for people who want guided reflection, saved
                chats, and an introduction to conscious personal development.
              </p>

              <ul className={featureListClass}>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Saved chats so your conversations are not lost.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Standard daily use for light guidance and reflection.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Basic continuity for one active project space.</span>
                </li>
              </ul>

              <p className={noteClass}>
                Best for: structured reflection, personal development, and getting
                guided personal development.
              </p>
            </div>

            {isGuestSelection ? (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className={activeButtonClass}
              >
                Choose Life Coach
              </button>
            ) : canChooseFree ? (
              <button
                type="button"
                disabled={loadingPlan === "life_coach"}
                onClick={() => handlePlanChange("life_coach")}
                className={activeButtonClass}
              >
                {loadingPlan === "life_coach" ? "Opening checkout…" : "Choose Life Coach"}
              </button>
            ) : null}
          </section>
        ) : null}

        {isGuestSelection || currentPlan === "free" || currentPlan === "plus" ? (
          <section className={cardClass}>
            <div className="flex-1">
              <p className={planLabelClass}>Trainer</p>

              <h2 className={titleClass}>Guided training and development</h2>

              <div className="virtus-theme-card-soft mt-4 rounded-2xl border border-[#d8bd85]/35 bg-[#092820]/70 px-4 py-4">
                <p className="virtus-plan-price text-2xl font-semibold virtus-theme-title">
                  {isYearly ? "$239.88" : "$19.99"}{" "}
                  <span className="text-sm font-normal virtus-theme-muted">
                    / {isYearly ? "year" : "month"}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-[#eac789]">
                  {isYearly ? "Billed annually · no discount" : "Billed monthly"}
                </p>
              </div>

              <p className={descriptionClass}>
                A structured training experience with better continuity,
                deeper reflection, and more support across chats.
              </p>

              <ul className={featureListClass}>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Stronger memory and personal continuity across chats.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>More guided coaching for decisions, emotions, and habits.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Support for up to 3 project spaces.</span>
                </li>
              </ul>

              <p className={noteClass}>
                Best for: structured learning, personal growth, emotional discipline,
                and regular support.
              </p>
            </div>

            {isGuestSelection ? (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className={activeButtonClass}
              >
                Choose Trainer
              </button>
            ) : canChoosePlus ? (
              <button
                type="button"
                disabled={currentPlan === "plus" || loadingPlan === "plus"}
                onClick={() => handlePlanChange("plus")}
                className={
                  currentPlan === "plus" ? currentButtonClass : activeButtonClass
                }
              >
                {currentPlan === "plus"
                  ? "Current plan"
                  : isYearly
                  ? "Choose Trainer"
                  : "Choose Trainer"}
              </button>
            ) : null}
          </section>
        ) : null}

        {isGuestSelection ||
        currentPlan === "free" ||
        currentPlan === "plus" ||
        currentPlan === "premium" ? (
          <section className={premiumCardClass}>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className={planLabelClass}>Mentor</p>
                <span className="rounded-full border border-[#e8c98d]/60 bg-[#d4b474]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f8dfa5]">
                  Advanced
                </span>
              </div>

              <h2 className={titleClass}>Advanced coaching and mentorship</h2>

              <div className="virtus-theme-card-soft mt-4 rounded-2xl border border-[#e8c98d]/55 bg-[#0c3027]/80 px-4 py-4 shadow-sm shadow-black/20">
                <p className="virtus-plan-price text-2xl font-semibold virtus-theme-title">
                  {isYearly ? "$359.88" : "$29.99"}{" "}
                  <span className="text-sm font-normal virtus-theme-muted">
                    / {isYearly ? "year" : "month"}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-[#eac789]">
                  {isYearly ? "Billed annually · no discount" : "Billed monthly"}
                </p>
              </div>

              <p className={descriptionClass}>
                The most advanced Virtus experience for strategic thinking, project
                continuity, leadership, and advanced personal discipline.
              </p>

              <ul className={featureListClass}>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Advanced personalization and structured reasoning.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Personal and project continuity for serious work.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Advanced support for up to 50 project spaces.</span>
                </li>
              </ul>

              <p className={noteClass}>
                Best for: leaders, creators, coaches, founders, deep strategy,
                and long-term transformation.
              </p>
            </div>

            {isGuestSelection ? (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className={"virtus-gold-button " + primaryButtonClass}
              >
                Choose Mentor
              </button>
            ) : canChoosePremium ? (
              <button
                type="button"
                disabled={currentPlan === "premium" || loadingPlan === "premium"}
                onClick={() => handlePlanChange("premium")}
                className={
                  currentPlan === "premium" ? currentButtonClass : "virtus-gold-button " + primaryButtonClass
                }
              >
                {currentPlan === "premium"
                  ? "Current plan"
                  : isYearly
                  ? "Choose Mentor"
                  : "Choose Mentor"}
              </button>
            ) : null}
          </section>
        ) : null}

        {successMessage ? (
          <p className="rounded-2xl border border-emerald-900/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300 md:col-span-3">
            {successMessage}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-sm text-red-300 md:col-span-3">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
