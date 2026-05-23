"use client";

import { Capacitor } from "@capacitor/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function UpgradeCardsClient({ currentPlan, isAuthenticated }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("yearly");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isNativeIosApp, setIsNativeIosApp] = useState(false);

  useEffect(() => {
    setIsNativeIosApp(Capacitor.getPlatform() === "ios");

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
    const success = searchParams.get("success");
    const selectedPlan = searchParams.get("plan");
    const selectedBilling = searchParams.get("billing");

    if (success === "true") {
      const planLabel =
        selectedPlan === "plus"
          ? "Plus"
          : selectedPlan === "premium"
          ? "Premium / Virtus Prime"
          : "Plan";

      const billingLabel =
        selectedBilling === "yearly"
          ? "yearly"
          : selectedBilling === "monthly"
          ? "monthly"
          : "";

      setSuccessMessage(
        billingLabel
          ? `${planLabel} ${billingLabel} plan activated successfully.`
          : `${planLabel} activated successfully.`
      );
      router.refresh();

      setTimeout(() => {
        router.push("/");
      }, 1200);
    }
  }, [searchParams, router]);

  useEffect(() => {
    function resetCheckoutLoading() {
      setLoadingPlan(null);
    }

    resetCheckoutLoading();

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
      setLoadingPlan(null);
      setError("");

      if (plan === "plus" || plan === "premium") {
        if (isNativeIosApp) {
          setError("For App Store safety, paid plan changes are managed on the Virtus AI website. Please sign in at virtusaiworld.com in your browser to upgrade or manage billing.");
          setLoadingPlan(null);
          return;
        }
        const checkoutWindow =
          typeof window !== "undefined" ? window.open("about:blank", "_blank") : null;

        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan, billingCycle }),
        });

        const data = await res.json();

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

      const res = await fetch("/api/account/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to change plan.");
        setLoadingPlan(null);
        return;
      }

      router.refresh();
      router.push("/");
    } catch (err) {
      setError("Something went wrong while changing plan.");
      setLoadingPlan(null);
    }
  }

  const cardClass =
    "virtus-theme-card flex h-full flex-col rounded-3xl border border-sky-900/20 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/45 hover:bg-sky-950/10";

  const premiumCardClass =
    "virtus-theme-card flex h-full flex-col rounded-3xl border border-sky-700/45 p-6 shadow-sm shadow-sky-950/20 backdrop-blur-sm transition hover:border-sky-500/55 hover:bg-sky-950/10";

  const planLabelClass =
    "text-xs uppercase tracking-[0.18em] text-sky-300/55";

  const titleClass =
    "mt-3 text-xl font-semibold virtus-theme-title";

  const descriptionClass =
    "mt-3 text-sm leading-6 virtus-theme-muted";

  const featureListClass =
    "mt-5 space-y-3 text-sm leading-6 virtus-theme-title";

  const featureDotClass =
    "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/80";

  const activeButtonClass =
    "mt-6 rounded-2xl border border-sky-800/40 bg-sky-950/35 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:border-sky-600/60 hover:bg-sky-900/45 disabled:opacity-50";

  const primaryButtonClass =
    "mt-6 rounded-2xl border border-sky-500/50 bg-sky-500/15 px-4 py-2.5 text-sm font-semibold text-sky-50 shadow-sm shadow-sky-950/20 transition hover:border-sky-400/70 hover:bg-sky-500/25 disabled:opacity-50";

  const currentButtonClass =
    "mt-6 rounded-2xl border border-sky-900/20 bg-sky-950/10 px-4 py-2.5 text-sm text-sky-700/70";

  const noteClass =
    "virtus-theme-card-soft mt-4 rounded-2xl border border-sky-900/20 px-4 py-3 text-sm leading-6 virtus-theme-muted";

  const toggleButtonClass = (value) =>
    billingCycle === value
      ? "rounded-full border border-sky-500/50 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-50 shadow-sm shadow-sky-950/20"
      : "rounded-full border border-transparent px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-sky-950/25 hover:text-sky-100";

  return (
    <div className="space-y-6">
      <div className="virtus-theme-card flex flex-col gap-3 rounded-3xl border border-sky-900/20 p-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-sky-300/55">
            Billing
          </p>
          <p className="mt-1 text-sm virtus-theme-muted">
            Choose monthly flexibility or yearly savings before upgrading.
          </p>
          <p className="virtus-theme-card-soft mt-3 max-w-2xl rounded-2xl border border-sky-900/25 px-4 py-3 text-sm leading-6 virtus-theme-muted">
            Checkout opens in a new tab. Complete your payment there. After payment,
            Virtus will activate your plan automatically.
          </p>
        </div>

        <div className="inline-flex w-full rounded-full border border-sky-900/25 bg-sky-950/10 p-1 sm:w-auto">
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

      <div className="grid gap-6 md:grid-cols-3">
        {isGuestSelection || currentPlan === "free" ? (
          <section className={cardClass}>
            <div className="flex-1">
              <p className={planLabelClass}>Free</p>

              <h2 className={titleClass}>Start with clarity</h2>

              <div className="virtus-theme-card-soft mt-4 rounded-2xl border border-sky-900/25 px-4 py-3">
                <p className="text-2xl font-semibold virtus-theme-title">
                  $0{" "}
                  <span className="text-sm font-normal virtus-theme-muted">
                    / free account
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-sky-300/70">
                  No payment required
                </p>
              </div>

              <p className={descriptionClass}>
                A registered entry plan for people who want simple support, saved
                chats, and a light Virtus discipline layer.
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
              <p className={planLabelClass}>Plus</p>

              <h2 className={titleClass}>Guided coaching layer</h2>

              <div className="virtus-theme-card-soft mt-4 rounded-2xl border border-sky-900/25 px-4 py-3">
                <p className="text-2xl font-semibold virtus-theme-title">
                  {isYearly ? "$15.99" : "$19"}{" "}
                  <span className="text-sm font-normal virtus-theme-muted">
                    / month
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-sky-300/70">
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
                Create Account for Plus
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
                  ? "Upgrade to Plus Yearly"
                  : "Upgrade to Plus Monthly"}
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
                <p className={planLabelClass}>Premium / Virtus Prime</p>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-sky-200">
                  Highest
                </span>
              </div>

              <h2 className={titleClass}>Strategic executive layer</h2>

              <div className="virtus-theme-card-soft mt-4 rounded-2xl border border-sky-500/30 px-4 py-3 shadow-sm shadow-sky-950/20">
                <p className="text-2xl font-semibold virtus-theme-title">
                  {isYearly ? "$44.99" : "$49"}{" "}
                  <span className="text-sm font-normal virtus-theme-muted">
                    / month
                  </span>
                </p>
                <p className="mt-1 text-xs leading-5 text-sky-300/80">
                  {isYearly
                    ? "Billed yearly at $539.88"
                    : "Yearly option: $44.99 / month when billed yearly"}
                </p>
              </div>

              <p className={descriptionClass}>
                The deepest Virtus experience for strategic thinking, project
                continuity, leadership, and advanced personal discipline.
              </p>

              <ul className={featureListClass}>
                <li className="flex gap-3">
                  <span className={featureDotClass} />
                  <span>Deepest personalization and premium-like reasoning.</span>
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
                className={primaryButtonClass}
              >
                Create Account for Premium
              </button>
            ) : canChoosePremium ? (
              <button
                type="button"
                disabled={currentPlan === "premium"}
                onClick={() => handlePlanChange("premium")}
                className={
                  currentPlan === "premium" ? currentButtonClass : primaryButtonClass
                }
              >
                {currentPlan === "premium"
                  ? "Current plan"
                  : isYearly
                  ? "Upgrade to Premium Yearly"
                  : "Upgrade to Premium Monthly"}
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

