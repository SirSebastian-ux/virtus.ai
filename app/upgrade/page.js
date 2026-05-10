import { createClient } from "@/lib/supabase-server";
import { getPlanKey, getPlanLabel } from "@/data/virtus-plan-policy";
import UpgradeCardsClient from "./UpgradeCardsClient";

export default async function UpgradePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan = "trial_guest";

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
        <div className="virtus-theme-surface mb-10 rounded-3xl border border-sky-900/20 px-6 py-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-300/50">
            Virtus AI
          </p>

          <h1 className="mt-3 text-3xl font-semibold virtus-theme-title">
            Choose your Virtus plan
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 virtus-theme-muted">
            Choose the level of Virtus support and continuity that matches your
            current stage. Billing is active and plan upgrades now work through
            the real payment flow.
          </p>

          <div className="mt-5 inline-flex rounded-full border border-sky-900/30 bg-sky-950/20 px-4 py-2 text-sm text-sky-200">
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