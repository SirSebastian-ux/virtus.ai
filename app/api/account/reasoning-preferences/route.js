import { createClient } from "@/lib/supabase-server";

export async function POST(req) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return Response.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      prefersExplicitUncertainty,
      askBeforePsychologicalInference,
      askBeforeSpiritualInference,
      allowPatternChallengeWithoutConfirmation,
      preferredDirectness,
      domainsRequiringExtraCaution,
    } = body;

    const { error } = await supabase
      .from("user_reasoning_preferences")
      .upsert(
        {
          user_id: user.id,
          prefers_explicit_uncertainty:
            prefersExplicitUncertainty !== false,
          ask_before_psychological_inference:
            askBeforePsychologicalInference !== false,
          ask_before_spiritual_inference:
            askBeforeSpiritualInference !== false,
          allow_pattern_challenge_without_confirmation:
            allowPatternChallengeWithoutConfirmation !== false,
          preferred_directness: preferredDirectness || "direct",
          domains_requiring_extra_caution: Array.isArray(
            domainsRequiringExtraCaution
          )
            ? domainsRequiringExtraCaution
            : ["psychology", "spirituality"],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}