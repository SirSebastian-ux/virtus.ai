import { createClient } from "@/lib/supabase-server";
import { getPlanKey, getPlanLabel } from "@/data/virtus-plan-policy";
import UpgradeCardsClient from "./UpgradeCardsClient";

export default async function UpgradePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan = user?.id ? "free" : "guest";

  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    currentPlan = getPlanKey(profile?.plan ?? "free");
  }

  return (
    <main className="min-h-screen virtus-theme-page">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-12">
        <div className="virtus-theme-surface mb-10 rounded-3xl border border-[#42615a]/40 px-6 py-6 shadow-sm shadow-black/20 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-[#d8bd85]">
            Virtus AI
          </p>

          <h1 className="mt-3 text-3xl font-semibold virtus-theme-title">
            Choose your coaching experience
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 virtus-theme-muted">
            Life Coach, Trainer, and Mentor are the upcoming cumulative coaching plans.
            Existing subscriptions remain unchanged while the new billing tiers are prepared.
          </p>

          <div className="mt-5 inline-flex rounded-full border border-[#42615a] bg-[#173632] px-4 py-2 text-sm text-[#e4d0a5]">
            Current plan: {getPlanLabel(currentPlan)}
          </div>

          <p className="mt-3 text-sm virtus-theme-muted">
            Your selected plan will activate based on your account billing state.
          </p>
        </div>

        <UpgradeCardsClient
          currentPlan={currentPlan}
          isAuthenticated={!!user?.id}
          key={currentPlan}
        />
      </div>
    </main>
  );
}