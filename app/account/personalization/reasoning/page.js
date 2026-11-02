import VirtusInteriorHeader from "../../../components/VirtusInteriorHeader";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import ReasoningPreferencesForm from "./ReasoningPreferencesForm";
import AppearanceSync from "../../AppearanceSync";

export default async function ReasoningPreferencesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let preferences = null;

  if (user) {
    const { data } = await supabase
      .from("user_reasoning_preferences")
      .select(
        "prefers_explicit_uncertainty, ask_before_psychological_inference, ask_before_spiritual_inference, allow_pattern_challenge_without_confirmation, preferred_directness, domains_requiring_extra_caution"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    preferences = data || null;
  }

  return (
    <main className="virtus-interior min-h-screen virtus-theme-page">
      <AppearanceSync />

      <div className="virtus-interior-shell narrow virtus-interior-subpage">
        <VirtusInteriorHeader title="Reasoning Discipline" description="Define how Virtus approaches uncertainty, psychological interpretations, and careful questioning." backHref="/account/personalization" backLabel="All personalization settings" />

        <div className="virtus-theme-surface virtus-interior-panel rounded-3xl border border-sky-900/20 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
          <ReasoningPreferencesForm
            initialPrefersExplicitUncertainty={
              preferences?.prefers_explicit_uncertainty ?? true
            }
            initialAskBeforePsychologicalInference={
              preferences?.ask_before_psychological_inference ?? true
            }
            initialAskBeforeSpiritualInference={
              preferences?.ask_before_spiritual_inference ?? true
            }
            initialAllowPatternChallengeWithoutConfirmation={
              preferences?.allow_pattern_challenge_without_confirmation ?? true
            }
            initialPreferredDirectness={
              preferences?.preferred_directness || "direct"
            }
            initialDomainsRequiringExtraCaution={
              preferences?.domains_requiring_extra_caution || [
                "psychology",
                "spirituality",
              ]
            }
          />
        </div>

        <div className="mt-8">
          <Link
            href="/account/personalization"
            className="virtus-interior-back"
          >
            Back to personalization
          </Link>
        </div>
      </div>
    </main>
  );
}