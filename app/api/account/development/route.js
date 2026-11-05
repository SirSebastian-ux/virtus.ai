import { createClient } from "@/lib/supabase-server";
import {
  validateDevelopmentGoal,
  validateDevelopmentCheckin,
  validateDevelopmentStatus,
} from "@/lib/virtus-development.mjs";

function respond(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

async function authorize() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  return { db, user: error ? null : user };
}

export async function GET() {
  const { db, user } = await authorize();
  if (!user) return respond({ error: "Sign in to view your development." }, 401);
  const [goalsResult, checkinsResult] = await Promise.all([
    db.from("virtus_development_goals")
      .select("id,title,focus_domain,observed_behavior,desired_behavior,baseline_rating,status,created_at,updated_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    db.from("virtus_development_checkins")
      .select("id,goal_id,rating,evidence,next_action,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(300),
  ]);
  if (goalsResult.error || checkinsResult.error) {
    return respond({ error: "Development records unavailable." }, 503);
  }
  const allowed = new Set((goalsResult.data || []).map((goal) => goal.id));
  return respond({
    goals: goalsResult.data || [],
    checkins: (checkinsResult.data || []).filter((item) => allowed.has(item.goal_id)),
    note: "Self-reported reflections and practice, not a psychological or clinical assessment.",
  });
}

export async function POST(request) {
  const { db, user } = await authorize();
  if (!user) return respond({ error: "Sign in to record development." }, 401);
  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return respond({ error: "Invalid request." }, 400);
  if (raw.type === "goal") {
    const result = validateDevelopmentGoal(raw);
    if (result.error) return respond({ error: result.error }, 400);
    const { count, error: countError } = await db.from("virtus_development_goals")
      .select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (countError) return respond({ error: "Could not verify goal limit." }, 503);
    if ((count ?? 0) >= 30) return respond({ error: "Maximum of 30 goals. Complete or review existing goals." }, 409);
    const { data, error } = await db.from("virtus_development_goals")
      .insert({ ...result.value, user_id: user.id }).select("id").single();
    if (error) return respond({ error: "Could not save your goal." }, 500);
    return respond({ id: data.id, created: true }, 201);
  }
  if (raw.type === "checkin") {
    const result = validateDevelopmentCheckin(raw);
    if (result.error) return respond({ error: result.error }, 400);
    const { data: goal, error: goalError } = await db.from("virtus_development_goals")
      .select("id,status").eq("user_id", user.id).eq("id", result.value.goal_id).maybeSingle();
    if (goalError || !goal) return respond({ error: "Goal not found." }, 404);
    if (goal.status !== "active") return respond({ error: "Resume the goal before recording a check-in." }, 409);
    const { data: latest } = await db.from("virtus_development_checkins")
      .select("created_at").eq("user_id", user.id).eq("goal_id", goal.id)
      .order("created_at", { ascending: false }).limit(1);
    if (latest?.[0] && Date.now() - Date.parse(latest[0].created_at) < 60_000) {
      return respond({ error: "Please wait before submitting another check-in." }, 429);
    }
    const { error } = await db.from("virtus_development_checkins")
      .insert({ ...result.value, user_id: user.id });
    if (error) return respond({ error: "Could not save your check-in." }, 500);
    return respond({ created: true }, 201);
  }
  if (raw.type === "status") {
    const result = validateDevelopmentStatus(raw);
    if (result.error) return respond({ error: result.error }, 400);
    const { data, error } = await db.from("virtus_development_goals")
      .update({ status: result.value.status, updated_at: new Date().toISOString() })
      .eq("id", result.value.goal_id).eq("user_id", user.id)
      .select("id").maybeSingle();
    if (error) return respond({ error: "Could not update your goal." }, 500);
    if (!data) return respond({ error: "Goal not found." }, 404);
    return respond({ updated: true });
  }
  return respond({ error: "Unknown development action." }, 400);
}
