import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    plusPriceId: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || "",
    premiumPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  });
}