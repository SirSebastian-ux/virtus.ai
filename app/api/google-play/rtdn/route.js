import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  acknowledgeGooglePlaySubscription,
  classifyGoogleSubscription,
  getGooglePlayPurchase,
  isGooglePlayBillingConfigured,
  purchaseTokenHash,
  sha256,
} from "@/lib/google-play-billing";
import { decodePlayRtdnData, verifyGooglePubSubPushAuth } from "@/lib/google-play-pubsub";

export const runtime = "nodejs";
const status = (code) => new NextResponse(null, { status: code });

export async function POST(request) {
  // The push endpoint must not accept unsigned or unauthenticated messages.
  if (!isGooglePlayBillingConfigured() ||
      process.env.VIRTUS_MULTI_PROVIDER_BILLING_ENABLED !== "true" ||
      process.env.GOOGLE_PLAY_RTDN_ENABLED !== "true") {
    return status(503);
  }

  try {
    await verifyGooglePubSubPushAuth(request.headers.get("authorization"));
  } catch (error) {
    console.warn("GOOGLE_PLAY_RTDN_AUTH_REJECTED", error.message);
    return status(401);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.message?.data !== "string") return status(400);

  let event;
  try {
    event = decodePlayRtdnData(body.message.data);
  } catch (error) {
    console.warn("GOOGLE_PLAY_RTDN_INVALID_PAYLOAD", error.message);
    return status(400);
  }
  if (event.test) return status(204);

  try {
    const tokenHash = purchaseTokenHash(event.purchaseToken);
    const admin = createAdminClient();
    const { data: existing, error: lookupError } = await admin
      .from("google_play_subscriptions").select("user_id")
      .eq("purchase_token_hash", tokenHash).maybeSingle();
    if (lookupError) throw new Error("RTDN purchase lookup failed.");
    // Unknown purchase tokens may be delivered before the customer returns
    // to our app. Request a Pub/Sub retry until the user links the purchase.
    if (!existing?.user_id) return status(503);

    // RTDN is an invalidation signal, not an entitlement. Fetch live state.
    const oidcToken = request.headers.get("x-vercel-oidc-token");
    const purchase = await getGooglePlayPurchase(event.purchaseToken, oidcToken);
    const details = classifyGoogleSubscription(purchase);
    if (!details.productId || details.basePlanId !== "monthly" ||
        details.obfuscatedAccountId !== sha256(existing.user_id)) {
      throw new Error("RTDN purchase details failed account/product verification.");
    }
    const canonicalStatus = details.accessible
      ? details.state === "SUBSCRIPTION_STATE_CANCELED" ? "cancelled"
        : details.state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ? "grace" : "active"
      : "inactive";

    const { data: updated, error: saveError } = await admin
      .from("google_play_subscriptions")
      .update({
        product_id: details.productId,
        base_plan_id: details.basePlanId,
        subscription_state: details.state,
        expires_at: details.expiresAt,
        acknowledgement_state: details.acknowledgementState,
        google_order_id: details.orderId,
        linked_purchase_token_hash: details.linkedTokenHash,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("purchase_token_hash", tokenHash)
      .eq("user_id", existing.user_id)
      .select("purchase_token_hash")
      .maybeSingle();
    if (saveError || !updated) throw new Error("RTDN verified state could not be persisted.");

    const { data: reconciled, error: rpcError } = await admin.rpc(
      "virtus_record_billing_entitlement", {
        p_user_id: existing.user_id,
        p_provider: "google_play",
        p_provider_subscription_id: tokenHash,
        p_plan: details.appPlan,
        p_status: canonicalStatus,
        p_expires_at: details.expiresAt,
      }
    );
    if (rpcError || !Array.isArray(reconciled) || reconciled.length !== 1) {
      throw new Error("RTDN provider entitlement reconciliation failed.");
    }

    if (details.accessible && details.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
      await acknowledgeGooglePlaySubscription(details.productId, event.purchaseToken, oidcToken);
      const { error: ackError } = await admin.from("google_play_subscriptions")
        .update({ acknowledgement_state: "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED", updated_at: new Date().toISOString() })
        .eq("purchase_token_hash", tokenHash).eq("user_id", existing.user_id);
      if (ackError) throw new Error("RTDN acknowledgement state could not be persisted.");
    }
    return status(204);
  } catch (error) {
    console.error("GOOGLE_PLAY_RTDN_PROCESSING_FAILED", error.message);
    // Non-2xx causes authenticated Pub/Sub to retry.
    return status(503);
  }
}
