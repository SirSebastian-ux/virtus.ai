import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import {
  getDailyMessageLimit,
  getPlanPolicy,
  getProjectScope,
} from "@/data/virtus-plan-policy";

export async function GET() {
  try {
    const authSupabase = await createClient();
    const supabase = createAdminClient();

    const {
      data: { user },
      error,
    } = await authSupabase.auth.getUser();

    if (error || !user) {
      return Response.json({
        isAuthenticated: false,
        user: null,
        access: null,
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_status, trial_started_at, trial_ends_at, nickname")
      .eq("id", user.id)
      .single();

    const currentPlan = profile?.plan ?? "free";
    const currentPlanStatus = profile?.plan_status ?? "active";

    const dailyMessageLimit = getDailyMessageLimit(currentPlan);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const { count: todayUserMessageCount } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user")
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString());

    const dailyMessagesUsed = todayUserMessageCount ?? 0;
    const planPolicy = getPlanPolicy(currentPlan);
    const projectScope = getProjectScope(currentPlan);

    return Response.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        nickname: profile?.nickname ?? null,
      },
      access: {
        ...planPolicy,
        projectScope,
        plan: currentPlan,
        planStatus: currentPlanStatus,
        trialStartedAt: profile?.trial_started_at ?? null,
        trialEndsAt: profile?.trial_ends_at ?? null,
        dailyMessageLimit,
        dailyMessagesUsed,
      },
    });
  } catch (error) {
    return Response.json({
      isAuthenticated: false,
      user: null,
      access: null,
    });
  }
}