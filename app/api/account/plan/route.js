import { createClient } from "@/lib/supabase-server";
import {
  getPlanKey,
  isFreePlan,
  isPlusPlan,
  isPremiumPlan,
} from "@/data/virtus-plan-policy";

export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        {
          success: false,
          error: "You must be signed in to change plan.",
        },
        { status: 401 }
      );
    }

        const { data: existingProfiles, error: existingProfileError } = await supabase
      .from("profiles")
      .select("id, plan, plan_status")
      .eq("id", user.id);

    if (existingProfileError) {
      return Response.json(
        {
          success: false,
          error: existingProfileError.message,
        },
        { status: 500 }
      );
    }

    if (!Array.isArray(existingProfiles) || existingProfiles.length === 0) {
      return Response.json(
        {
          success: false,
          error: `No profile row exists for signed-in user ${user.id}.`,
        },
        { status: 500 }
      );
    }

    if (existingProfiles.length > 1) {
      return Response.json(
        {
          success: false,
          error: `More than one profile row exists for signed-in user ${user.id}.`,
        },
        { status: 500 }
      );
    }

        const currentProfile = existingProfiles[0];
    const currentPlan = getPlanKey(currentProfile?.plan ?? "free");

    const body = await request.json();
    const requestedPlan = getPlanKey(body?.plan);

    if (
      !isFreePlan(requestedPlan) &&
      !isPlusPlan(requestedPlan) &&
      !isPremiumPlan(requestedPlan)
    ) {
      return Response.json(
        {
          success: false,
          error: "Invalid plan selection.",
        },
        { status: 400 }
      );
    }

    const isAllowedUpgrade =
      (currentPlan === "free" && requestedPlan === "plus") ||
      (currentPlan === "plus" && requestedPlan === "premium") ||
      currentPlan === requestedPlan;

    if (!isAllowedUpgrade) {
      return Response.json(
        {
          success: false,
          error: `Plan change not allowed from ${currentPlan} to ${requestedPlan}.`,
        },
        { status: 400 }
      );
    }

               const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan: requestedPlan,
        plan_status: "active",
      })
      .eq("id", user.id);

    if (updateError) {
      return Response.json(
        {
          success: false,
          error: updateError.message || "Failed to update plan.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      plan: requestedPlan,
      planStatus: "active",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Unexpected plan update error.",
      },
      { status: 500 }
    );
  }
}