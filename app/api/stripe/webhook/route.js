import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});

function getPlanFromPriceId(priceId) {
  if (
    priceId === process.env.STRIPE_PLUS_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_PLUS_YEARLY_PRICE_ID
  ) {
    return "plus";
  }

  if (
    priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
  ) {
    return "premium";
  }

  return null;
}

function getPlanStatusFromSubscriptionStatus(status) {
  const statusMap = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "past_due",
    incomplete: "inactive",
    incomplete_expired: "expired",
  };

  return statusMap[status] || "inactive";
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "webhook" });
}

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing Stripe webhook signature or secret." },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("STRIPE WEBHOOK SIGNATURE ERROR:", {
      message: error.message,
      raw: error.raw,
    });

    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const supportedEvents = new Set([
      "checkout.session.completed",
      "invoice.payment_succeeded",
      "invoice.payment_failed",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ]);

    if (!supportedEvents.has(event.type)) {
      return NextResponse.json({ received: true });
    }

    let subscription = null;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.mode === "subscription" && session.subscription) {
        subscription = await stripe.subscriptions.retrieve(session.subscription);
      }
    } else if (
      event.type === "invoice.payment_succeeded" ||
      event.type === "invoice.payment_failed"
    ) {
      const invoice = event.data.object;

      if (invoice.subscription) {
        subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      }
    } else {
      subscription = event.data.object;
    }

    if (!subscription) {
      return NextResponse.json({ received: true });
    }

    const priceId = subscription.items?.data?.[0]?.price?.id || null;
    const userId = subscription.metadata?.user_id || null;
    const virtusPlan =
      subscription.metadata?.virtus_plan || getPlanFromPriceId(priceId);

    if (!userId || !virtusPlan) {
      console.error("STRIPE WEBHOOK MISSING USER OR PLAN:", {
        eventType: event.type,
        subscriptionId: subscription.id,
        priceId,
        userId,
        virtusPlan,
      });

      return NextResponse.json({ received: true });
    }

    const isDeletedOrCancelled =
      subscription.status === "canceled" ||
      event.type === "customer.subscription.deleted";

    const nextPlan = isDeletedOrCancelled ? "free" : virtusPlan;
    const nextPlanStatus = isDeletedOrCancelled
      ? "active"
      : getPlanStatusFromSubscriptionStatus(subscription.status);

    const stripeCustomerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id || null;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan: nextPlan,
        plan_status: nextPlanStatus,
        stripe_customer_id: stripeCustomerId,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("PROFILE UPDATE ERROR:", {
        userId,
        nextPlan,
        nextPlanStatus,
        updateError,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("STRIPE WEBHOOK ERROR:", error);

    return NextResponse.json(
      { error: "Webhook handling failed." },
      { status: 500 }
    );
  }
}