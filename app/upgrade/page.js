import VirtusInteriorHeader from "../components/VirtusInteriorHeader";
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
    <main className="virtus-interior min-h-screen virtus-theme-page">
      <div className="virtus-interior-shell flex min-h-screen flex-col">
        <VirtusInteriorHeader title="Choose your coaching experience" description="Compare your coaching options and manage your membership. Existing subscriptions remain valid while new plans are introduced." eyebrow="Virtus coaching plans" backHref="/account" backLabel="Account settings">
          <div className="inline-flex rounded-full border border-[#eac68a]/60 bg-[#073c32]/80 px-4 py-2 text-sm text-[#f7d494]">Your current plan: {getPlanLabel(currentPlan)}</div>
        </VirtusInteriorHeader>

        <UpgradeCardsClient
          currentPlan={currentPlan}
          isAuthenticated={!!user?.id}
          key={currentPlan}
        />
      </div>
    </main>
  );
}