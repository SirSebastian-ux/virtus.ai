import VirtusInteriorHeader from "../components/VirtusInteriorHeader";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { resolveEffectivePlan } from "@/lib/virtus-effective-plan.mjs";
import { getPlanKey, getPlanLabel } from "@/data/virtus-plan-policy";
import UpgradeCardsClient from "./UpgradeCardsClient";

export default async function UpgradePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan = user?.id ? "free" : "guest";
  let organizationMentorActive = false;

  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const entitlement = await resolveEffectivePlan({
      userId: user.id, userClient: supabase, adminClient: createAdminClient(),
      personalPlan: getPlanKey(profile?.plan ?? "free"),
    });
    currentPlan = entitlement.plan;
    organizationMentorActive = entitlement.organizationMentorActive;
  }

  return (
    <main className="virtus-interior min-h-screen virtus-theme-page">
      <div className="virtus-interior-shell flex min-h-screen flex-col">
        <VirtusInteriorHeader title="Choose your coaching experience" description="Compare your coaching options and manage your membership. Existing subscriptions remain valid while new plans are introduced." eyebrow="Virtus coaching plans" backHref="/account" backLabel="Account settings">
          <div className="inline-flex rounded-full border border-[#eac68a]/60 bg-[#073c32]/80 px-4 py-2 text-sm text-[#f7d494]">Your current plan: {organizationMentorActive ? "Mentor — Provided by your organization" : currentPlan === "premium" ? "Mentor" : currentPlan === "plus" ? "Trainer" : currentPlan === "life_coach" ? "Life Coach" : currentPlan === "guest" ? "Trial Guest" : "Free account"}</div>
        </VirtusInteriorHeader>

        {organizationMentorActive ? (
          <div className="rounded-2xl border border-[#d8bd85]/50 bg-[#073c32] p-5 text-[#f7d494]">
            Your Mentor access is provided by your organization. No personal subscription purchase is required.
          </div>
        ) : <UpgradeCardsClient
          currentPlan={currentPlan}
          isAuthenticated={!!user?.id}
          userId={user?.id || null}
          key={currentPlan}
        />}
      </div>
    </main>
  );
}