import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  classifyGoogleSubscription,
  getGooglePlayPurchase,
  acknowledgeGooglePlaySubscription,
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

    // Entitlements are reconciled atomically with other payment sources.
    // Preserve the recorded, verified purchase even when it is pending/expired.
    if (process.env.VIRTUS_MULTI_PROVIDER_BILLING_ENABLED !== "true") {
      return json({ verified: true, membershipActivated: false,
        message: "Purchase verified. Membership reconciliation is not enabled." });
    }

    const canonicalStatus = details.accessible
      ? (details.state === "SUBSCRIPTION_STATE_CANCELED" ? "cancelled"
          : details.state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ? "grace" : "active")
      : "inactive";

    const { data: entitlementRows, error: entitlementError } = await admin.rpc(
      "virtus_record_billing_entitlement", {
        p_user_id: user.id,
        p_provider: "google_play",
        p_provider_subscription_id: tokenHash,
        p_plan: details.appPlan,
        p_status: canonicalStatus,
        p_expires_at: details.expiresAt,
      }
    );
    if (entitlementError || !Array.isArray(entitlementRows) || entitlementRows.length !== 1) {
      throw new Error("Verified Google Play entitlement could not be reconciled.");
    }

    // Google must be acknowledged only after successful entitlement fulfillment.
    if (details.accessible && details.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
      await acknowledgeGooglePlaySubscription(
        details.productId, input.purchaseToken, request.headers.get("x-vercel-oidc-token")
      );
      const { error: ackUpdateError } = await admin.from("google_play_subscriptions")
        .update({ acknowledgement_state: "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED", updated_at: new Date().toISOString() })
        .eq("purchase_token_hash", tokenHash).eq("user_id", user.id);
      if (ackUpdateError) console.error("GOOGLE_PLAY_ACK_RECORD_UPDATE_ERROR", ackUpdateError.message);
    }

    return json({
      verified: true,
      productId: details.productId,
      subscriptionState: details.state,
      expiresAt: details.expiresAt,
      membershipActivated: Boolean(details.accessible),
      effectivePlan: entitlementRows[0].effective_plan,
      message: details.accessible
        ? "Google Play membership verified and synchronized."
        : "Google Play purchase has no current active entitlement.",
    });
  } catch (error) {
    console.error("GOOGLE_PLAY_VERIFICATION_ERROR", {
      reason: error?.message || "Unspecified verification failure",
    });
    return json({ error: "Google Play purchase verification is temporarily unavailable." }, 503);
  }
}
