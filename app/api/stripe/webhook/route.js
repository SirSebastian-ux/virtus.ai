import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});

export async function GET() {
  return NextResponse.json({ ok: true, route: "webhook" });
}

export async function POST(req) {
    // webhook received
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
    console.error("STRIPE WEBHOOK SIGNATURE ERROR FULL:", {
      message: error.message,
      raw: error.raw,
      stack: error.stack,
    });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
  

const supabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

    if (
      event.type === "checkout.session.completed" ||
      event.type === "invoice.payment_succeeded" ||
      event.type === "invoice.payment_failed" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
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

      if (subscription) {
        const priceId = subscription.items?.data?.[0]?.price?.id || null;

        const userId = subscription.metadata?.user_id || null;

        const virtusPlan =
          subscription.metadata?.virtus_plan ||
          (priceId === process.env.STRIPE_PLUS_MONTHLY_PRICE_ID
            ? "plus"
            : priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
            ? "premium"
            : null);

        if (userId && virtusPlan) {
          const statusMap = {
            active: "active",
            trialing: "trialing",
            past_due: "past_due",
            canceled: "cancelled",
            unpaid: "past_due",
            incomplete: "inactive",
            incomplete_expired: "expired",
          };

          const nextPlan =
            subscription.status === "canceled" ||
            event.type === "customer.subscription.deleted"
              ? "free"
              : virtusPlan;

          const nextPlanStatus =
            subscription.status === "canceled" ||
            event.type === "customer.subscription.deleted"
              ? "active"
              : statusMap[subscription.status] || "inactive";

          const { data: updateData, error: updateError } = await supabase
  .from("profiles")
  .update({
    plan: nextPlan,
    plan_status: nextPlanStatus,
  })
  .eq("id", userId)
  .select();

if (updateError) {
  console.error("PROFILE UPDATE ERROR:", {
    userId,
    nextPlan,
    nextPlanStatus,
    updateError,
  });
}
        }
      }
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