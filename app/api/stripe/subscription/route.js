import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { stripe } from "@/lib/stripe";
import {
  belongsToPersonalVirtusSubscription,
  subscriptionCancellationState,
} from "@/lib/virtus-self-service-cancellation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getBillingIdentity() {
  const db = await createClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user?.id) return { error: "Sign in to manage your membership.", status: 401 };
  const { data: profile, error: profileError } = await db.from("profiles")
    .select("stripe_customer_id").eq("id", user.id).maybeSingle();
  if (profileError) return { error: "Billing profile could not be loaded.", status: 500 };
  return { userId: user.id, customerId: profile?.stripe_customer_id || null };
}

async function ownSubscriptions(identity) {
  if (!identity.customerId) return [];
  const list = await stripe.subscriptions.list({
    customer: identity.customerId, status: "all", limit: 100,
  });
  // Never expose another service's subscription merely because it shares a Stripe customer.
  return list.data.filter((s) =>
    belongsToPersonalVirtusSubscription(s, identity.userId, identity.customerId));
}

export async function GET() {
  try {
    const identity = await getBillingIdentity();
    if (identity.error) return NextResponse.json({ error: identity.error }, { status: identity.status });
    const subscriptions = (await ownSubscriptions(identity))
      .filter((s) => ["active", "trialing", "past_due"].includes(s.status) || s.cancel_at_period_end)
      .map(subscriptionCancellationState);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Virtus self-service billing lookup failed:", error);
    return NextResponse.json({ error: "Unable to load subscription status." }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const identity = await getBillingIdentity();
    if (identity.error) return NextResponse.json({ error: identity.error }, { status: identity.status });
    if (!identity.customerId) return NextResponse.json({ error: "No personal Stripe billing account is linked." }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const subscriptionId = String(body?.subscriptionId || "");
    if (!/^sub_[a-zA-Z0-9]+$/.test(subscriptionId)) {
      return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!belongsToPersonalVirtusSubscription(subscription, identity.userId, identity.customerId)) {
      return NextResponse.json({ error: "Subscription not available for this account." }, { status: 403 });
    }
    if (subscription.cancel_at_period_end) {
      return NextResponse.json({ subscription: subscriptionCancellationState(subscription) });
    }
    if (!["active", "trialing", "past_due"].includes(subscription.status)) {
      return NextResponse.json({ error: "This subscription cannot be scheduled for cancellation." }, { status: 409 });
    }
    // Schedule cessation of future renewals; do not revoke already-paid access.
    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    }, { idempotencyKey: `virtus-cancel-at-period-end-${subscription.id}` });
    return NextResponse.json({ subscription: subscriptionCancellationState(updated) });
  } catch (error) {
    console.error("Virtus cancellation request failed:", error);
    return NextResponse.json({ error: "Unable to schedule cancellation. Your subscription was not confirmed as canceled." }, { status: 503 });
  }
}
