"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function UpgradeCardsClient({ currentPlan, isAuthenticated }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const selectedPlan = searchParams.get("plan");

    if (success === "true") {
      const planLabel =
        selectedPlan === "plus"
          ? "Plus"
          : selectedPlan === "premium"
          ? "Premium / Virtus Prime"
          : "Plan";

      setSuccessMessage(`${planLabel} activated successfully.`);
      router.refresh();

      setTimeout(() => {
        router.push("/");
      }, 1200);
    }
  }, [searchParams, router]);


  const isGuestSelection = !isAuthenticated;

  const canChooseFree = currentPlan === "free";
  const canChoosePlus = currentPlan === "free" || currentPlan === "plus";
  const canChoosePremium =
    currentPlan === "free" || currentPlan === "plus" || currentPlan === "premium";

  async function handlePlanChange(plan) {
    try {
      setLoadingPlan(plan);
      setError("");

      if (plan === "plus" || plan === "premium") {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan }),
        });

        const data = await res.json();

        if (!res.ok || !data.url) {
          setError(data.error || "Failed to start checkout.");
          setLoadingPlan(null);
          return;
        }

        window.location.href = data.url;
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
    "rounded-3xl border border-sky-900/20 bg-zinc-950/35 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-zinc-950/50";

  const planLabelClass =
    "text-xs uppercase tracking-[0.18em] text-sky-300/50";

  const titleClass =
    "mt-3 text-xl font-semibold text-sky-100";

  const descriptionClass =
    "mt-3 text-sm leading-6 text-zinc-400";

  const activeButtonClass =
    "mt-6 rounded-2xl border border-sky-900/30 bg-sky-950/25 px-4 py-2 text-sm text-sky-100 transition hover:border-sky-800/40 hover:bg-sky-900/35 disabled:opacity-50";

  const currentButtonClass =
    "mt-6 rounded-2xl border border-sky-900/20 bg-black/25 px-4 py-2 text-sm text-sky-300/50";

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {isGuestSelection || currentPlan === "free" ? (
        <section className={cardClass}>
          <p className={planLabelClass}>Free</p>

          <h2 className={titleClass}>Enter Virtus</h2>

          <p className={descriptionClass}>
            Registered entry plan with saved chats, standard usage, and basic
            continuity.
          </p>

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
          <p className={planLabelClass}>Plus</p>

          <h2 className={titleClass}>Life-coach layer</h2>

          <p className={descriptionClass}>
            Stronger personal continuity, coaching support, and deeper guidance
            across chats.
          </p>

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
              disabled={currentPlan === "plus" || loadingPlan !== null}
              onClick={() => handlePlanChange("plus")}
              className={
                currentPlan === "plus" ? currentButtonClass : activeButtonClass
              }
            >
              {currentPlan === "plus"
                ? "Current plan"
                : loadingPlan === "plus"
                ? "Switching..."
                : "Choose Plus"}
            </button>
          ) : null}
        </section>
      ) : null}

      {isGuestSelection ||
      currentPlan === "free" ||
      currentPlan === "plus" ||
      currentPlan === "premium" ? (
        <section className="rounded-3xl border border-sky-800/35 bg-sky-950/20 p-6 shadow-sm shadow-sky-950/20 backdrop-blur-sm transition hover:border-sky-700/50 hover:bg-sky-950/30">
          <p className={planLabelClass}>Premium / Virtus Prime</p>

          <h2 className={titleClass}>Strategic layer</h2>

          <p className={descriptionClass}>
            Personal continuity, project continuity, and the strongest strategic
            Virtus experience.
          </p>

          {isGuestSelection ? (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className={activeButtonClass}
            >
              Create Account for Premium
            </button>
          ) : canChoosePremium ? (
            <button
              type="button"
              disabled={currentPlan === "premium" || loadingPlan !== null}
              onClick={() => handlePlanChange("premium")}
              className={
                currentPlan === "premium" ? currentButtonClass : activeButtonClass
              }
            >
              {currentPlan === "premium"
                ? "Current plan"
                : loadingPlan === "premium"
                ? "Switching..."
                : "Choose Premium / Virtus Prime"}
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
  );
}