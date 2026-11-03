// Keyless, idempotent Google Play subscription-catalog bootstrap.
// Creates missing draft monthly subscriptions only. Never activates billing,
// changes existing products, or touches the Stripe membership system.

const appPackage = process.env.ANDROID_PACKAGE || "com.virtusaiworld.app";
const token = process.env.GOOGLE_ACCESS_TOKEN;
const root = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" + encodeURIComponent(appPackage);

const plans = [
  {
    productId: "virtus_life_coach",
    appTier: "life_coach",
    title: "Virtus AI Life Coach",
    description: "Personal reflection and guided growth with saved chats and basic continuity.",
    usdCents: 999,
  },
  {
    productId: "virtus_trainer",
    appTier: "plus",
    title: "Virtus AI Trainer",
    description: "Structured personal development with stronger continuity, training and project support.",
    usdCents: 1999,
  },
  {
    productId: "virtus_mentor",
    appTier: "premium",
    title: "Virtus AI Mentor",
    description: "Advanced mentoring and guided personal development with enhanced continuity.",
    usdCents: 2999,
  },
];

if (!token || token.length < 30) {
  throw new Error("Missing Google Play short-lived access token.");
}

function usdMoney(cents) {
  return {
    currencyCode: "USD",
    units: String(Math.floor(cents / 100)),
    nanos: (cents % 100) * 10000000,
  };
}

async function googleApi(method, path, body) {
  const response = await fetch(root + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
  const raw = await response.text();
  let data = {};
  if (raw.trim()) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("Google Play returned invalid JSON (HTTP " + response.status + ").");
    }
  }
  if (!response.ok) {
    const message = data?.error?.message || "No structured error message";
    throw new Error("Google Play " + method + " request failed (HTTP " + response.status + "): " + message);
  }
  return { status: response.status, data };
}

async function listAllProducts() {
  let pageToken = "";
  const products = [];
  const seenTokens = new Set();
  for (let page = 0; page < 20; page++) {
    const query = new URLSearchParams({ pageSize: "100" });
    if (pageToken) query.set("pageToken", pageToken);
    const { status, data } = await googleApi("GET", "/subscriptions?" + query.toString());
    if (status === 204) {
      if (pageToken) throw new Error("Unexpected HTTP 204 in the middle of subscription pagination.");
      return products;
    }
    if (!Array.isArray(data.subscriptions || [])) {
      throw new Error("Unexpected Google Play subscription list response.");
    }
    products.push(...(data.subscriptions || []));
    pageToken = data.nextPageToken || "";
    if (!pageToken) return products;
    if (seenTokens.has(pageToken)) throw new Error("Google Play repeated a subscription page token.");
    seenTokens.add(pageToken);
  }
  throw new Error("Subscription catalog pagination exceeded safety limit.");
}

async function convertRegionalPrices(plan) {
  const { status, data } = await googleApi(
    "POST",
    "/pricing:convertRegionPrices",
    { price: usdMoney(plan.usdCents) }
  );
  if (
    status !== 200 ||
    !data?.regionVersion?.version ||
    !data?.convertedRegionPrices ||
    !data?.convertedOtherRegionsPrice?.usdPrice ||
    !data?.convertedOtherRegionsPrice?.eurPrice
  ) {
    throw new Error("Regional pricing not returned for " + plan.productId + ". No product was created for this plan.");
  }

  const regionalConfigs = Object.entries(data.convertedRegionPrices).map(
    ([regionCode, converted]) => {
      if (!converted?.price?.currencyCode) {
        throw new Error("Missing converted price for region " + regionCode + " (" + plan.productId + ").");
      }
      return {
        regionCode,
        newSubscriberAvailability: true,
        price: converted.price,
      };
    }
  );
  if (regionalConfigs.length === 0) {
    throw new Error("Google returned no supported regions for " + plan.productId + ".");
  }

  return {
    version: data.regionVersion.version,
    regionalConfigs,
    otherRegionsConfig: {
      usdPrice: data.convertedOtherRegionsPrice.usdPrice,
      eurPrice: data.convertedOtherRegionsPrice.eurPrice,
      newSubscriberAvailability: true,
    },
  };
}

function confirmExisting(existing, plan) {
  const monthly = (existing.basePlans || []).find((p) => p.basePlanId === "monthly");
  if (
    existing.productId !== plan.productId ||
    !monthly ||
    monthly.autoRenewingBasePlanType?.billingPeriodDuration !== "P1M"
  ) {
    throw new Error(
      "Existing product " + plan.productId +
      " has a different structure; refusing to overwrite or change it."
    );
  }
  console.log("Preserved existing " + plan.productId + " (monthly base plan state " + (monthly.state || "unknown") + ").");
}

const existingProducts = await listAllProducts();
const productsById = new Map(existingProducts.map((product) => [product.productId, product]));
const missingPlans = plans.filter((plan) => !productsById.has(plan.productId));
console.log("Existing subscription products: " + existingProducts.length);
console.log("Virtus AI products requiring creation: " + missingPlans.length);

for (const plan of plans) {
  if (productsById.has(plan.productId)) confirmExisting(productsById.get(plan.productId), plan);
}

// Convert and validate *all* prices before making the first write.
const pricing = new Map();
for (const plan of missingPlans) {
  const regional = await convertRegionalPrices(plan);
  pricing.set(plan.productId, regional);
  console.log(
    "Prepared " + plan.productId + " at USD " + (plan.usdCents / 100).toFixed(2) +
    "/month with " + regional.regionalConfigs.length + " localized regions."
  );
}

for (const plan of missingPlans) {
  const regional = pricing.get(plan.productId);
  const query = new URLSearchParams({
    productId: plan.productId,
    "regionsVersion.version": String(regional.version),
  });
  const payload = {
    packageName: appPackage,
    productId: plan.productId,
    listings: [
      {
        languageCode: "en-US",
        title: plan.title,
        description: plan.description,
      },
    ],
    basePlans: [
      {
        basePlanId: "monthly",
        autoRenewingBasePlanType: { billingPeriodDuration: "P1M" },
        regionalConfigs: regional.regionalConfigs,
        otherRegionsConfig: regional.otherRegionsConfig,
      },
    ],
  };
  const created = await googleApi("POST", "/subscriptions?" + query.toString(), payload);
  if (created.status !== 200 && created.status !== 201) {
    throw new Error("Unexpected subscription-create status " + created.status + " for " + plan.productId);
  }
  const verified = await googleApi("GET", "/subscriptions/" + encodeURIComponent(plan.productId));
  if (verified.status !== 200 || verified.data?.productId !== plan.productId) {
    throw new Error("Could not verify creation of " + plan.productId + " by reading it back.");
  }
  const monthly = (verified.data.basePlans || []).find((p) => p.basePlanId === "monthly");
  if (!monthly || monthly.autoRenewingBasePlanType?.billingPeriodDuration !== "P1M") {
    throw new Error("Google Play returned a product without the expected monthly base plan: " + plan.productId);
  }
  console.log(
    "Created and verified " + plan.productId +
    " (app tier " + plan.appTier + "; base plan " + monthly.basePlanId +
    "; state " + (monthly.state || "unknown") + ")."
  );
}

console.log(
  "Catalog bootstrap complete. All three products are present; new monthly base plans remain in DRAFT until intentionally activated."
);
