import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase-server";

function getPriceId(plan, billingCycle) {
  if (plan === "plus" && billingCycle === "monthly") {
    return process.env.STRIPE_PLUS_MONTHLY_PRICE_ID;
  }

  if (plan === "plus" && billingCycle === "yearly") {
    return process.env.STRIPE_PLUS_YEARLY_PRICE_ID;
  }

  if (plan === "premium" && billingCycle === "monthly") {
    return process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID;
  }

  if (plan === "premium" && billingCycle === "yearly") {
    return process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;
  }

  return null;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan = String(body?.plan || "").trim().toLowerCase();
    const billingCycle = String(body?.billingCycle || "monthly")
      .trim()
      .toLowerCase();

    if (plan !== "plus" && plan !== "premium") {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 }
      );
    }

    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      return NextResponse.json(
        { error: "Invalid billing cycle selected." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id || !user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to upgrade." },
        { status: 401 }
      );
    }

    const priceId = getPriceId(plan, billingCycle);

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing Stripe price ID." },
        { status: 500 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const stripeCustomerId = profile?.stripe_customer_id || null;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: user.email }),
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/upgrade?success=true`,
      cancel_url: `${appUrl}/upgrade?canceled=true`,
      metadata: {
        user_id: user.id,
        virtus_plan: plan,
        virtus_billing_cycle: billingCycle,
        selected_price_id: priceId,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          virtus_plan: plan,
          virtus_billing_cycle: billingCycle,
          selected_price_id: priceId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("STRIPE CHECKOUT ERROR:", {
      message: error.message,
      raw: error.raw,
    });

    return NextResponse.json(
      {
        error: error.message || "Failed to create checkout session.",
      },
      { status: 500 }
    );
  }
}