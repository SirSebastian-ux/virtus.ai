import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase-server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { plan, billingCycle = "monthly" } = body;

    if (!plan || (plan !== "plus" && plan !== "premium")) {
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

    const priceId =
      plan === "plus" && billingCycle === "monthly"
        ? process.env.STRIPE_PLUS_MONTHLY_PRICE_ID
        : plan === "plus" && billingCycle === "yearly"
        ? process.env.STRIPE_PLUS_YEARLY_PRICE_ID
        : plan === "premium" && billingCycle === "monthly"
        ? process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
        : process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing Stripe price ID." },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/upgrade?success=true&plan=${plan}&billing=${billingCycle}`,
      cancel_url: `${appUrl}/upgrade?canceled=true`,
      metadata: {
        user_id: user.id,
        virtus_plan: plan,
        virtus_billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          virtus_plan: plan,
          virtus_billing_cycle: billingCycle,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("STRIPE CHECKOUT ERROR FULL:", {
      message: error.message,
      raw: error.raw,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: error.message || "Failed to create checkout session.",
      },
      { status: 500 }
    );
  }
}