import { strict as assert } from "node:assert";
import test from "node:test";
import { classifyGoogleSubscription, isGooglePlayBillingConfigured, purchaseTokenHash, sha256 } from "../lib/google-play-billing.js";

const future = "2099-12-31T23:59:59.000Z";
const past = "2020-01-01T00:00:00.000Z";
function fixture(state, expiry = future, productId = "virtus_trainer") {
  return {
    kind: "androidpublisher#subscriptionPurchaseV2",
    subscriptionState: state,
    acknowledgementState: "ACKNOWLEDGEMENT_STATE_PENDING",
    externalAccountIdentifiers: { obfuscatedExternalAccountId: sha256("account-a") },
    lineItems: [{
      productId, expiryTime: expiry,
      offerDetails: { basePlanId: "monthly" },
    }],
  };
}

test("active Google Play subscription is eligible but not trusted to activate itself", () => {
  const result = classifyGoogleSubscription(fixture("SUBSCRIPTION_STATE_ACTIVE"));
  assert.equal(result.accessible, true);
  assert.equal(result.appPlan, "plus");
  assert.equal(result.basePlanId, "monthly");
});

test("canceled subscriptions stay eligible only until their expiry", () => {
  assert.equal(classifyGoogleSubscription(fixture("SUBSCRIPTION_STATE_CANCELED")).accessible, true);
  assert.equal(classifyGoogleSubscription(fixture("SUBSCRIPTION_STATE_CANCELED", past)).accessible, false);
});

test("pending, on-hold, paused and expired subscriptions never qualify", () => {
  for (const state of ["SUBSCRIPTION_STATE_PENDING", "SUBSCRIPTION_STATE_ON_HOLD", "SUBSCRIPTION_STATE_PAUSED", "SUBSCRIPTION_STATE_EXPIRED"]) {
    assert.equal(classifyGoogleSubscription(fixture(state)).accessible, false);
  }
});

test("unknown products and base plans do not qualify", () => {
  assert.equal(classifyGoogleSubscription(fixture("SUBSCRIPTION_STATE_ACTIVE", future, "unexpected_product")).accessible, false);
  const data = fixture("SUBSCRIPTION_STATE_ACTIVE");
  data.lineItems[0].offerDetails.basePlanId = "annual";
  assert.equal(classifyGoogleSubscription(data).accessible, false);
});

test("hashing uses stable 64 character identifiers without retaining raw token", () => {
  assert.equal(sha256("account-a").length, 64);
  assert.equal(purchaseTokenHash("purchase-secret-token"), purchaseTokenHash("purchase-secret-token"));
  assert.notEqual(purchaseTokenHash("purchase-secret-token"), purchaseTokenHash("other-purchase-token"));
  assert.throws(() => purchaseTokenHash("short"));
});

test("Google Play server feature is disabled without explicit production configuration", () => {
  const enabled = process.env.VIRTUS_GOOGLE_PLAY_BILLING_ENABLED;
  const provider = process.env.GOOGLE_PLAY_WIF_PROVIDER;
  const email = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL;
  delete process.env.VIRTUS_GOOGLE_PLAY_BILLING_ENABLED;
  delete process.env.GOOGLE_PLAY_WIF_PROVIDER;
  delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL;
  try {
    assert.equal(isGooglePlayBillingConfigured(), false);
  } finally {
    if (enabled !== undefined) process.env.VIRTUS_GOOGLE_PLAY_BILLING_ENABLED = enabled;
    if (provider !== undefined) process.env.GOOGLE_PLAY_WIF_PROVIDER = provider;
    if (email !== undefined) process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL = email;
  }
});
