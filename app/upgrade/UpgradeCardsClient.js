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
      : "Plan";

  const billingLabel =
    selectedBilling === "yearly"
      ? "yearly"
      : selectedBilling === "monthly"
      ? "monthly"
      : "";

  return billingLabel
    ? `${planLabel} ${billingLabel} plan activated successfully.`
    : `${planLabel} activated successfully.`;
}

export default function UpgradeCardsClient({ currentPlan, isAuthenticated }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("yearly");
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

    const redirectTimer = setTimeout(() => {
      router.push("/");
    }, 1200);

    return () => clearTimeout(redirectTimer);
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
    try {
      setLoadingPlan(plan);
      setError("");

      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      if (plan === currentPlan) {
        setError("This is already your current plan.");
        setLoadingPlan(null);
        return;
      }

      if (isNativeIosApp) {
        setError("For App Store safety, paid plan changes are managed on the Virtus AI website. Please sign in at virtusaiworld.com in your browser to upgrade or manage billing.");
        setLoadingPlan(null);
        return;
      }

      if (plan === "free") {
        const res = await fetch("/api/stripe/portal", {
          method: "POST",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.url) {
          setError(data.error || "Could not open the billing portal.");
          setLoadingPlan(null);
          return;
        }

        window.location.href = data.url;
        return;
      }

      if (plan === "plus" || plan === "premium") {
        const checkoutWindow =
          typeof window !== "undefined" ? window.open("about:blank", "_blank") : null;

        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan, billingCycle }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.url) {
          if (checkoutWindow) {
            checkoutWindow.close();
          }

          setError(data.error || "Failed to start checkout.");
          setLoadingPlan(null);
          return;
        }

        setLoadingPlan(null);

        if (checkoutWindow) {
          checkoutWindow.location.href = data.url;
        } else {
          window.location.href = data.url;
        }

        return;
      }

      setError("Invalid plan selected.");
      setLoadingPlan(null);
    } catch (err) {
      setError("Something went wrong while managing your plan.");
      setLoadingPlan(null);
    }
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
            Choose monthly flexibility or yearly savings before upgrading.
          </p>
          <p className="mt-3 max-w-2xl rounded-xl border border-[#ac956b]/30 bg-[#082a24] px-4 py-3 text-sm leading-6 text-[#c6d8cd]">
            Checkout opens in a new tab. Complete your payment there. After payment,
            Virtus will activate your plan automatically.
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
              <p className={planLabelClass}>Life Coach — Free</p>

              <h2 className={titleClass}>Begin your development</h2>

              <div className="virtus-theme-card-soft mt-4 rounded-2xl border border-[#d8bd85]/35 bg-[#092820]/70 px-4 py-4">
                <p className="virtus-plan-price text-2xl font-semibold virtus-theme-title">
                  $0{" "}
                  <span className="text-sm font-normal virtus-theme-muted">
                    / free account
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-[#eac789]">
                  No payment required
                </p>
              </div>

              <p className={descriptionClass}>
                A free Life Coach experience for people who want guided reflection, saved
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
                Best for: trying Virtus, asking practical questions, and getting
                light support without a paid plan.
              </p>
            </div>

            {isGuestSelection ? (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className={activeButtonClass}
              >
                Create Free Account
              </button>
            ) : canChooseFree ? (
              <button
                type="button"
                disabled={true}
                className={currentButtonClass}
              >
                Current plan
              </button>
            ) : null}
          </section>
        ) : null}

        {isGuestSelection || currentPlan === "free" || currentPlan === "plus" ? (
          <section className={cardClass}>
            <div className="flex-1">
              <p className={planLabelClass}>Trainer</p>

              <h2 className={titleClass}>Guided life coaching and training</h2>

              <div className="virtus-theme-card-soft mt-4 rounded-2xl border border-[#d8bd85]/35 bg-[#092820]/70 px-4 py-4">
                <p className="virtus-plan-price text-2xl font-semibold virtus-theme-title">
                  {isYearly ? "$15.99" : "$19"}{" "}
                  <span className="text-sm font-normal virtus-theme-muted">
                    / month
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-[#eac789]">
                  {isYearly
                    ? "Billed yearly at $191.88"
                    : "Yearly option: $15.99 / month when billed yearly"}
                </p>
              </div>

              <p className={descriptionClass}>
                A stronger personal coaching experience with better continuity,
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
                Best for: personal growth, life coaching, emotional discipline,
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
                disabled={currentPlan === "plus"}
                onClick={() => handlePlanChange("plus")}
                className={
                  currentPlan === "plus" ? currentButtonClass : activeButtonClass
                }
              >
                {currentPlan === "plus"
                  ? "Current plan"
                  : isYearly
                  ? "Choose Trainer · Yearly"
                  : "Choose Trainer · Monthly"}
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
                  {isYearly ? "$44.99" : "$49"}{" "}
                  <span className="text-sm font-normal virtus-theme-muted">
                    / month
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-[#eac789]">
                  {isYearly
                    ? "Billed yearly at $539.88"
                    : "Yearly option: $44.99 / month when billed yearly"}
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
                disabled={currentPlan === "premium"}
                onClick={() => handlePlanChange("premium")}
                className={
                  currentPlan === "premium" ? currentButtonClass : "virtus-gold-button " + primaryButtonClass
                }
              >
                {currentPlan === "premium"
                  ? "Current plan"
                  : isYearly
                  ? "Choose Mentor · Yearly"
                  : "Choose Mentor · Monthly"}
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
