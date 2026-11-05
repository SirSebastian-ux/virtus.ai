"use client";

import { Capacitor } from "@capacitor/core";
import { beginVirtusPlayPurchase, observeVirtusPlayPurchases, isVirtusPlayNativeAvailable } from "@/lib/google-play-native";
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

export default function UpgradeCardsClient({ currentPlan, isAuthenticated, userId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [error, setError] = useState("");
  const [androidCheckoutReady, setAndroidCheckoutReady] = useState(false);
  // Native-store billing must not redirect Android purchases to web Stripe.
  const [nativePlatform] = useState(() => {
    if (typeof window === "undefined") return "web";
    return Capacitor.getPlatform();
  });
  const isNativeIosApp = nativePlatform === "ios";
  const isNativeAndroidApp = nativePlatform === "android";
  const successMessage = getCheckoutSuccessMessage(searchParams);

  useEffect(() => {
    if (!isNativeAndroidApp) return;
    let active = true;
    fetch("/api/google-play/verify", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((settings) => {
        if (active && settings?.checkoutEnabled === true &&
            settings?.enabled === true && isVirtusPlayNativeAvailable()) {
          setAndroidCheckoutReady(true);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isNativeAndroidApp]);

  useEffect(() => {
    if (!androidCheckoutReady || !userId) return;
    let disposed = false;
    let subscription;
    observeVirtusPlayPurchases(async (event) => {
      if (disposed) return;
      for (const purchase of (event?.purchases || [])) {
        if (purchase.purchaseState !== 1 || !purchase.purchaseToken) continue;
        const productId = purchase.products?.find((id) =>
          ["virtus_life_coach", "virtus_trainer", "virtus_mentor"].includes(id));
        if (!productId) continue;
        try {
          const response = await fetch("/api/google-play/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, purchaseToken: purchase.purchaseToken }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result?.error || "Could not verify Google Play purchase.");
          if (!disposed) {
            setError(result.membershipActivated
              ? ""
              : "Google Play purchase verified. Membership activation is being confirmed.");
            router.refresh();
          }
        } catch (error) {
          if (!disposed) setError(error.message || "Please restore your Google Play purchase.");
        } finally {
          if (!disposed) setLoadingPlan(null);
        }
      }
    }).then((handle) => { subscription = handle; if (disposed) handle?.remove?.(); })
      .catch(() => { if (!disposed) setError("The Google Play billing service is unavailable."); });
    return () => { disposed = true; subscription?.remove?.(); };
  }, [androidCheckoutReady, userId, router]);

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

  const canChooseFree = currentPlan === "free" || currentPlan === "life_coach";
  const canChoosePlus = ["free", "life_coach", "plus"].includes(currentPlan);
  const canChoosePremium =
    ["free", "life_coach", "plus", "premium"].includes(currentPlan);

  async function handlePlanChange(plan) {
    if (isNativeAndroidApp) {
      if (!isAuthenticated || !userId) { router.push("/login"); return; }
      if (plan === currentPlan) { setError("This is already your current plan."); return; }
      if (!androidCheckoutReady) {
        setError("Google Play purchases are not available in this Android build yet. No payment was taken.");
        return;
      }
      if (billingCycle !== "monthly") {
        setError("Only monthly Google Play subscriptions are currently supported.");
        return;
      }
      setLoadingPlan(plan); setError("");
      try {
        await beginVirtusPlayPurchase(plan, userId);
      } catch (err) {
        setError(err?.message || "Unable to open Google Play checkout.");
        setLoadingPlan(null);
      }
      return;
    }
    if (!isAuthenticated) { router.push("/login"); return; }
    if (plan === currentPlan) { setError("This is already your current plan."); return; }
    if (isNativeIosApp) { setError("Subscriptions are not available in this iOS app."); return; }
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
            {isNativeAndroidApp
              ? (androidCheckoutReady ? "Payments are processed securely by Google Play." : "Google Play subscriptions are being configured. Purchasing a plan is not available in this Android build. Existing membership access is unchanged.")
              : isNativeIosApp
                ? "Subscriptions are not available for purchase in this iOS app. Existing membership access is unchanged."
                : "Secure Stripe checkout. Existing subscriptions keep their current billing until you choose to change plans."}
          </p>
        </div>

        {!isNativeAndroidApp ? <div className="inline-flex w-full rounded-full border border-[#d4b57d]/40 bg-[#051e1b] p-1 sm:w-auto">
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
        </div> : null}
      </div>

      <div className="virtus-interior-plan-grid grid items-stretch gap-6">
        {isGuestSelection || ["free","life_coach","plus","premium"].includes(currentPlan) ? (
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
                Understand your thinking through guided reflection, emotional awareness,
                and a personal development plan that keeps your goals visible.
              </p>

              <ul className={featureListClass}>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Guided conversations and saved reflections.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Up to 3 active development goals and 7-day pathways.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>40 daily messages and up to 3 project spaces.</span>
                </li>
              </ul>

              <p className={noteClass}>
                Best for: self-awareness, emotional discipline, and conscious daily responses.
              </p>
            </div>

            {isNativeAndroidApp ? (androidCheckoutReady && isAuthenticated && currentPlan !== "life_coach" ? (
              <button
                type="button"
                className={activeButtonClass}
                disabled={loadingPlan !== null}
                onClick={() => handlePlanChange("life_coach")}
              >
                {loadingPlan === "life_coach" ? "Opening Google Play…" : "Choose Life Coach"}
              </button>
            ) : null) : isGuestSelection ? (
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
                disabled={currentPlan === "life_coach" || loadingPlan !== null}
                onClick={() => handlePlanChange("life_coach")}
                className={currentPlan === "life_coach" ? currentButtonClass : activeButtonClass}
              >
                {currentPlan === "life_coach" ? "Current plan" : loadingPlan === "life_coach" ? "Opening checkout…" : "Choose Life Coach"}
              </button>
            ) : null}
          </section>
        ) : null}

        {isGuestSelection || ["free","life_coach","plus","premium"].includes(currentPlan) ? (
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
                Develop new capabilities through guided practice, role-play,
                structured training, and consistent follow-through.
              </p>

              <ul className={featureListClass}>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Cross-conversation memory and guided skills rehearsal.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Up to 10 active development goals; 7- and 30-day pathways.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>120 daily messages and up to 5 project spaces.</span>
                </li>
              </ul>

              <p className={noteClass}>
                Best for: disciplined practice, communication training, and behavioral skill development.
              </p>
            </div>

            {isNativeAndroidApp ? (androidCheckoutReady && isAuthenticated && currentPlan !== "plus" ? (
              <button
                type="button"
                className={activeButtonClass}
                disabled={loadingPlan !== null}
                onClick={() => handlePlanChange("plus")}
              >
                {loadingPlan === "plus" ? "Opening Google Play…" : "Choose Trainer"}
              </button>
            ) : null) : isGuestSelection ? (
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
        ["free","life_coach","plus","premium"].includes(currentPlan) ? (
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
                Long-term mentorship for judgment, leadership, complex decisions,
                and evidence-informed personal growth.
              </p>

              <ul className={featureListClass}>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Strategic mentoring, decision reviews and leadership simulations.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Up to 30 active development goals; 7/30/60/90-day pathways.</span>
                </li>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Extended project continuity and advanced coaching memory.</span>
                </li>
              </ul>

              <p className={noteClass}>
                Best for: leaders, founders, high-stakes judgment, and sustained development.
              </p>
            </div>

            {isNativeAndroidApp ? (androidCheckoutReady && isAuthenticated && currentPlan !== "premium" ? (
              <button
                type="button"
                className={primaryButtonClass}
                disabled={loadingPlan !== null}
                onClick={() => handlePlanChange("premium")}
              >
                {loadingPlan === "premium" ? "Opening Google Play…" : "Choose Mentor"}
              </button>
            ) : null) : isGuestSelection ? (
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
