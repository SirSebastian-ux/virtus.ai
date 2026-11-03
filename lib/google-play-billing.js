import { createHash } from "node:crypto";

const PACKAGE_NAME = "com.virtusaiworld.app";
const PRODUCT_TO_PLAN = Object.freeze({
  virtus_life_coach: "life_coach",
  virtus_trainer: "plus",
  virtus_mentor: "premium",
});

export function isGooglePlayBillingConfigured() {
  return process.env.VIRTUS_GOOGLE_PLAY_BILLING_ENABLED === "true" &&
    Boolean(process.env.GOOGLE_PLAY_WIF_PROVIDER) &&
    Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL);
}

export function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

export function purchaseTokenHash(token) {
  if (typeof token !== "string" || token.length < 8 || token.length > 2048) {
    throw new Error("Invalid purchase token.");
  }
  return sha256(token);
}

export function classifyGoogleSubscription(purchase) {
  const state = purchase?.subscriptionState;
  const lines = Array.isArray(purchase?.lineItems) ? purchase.lineItems : [];
  const validLines = lines.filter((line) => PRODUCT_TO_PLAN[line.productId] && line.offerDetails?.basePlanId === "monthly");
  const latest = validLines
    .filter((line) => Number.isFinite(Date.parse(line.expiryTime)))
    .sort((a, b) => Date.parse(b.expiryTime) - Date.parse(a.expiryTime))[0];

  const productId = latest?.productId || null;
  const expiry = latest?.expiryTime || null;
  const accessible = [
    "SUBSCRIPTION_STATE_ACTIVE",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
    "SUBSCRIPTION_STATE_CANCELED",
  ].includes(state) && expiry && Date.parse(expiry) > Date.now();

  return {
    productId,
    appPlan: productId ? PRODUCT_TO_PLAN[productId] : null,
    basePlanId: latest?.offerDetails?.basePlanId || null,
    state: typeof state === "string" ? state : "SUBSCRIPTION_STATE_UNSPECIFIED",
    expiresAt: expiry,
    acknowledgementState: purchase?.acknowledgementState || null,
    orderId: purchase?.latestOrderId || latest?.latestSuccessfulOrderId || null,
    accessible: Boolean(accessible),
    linkedTokenHash: purchase?.linkedPurchaseToken
      ? purchaseTokenHash(purchase.linkedPurchaseToken)
      : null,
    obfuscatedAccountId: purchase?.externalAccountIdentifiers?.obfuscatedExternalAccountId || null,
  };
}

// Google verifies the OIDC JWT issued by Vercel; no long-lived Google keys.
export async function exchangeForGoogleAccessToken(vercelOidcToken) {
  const provider = process.env.GOOGLE_PLAY_WIF_PROVIDER;
  const serviceAccount = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL;
  if (!provider || !serviceAccount) throw new Error("Google Play server credentials have not been configured.");
  if (!/^[a-zA-Z0-9_.@-]+$/.test(serviceAccount)) throw new Error("Invalid service-account configuration.");
  if (!/^projects\/\d+\/locations\/global\/workloadIdentityPools\/[a-zA-Z0-9_-]+\/providers\/[a-zA-Z0-9_-]+$/.test(provider)) {
    throw new Error("Invalid Google WIF provider configuration.");
  }
  if (typeof vercelOidcToken !== "string" || !vercelOidcToken) {
    throw new Error("Vercel OIDC token is not available.");
  }
  const stsResponse = await fetch("https://sts.googleapis.com/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audience: "//iam.googleapis.com/" + provider,
      grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
      requestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
      scope: "https://www.googleapis.com/auth/cloud-platform",
      subjectTokenType: "urn:ietf:params:oauth:token-type:jwt",
      subjectToken: vercelOidcToken,
    }),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!stsResponse.ok) throw new Error("Google STS rejected Vercel workload identity (HTTP " + stsResponse.status + ").");
  const sts = await stsResponse.json();
  if (!sts.access_token) throw new Error("No Google federated access token was issued.");
  const iamResponse = await fetch(
    "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/" +
      encodeURIComponent(serviceAccount) + ":generateAccessToken",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + sts.access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scope: ["https://www.googleapis.com/auth/androidpublisher"], lifetime: "600s" }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    }
  );
  if (!iamResponse.ok) throw new Error("Google service-account impersonation failed (HTTP " + iamResponse.status + ").");
  const credentials = await iamResponse.json();
  if (!credentials.accessToken) throw new Error("Google did not issue an Android Publisher access token.");
  return credentials.accessToken;
}

export async function getGooglePlayPurchase(token, vercelOidcToken) {
  const googleToken = await exchangeForGoogleAccessToken(vercelOidcToken);
  const response = await fetch(
    "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" +
      PACKAGE_NAME + "/purchases/subscriptionsv2/tokens/" + encodeURIComponent(token),
    {
      headers: { Authorization: "Bearer " + googleToken, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    }
  );
  if (!response.ok) throw new Error("Google Play subscription verification failed (HTTP " + response.status + ").");
  const purchase = await response.json();
  if (!purchase || purchase.kind !== "androidpublisher#subscriptionPurchaseV2") {
    throw new Error("Google Play returned an unexpected purchase response.");
  }
  return purchase;
}

export async function acknowledgeGooglePlaySubscription(productId, purchaseToken, vercelOidcToken) {
  if (!PRODUCT_TO_PLAN[productId]) throw new Error("Unrecognized Google Play subscription product.");
  const googleToken = await exchangeForGoogleAccessToken(vercelOidcToken);
  const response = await fetch(
    "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" +
      PACKAGE_NAME + "/purchases/subscriptions/" + encodeURIComponent(productId) +
      "/tokens/" + encodeURIComponent(purchaseToken) + ":acknowledge",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + googleToken,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    }
  );
  if (!response.ok) {
    throw new Error("Google Play acknowledgement failed (HTTP " + response.status + ").");
  }
  return true;
}
