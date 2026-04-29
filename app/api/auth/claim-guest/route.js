import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { getPlanPolicy } from "@/data/virtus-plan-policy";

export async function POST(req) {
  try {
    const authSupabase = await createClient();
    const supabase = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user?.id) {
      return Response.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const guestId = String(body?.guestId || "").trim();

    if (!guestId) {
      return Response.json(
        { error: "Missing guestId." },
        { status: 400 }
      );
    }

    const guestUserId = `guest-${guestId}`;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, plan, plan_status, trial_started_at, trial_ends_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        plan: "free",
        plan_status: "active",
      });
    }

    const { data: guestAccess } = await supabase
      .from("guest_access")
      .select("guest_id, plan, plan_status, trial_started_at, trial_ends_at")
      .eq("guest_id", guestId)
      .maybeSingle();

    const { data: guestConversations } = await supabase
      .from("conversations")
      .select("chat_id, role, content, created_at")
      .eq("user_id", guestUserId)
      .order("created_at", { ascending: true });

    const { data: guestMemories } = await supabase
      .from("memories")
      .select("id")
      .eq("user_id", guestUserId);

    await supabase
      .from("conversations")
      .update({ user_id: user.id })
      .eq("user_id", guestUserId);

    await supabase
      .from("memories")
      .update({ user_id: user.id })
      .eq("user_id", guestUserId);

    const chatTitleMap = new Map();

    for (const item of guestConversations || []) {
      if (!item?.chat_id) continue;
      if (chatTitleMap.has(item.chat_id)) continue;

      const nextTitle =
        item.role === "user"
          ? String(item.content || "").trim().slice(0, 60) || "New chat"
          : "New chat";

      chatTitleMap.set(item.chat_id, nextTitle);
    }

    for (const [chatId, title] of chatTitleMap.entries()) {
      const { data: existingSession } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", chatId)
        .maybeSingle();

      if (!existingSession) {
        await supabase.from("chat_sessions").insert({
          id: chatId,
          user_id: user.id,
          title,
        });
      }
    }

    if (guestAccess?.guest_id) {
      await supabase
        .from("guest_access")
        .delete()
        .eq("guest_id", guestId);
    }

    const { data: finalProfile } = await supabase
      .from("profiles")
      .select("plan, plan_status, trial_started_at, trial_ends_at")
      .eq("id", user.id)
      .maybeSingle();

    const currentPlan = finalProfile?.plan ?? "free";
    const currentPlanStatus = finalProfile?.plan_status ?? "active";
    const planPolicy = getPlanPolicy(currentPlan);

    return Response.json({
      success: true,
      claimed: {
        guestId,
        conversationsMoved: (guestConversations || []).length,
        memoriesMoved: (guestMemories || []).length,
        chatsCreated: chatTitleMap.size,
      },
      access: {
        ...planPolicy,
        plan: currentPlan,
        planStatus: currentPlanStatus,
        trialStartedAt: finalProfile?.trial_started_at ?? null,
        trialEndsAt: finalProfile?.trial_ends_at ?? null,
      },
    });
  } catch (error) {
    console.error("CLAIM GUEST ERROR:", error);

    return Response.json(
      { error: error.message || "Failed to claim guest data." },
      { status: 500 }
    );
  }
}