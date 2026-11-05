import { createClient } from "@/lib/supabase-server";
import { membershipCapabilities, canCreateGoal, canChooseProgram, canResumeGoal } from "@/lib/virtus-membership.mjs";
import { validateDevelopmentGoal, validateDevelopmentCheckin, validateDevelopmentStatus } from "@/lib/virtus-development.mjs";

function respond(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}
async function authorize() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user?.id) return { db, user: null, plan: "free" };
  // Only the server-side profile determines entitlements, never request JSON.
  const { data: profile, error: profileError } = await db.from("profiles")
    .select("plan").eq("id", user.id).maybeSingle();
  if (profileError) return { db, user, plan: "free", profileError: true };
  return { db, user, plan: profile?.plan || "free" };
}
async function goalsForUser(db, userId) {
  return db.from("virtus_development_goals")
    .select("id,title,focus_domain,observed_behavior,desired_behavior,baseline_rating,program_days,status,created_at,updated_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
}
async function recentCheckinsForUser(db, userId) {
  const rows = [];
  // Supabase/PostgREST often caps each response to 1,000 rows.
  for (let offset = 0; offset < 5000; offset += 1000) {
    const { data, error } = await db.from("virtus_development_checkins")
      .select("id,goal_id,rating,evidence,next_action,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false })
      .range(offset, offset + 999);
    if (error) return { error };
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return { data: rows };
}
export async function GET() {
  const { db, user, plan, profileError } = await authorize();
  if (!user) return respond({ error: "Sign in to view your development." }, 401);
  if (profileError) return respond({ error: "Could not verify account access." }, 503);
  const [goalsResult, checkinsResult] = await Promise.all([
    goalsForUser(db, user.id),
    recentCheckinsForUser(db, user.id),
  ]);
  if (goalsResult.error || checkinsResult.error) return respond({ error: "Development records unavailable." }, 503);
  const goals = goalsResult.data || [];
  const allowed = new Set(goals.map((goal) => goal.id));
  return respond({
    membership: membershipCapabilities(plan),
    serverTime: new Date().toISOString(),
    goals,
    checkins: (checkinsResult.data || []).filter((item) => allowed.has(item.goal_id)),
    note: "Development ratings and reflections are client-authored self-reports, not diagnoses or validated clinical outcomes.",
  });
}
export async function POST(request) {
  const { db, user, plan, profileError } = await authorize();
  if (!user) return respond({ error: "Sign in to record development." }, 401);
  if (profileError) return respond({ error: "Could not verify account access." }, 503);
  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return respond({ error: "Invalid request." }, 400);
  const capabilities = membershipCapabilities(plan);
  if (raw.type === "goal") {
    const result = validateDevelopmentGoal(raw);
    if (result.error) return respond({ error: result.error }, 400);
    const program_days = raw.program_days == null ? 7 : Number(raw.program_days);
    if (!canChooseProgram(plan, program_days)) {
      return respond({ error: "Your current membership does not include this development pathway.", upgradeUrl: "/upgrade" }, 403);
    }
    const { data: goals, error: listError } = await db.from("virtus_development_goals")
      .select("id,status").eq("user_id", user.id).limit(101);
    if (listError) return respond({ error: "Could not verify goal limit." }, 503);
    if ((goals || []).length >= 100) return respond({ error: "Your 100 saved goals limit has been reached. Contact support to review the archive." }, 409);
    if (!canCreateGoal(plan, goals)) {
      return respond({ error: `Your ${capabilities.publicName} membership allows ${capabilities.maxActiveGoals} active goals. Complete or pause an existing goal, or upgrade.`, upgradeUrl: "/upgrade" }, 403);
    }
    const { data, error } = await db.from("virtus_development_goals")
      .insert({ ...result.value, program_days, user_id: user.id }).select("id").single();
    if (error) return respond({ error: "Could not save your goal." }, 500);
    return respond({ id: data.id, created: true }, 201);
  }
  if (raw.type === "checkin") {
    const result = validateDevelopmentCheckin(raw);
    if (result.error) return respond({ error: result.error }, 400);
    const { data: goal, error: goalError } = await db.from("virtus_development_goals")
      .select("id,status,program_days").eq("user_id", user.id).eq("id", result.value.goal_id).maybeSingle();
    if (goalError || !goal) return respond({ error: "Goal not found." }, 404);
    if (!canChooseProgram(plan, goal.program_days)) {
      return respond({ error: "Your current membership no longer includes this programme. Your previous records are preserved.", upgradeUrl: "/upgrade" }, 403);
    }
    if (goal.status !== "active") return respond({ error: "Resume the goal before recording a check-in." }, 409);
    const { count, error: countError } = await db.from("virtus_development_checkins")
      .select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("goal_id", goal.id);
    if (countError) return respond({ error: "Could not verify practice progress." }, 503);
    if ((count || 0) >= Number(goal.program_days)) {
      return respond({ error: "You have completed all programme days. Review your progress and mark your goal complete." }, 409);
    }
    const { data: latest, error: latestError } = await db.from("virtus_development_checkins")
      .select("created_at").eq("user_id", user.id).eq("goal_id", goal.id)
      .order("created_at", { ascending: false }).limit(1);
    if (latestError) return respond({ error: "Could not verify last check-in." }, 503);
    // At most one programme step in a 16-hour window; a 'day' is not a quick repeat click.
    if (latest?.[0] && Date.now() - Date.parse(latest[0].created_at) < 16 * 60 * 60 * 1000) {
      return respond({ error: "You've already practiced this step. Return for your next daily check-in after the reflection period." }, 429);
    }
    const { error } = await db.from("virtus_development_checkins")
      .insert({ ...result.value, user_id: user.id });
    if (error) return respond({ error: "Could not save your check-in." }, 500);
    return respond({ created: true }, 201);
  }
  if (raw.type === "status") {
    const result = validateDevelopmentStatus(raw);
    if (result.error) return respond({ error: result.error }, 400);
    const { data: goals, error: listError } = await db.from("virtus_development_goals")
      .select("id,status,program_days").eq("user_id", user.id).limit(100);
    if (listError) return respond({ error: "Could not verify goal status." }, 503);
    const target = (goals || []).find((item) => item.id === result.value.goal_id);
    if (!target) return respond({ error: "Goal not found." }, 404);
    if (result.value.status === "active" && !canResumeGoal(plan, goals, target.id)) {
      return respond({ error: `Your ${capabilities.publicName} membership is at its active goal limit.`, upgradeUrl: "/upgrade" }, 403);
    }
    if (result.value.status === "active" && !canChooseProgram(plan, target.program_days)) {
      return respond({ error: "This programme requires a higher membership. Your records remain available.", upgradeUrl: "/upgrade" }, 403);
    }
    const { data, error } = await db.from("virtus_development_goals")
      .update({ status: result.value.status, updated_at: new Date().toISOString() })
      .eq("id", target.id).eq("user_id", user.id).select("id").maybeSingle();
    if (error) return respond({ error: "Could not update your goal." }, 500);
    if (!data) return respond({ error: "Goal not found." }, 404);
    return respond({ updated: true });
  }
  return respond({ error: "Unknown development action." }, 400);
}
