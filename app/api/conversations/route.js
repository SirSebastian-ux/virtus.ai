import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import crypto from "crypto";
import {
  getDailyMessageLimit,
  getSingleChatMemoryLimit,
  getDefaultPlanStatusForPlan,
  isTrialGuestPlan,
  DEFAULT_VIRTUS_PLAN,
  DEFAULT_VIRTUS_PLAN_STATUS,
} from "@/data/virtus-plan-policy";

async function resolveVirtusUserId(guestId) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user?.id) {
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("plan, plan_status, trial_started_at, trial_ends_at")
    .eq("id", user.id)
    .single();

  const currentPlan = profile?.plan ?? DEFAULT_VIRTUS_PLAN;
  const currentPlanStatus =
    profile?.plan_status ?? DEFAULT_VIRTUS_PLAN_STATUS;

  return {
    userId: user.id,
    isGuest: false,
    plan: currentPlan,
    planStatus: currentPlanStatus,
    trialStartedAt: profile?.trial_started_at ?? null,
    trialEndsAt: profile?.trial_ends_at ?? null,
  };
}

  const normalizedGuestId = guestId || crypto.randomUUID();

  let { data: guestRow } = await adminSupabase
    .from("guest_access")
  .select("guest_id, plan, plan_status, trial_started_at, trial_ends_at")
  .eq("guest_id", normalizedGuestId)
  .maybeSingle();
  if (!guestRow) {
  const trialStartedAt = new Date();
  const trialEndsAt = new Date(
    trialStartedAt.getTime() + 3 * 24 * 60 * 60 * 1000
  );

  const insertPayload = {
  guest_id: normalizedGuestId,
  plan: "trial_guest",
  plan_status: getDefaultPlanStatusForPlan("trial_guest"),
  trial_started_at: trialStartedAt.toISOString(),
  trial_ends_at: trialEndsAt.toISOString(),
};

  await adminSupabase.from("guest_access").insert(insertPayload);
  guestRow = insertPayload;
}

const now = Date.now();
const guestTrialEndsAt = guestRow?.trial_ends_at
  ? new Date(guestRow.trial_ends_at).getTime()
  : null;

if (
  isTrialGuestPlan(guestRow?.plan) &&
  guestTrialEndsAt &&
  guestTrialEndsAt <= now
) {
  const expiredTrialGuestRow = {
    plan: "trial_guest",
    plan_status: "expired",
  };

  await adminSupabase
    .from("guest_access")
    .update(expiredTrialGuestRow)
    .eq("guest_id", normalizedGuestId);

  guestRow = {
    ...guestRow,
    ...expiredTrialGuestRow,
  };
} else if (
  isTrialGuestPlan(guestRow?.plan) &&
  guestRow?.plan_status !== getDefaultPlanStatusForPlan("trial_guest")
) {
  const normalizedTrialStatus = getDefaultPlanStatusForPlan("trial_guest");

  await adminSupabase
    .from("guest_access")
    .update({ plan_status: normalizedTrialStatus })
    .eq("guest_id", normalizedGuestId);

  guestRow = {
    ...guestRow,
    plan_status: normalizedTrialStatus,
  };
}
return {
  userId: `guest-${normalizedGuestId}`,
  isGuest: true,
  plan: guestRow?.plan ?? "trial_guest",
  planStatus:
    guestRow?.plan_status ??
    (isTrialGuestPlan(guestRow?.plan)
      ? getDefaultPlanStatusForPlan("trial_guest")
      : DEFAULT_VIRTUS_PLAN_STATUS),
  trialStartedAt: guestRow?.trial_started_at ?? null,
  trialEndsAt: guestRow?.trial_ends_at ?? null,
};
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { guestId, chatId } = body;

    if (!chatId) {
      return Response.json({ error: "Missing chatId" }, { status: 400 });
    }

    const { userId, isGuest, plan, planStatus, trialStartedAt, trialEndsAt } =
  await resolveVirtusUserId(guestId);
    const supabase = createAdminClient();
    const effectiveChatId = chatId;

    const { data, error } = await supabase
      .from("conversations")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .eq("chat_id", effectiveChatId)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    const singleChatConversationLimit = getSingleChatMemoryLimit(plan);
const dailyMessageLimit = getDailyMessageLimit(plan);
const hasSingleChatConversationMemory = singleChatConversationLimit > 0;
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);


const tomorrowStart = new Date(todayStart);
tomorrowStart.setDate(tomorrowStart.getDate() + 1);

const { count: todayUserMessageCount } = await supabase
  .from("conversations")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId)
  .eq("role", "user")
  .gte("created_at", todayStart.toISOString())
  .lt("created_at", tomorrowStart.toISOString());

const dailyMessagesUsed = todayUserMessageCount ?? 0;
const conversationRows = hasSingleChatConversationMemory
  ? (data || []).slice(-singleChatConversationLimit)
  : [];

const conversation = conversationRows.map((item) => ({
  role: item.role,
  text: item.content,
  createdAt: item.created_at,
}));
    return Response.json({
  conversation,
  access: {
    plan,
    planStatus,
    trialStartedAt,
    trialEndsAt,
    dailyMessageLimit,
    dailyMessagesUsed,
  },
});
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE(req) {
  try {
    const body = await req.json();
    const { guestId, chatId } = body;

    if (!chatId) {
      return Response.json({ error: "Missing chatId" }, { status: 400 });
    }

    const { userId } = await resolveVirtusUserId(guestId);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("user_id", userId)
      .eq("chat_id", chatId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
