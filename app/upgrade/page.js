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
    <main className="min-h-screen virtus-theme-page bg-[#091b1c] text-[#f5f3ec]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-12">
        <div className="virtus-theme-surface mb-10 rounded-[2rem] border border-[#d8bd85]/25 bg-gradient-to-br from-[#173632] to-[#0b2422] px-7 py-8 shadow-xl shadow-black/20 backdrop-blur-sm">
          <div className="mb-5 flex items-center gap-3"><img src="/virtus-approved-shield.jpg" width="54" height="60" alt="Virtus AI shield" className="h-[60px] w-auto" /><div><p className="font-serif text-2xl text-[#e8c985]">Virtus <span className="text-[#8ad5e6]">AI</span></p><p className="text-[10px] uppercase tracking-[0.18em] text-[#d8bd85]">By Enhanced Wellness Solutions</p></div></div>

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