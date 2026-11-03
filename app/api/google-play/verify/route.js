import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  classifyGoogleSubscription,
  getGooglePlayPurchase,
  isGooglePlayBillingConfigured,
  purchaseTokenHash,
  sha256,
} from "@/lib/google-play-billing";

export const runtime = "nodejs";

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  // An explicit readiness probe; does not expose credentials.
  return json({ enabled: isGooglePlayBillingConfigured(), checkoutEnabled: false });
}

export async function POST(request) {
  // Fail closed: this is purchase verification groundwork, not live fulfillment.
  if (!isGooglePlayBillingConfigured()) {
    return json({ error: "Google Play purchase verification is not yet enabled." }, 503);
  }

  const auth = await createClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user?.id || !user.email) return json({ error: "Sign in before restoring a purchase." }, 401);

  const input = await request.json().catch(() => null);
  if (!input || typeof input.purchaseToken !== "string" || input.purchaseToken.length < 8 ||
      input.purchaseToken.length > 2048 || typeof input.productId !== "string" ||
      !["virtus_life_coach", "virtus_trainer", "virtus_mentor"].includes(input.productId)) {
    return json({ error: "A valid Google Play subscription token and product are required." }, 400);
  }

  const tokenHash = purchaseTokenHash(input.purchaseToken);
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("google_play_subscriptions")
    .select("user_id")
    .eq("purchase_token_hash", tokenHash)
    .maybeSingle();
  if (existingError) return json({ error: "Purchase record lookup unavailable." }, 503);
  if (existing && existing.user_id !== user.id) {
    return json({ error: "This Google Play purchase is already linked to another Virtus account." }, 409);
  }

  try {
    const purchase = await getGooglePlayPurchase(
      input.purchaseToken,
      request.headers.get("x-vercel-oidc-token")
    );
    const details = classifyGoogleSubscription(purchase);
    if (details.productId !== input.productId || details.basePlanId !== "monthly") {
      return json({ error: "Google Play purchase does not match the selected plan." }, 400);
    }
    if (details.obfuscatedAccountId !== sha256(user.id)) {
      return json({ error: "Google Play purchase was not initiated for this Virtus account." }, 403);
    }

    const record = {
      purchase_token_hash: tokenHash,
      user_id: user.id,
      product_id: details.productId,
      base_plan_id: details.basePlanId,
      subscription_state: details.state,
      expires_at: details.expiresAt,
      acknowledgement_state: details.acknowledgementState,
      google_order_id: details.orderId,
      linked_purchase_token_hash: details.linkedTokenHash,
      last_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { data, error } = await admin.from("google_play_subscriptions")
        .update(record).eq("purchase_token_hash", tokenHash).eq("user_id", user.id)
        .select("purchase_token_hash").maybeSingle();
      if (error || !data) return json({ error: "Purchase verification could not be recorded." }, 503);
    } else {
      const { error } = await admin.from("google_play_subscriptions").insert(record);
      if (error) {
        if (error.code === "23505") return json({ error: "Purchase linkage changed. Please contact support." }, 409);
        return json({ error: "Purchase verification could not be recorded." }, 503);
      }
    }

    // No paid entitlement is granted before server acknowledgement,
    // source-of-truth arbitration with Stripe, and RTDN lifecycle handling.
    return json({
      verified: true,
      productId: details.productId,
      subscriptionState: details.state,
      expiresAt: details.expiresAt,
      eligibleForEntitlement: details.accessible,
      membershipActivated: false,
      message: "Purchase verified. Membership activation is pending billing integration.",
    });
  } catch (error) {
    console.error("GOOGLE_PLAY_VERIFICATION_ERROR", {
      reason: error?.message || "Unspecified verification failure",
    });
    return json({ error: "Google Play purchase verification is temporarily unavailable." }, 503);
  }
}
