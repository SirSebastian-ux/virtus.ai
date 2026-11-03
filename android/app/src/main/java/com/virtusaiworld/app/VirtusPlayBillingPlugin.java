package com.virtusaiworld.app;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

@CapacitorPlugin(name = "VirtusPlayBilling")
public class VirtusPlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private static final List<String> PRODUCT_IDS = Arrays.asList(
        "virtus_life_coach", "virtus_trainer", "virtus_mentor"
    );
    private BillingClient client;

    @Override
    public void load() {
        client = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
        client.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                JSObject event = new JSObject();
                event.put("available", result.getResponseCode() == BillingClient.BillingResponseCode.OK);
                event.put("responseCode", result.getResponseCode());
                notifyListeners("connectionChanged", event, true);
            }
            @Override public void onBillingServiceDisconnected() {
                JSObject event = new JSObject();
                event.put("available", false);
                notifyListeners("connectionChanged", event, true);
            }
        });
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        if (!ready(call)) return;
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        for (String id : PRODUCT_IDS) {
            products.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(id).setProductType(BillingClient.ProductType.SUBS).build());
        }
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(products).build();
        client.queryProductDetailsAsync(params, (result, detailsResult) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                rejectBilling(call, result);
                return;
            }
            JSArray out = new JSArray();
            for (ProductDetails detail : detailsResult.getProductDetailsList()) {
                JSObject item = new JSObject();
                item.put("productId", detail.getProductId());
                item.put("name", detail.getName());
                item.put("description", detail.getDescription());
                JSArray offers = new JSArray();
                List<ProductDetails.SubscriptionOfferDetails> subscriptionOffers = detail.getSubscriptionOfferDetails();
                if (subscriptionOffers != null) {
                    for (ProductDetails.SubscriptionOfferDetails offer : subscriptionOffers) {
                        if (!"monthly".equals(offer.getBasePlanId()) || offer.getOfferId() != null) continue;
                        JSObject entry = new JSObject();
                        entry.put("basePlanId", offer.getBasePlanId());
                        ProductDetails.PricingPhases phases = offer.getPricingPhases();
                        if (phases != null && !phases.getPricingPhaseList().isEmpty()) {
                            ProductDetails.PricingPhase phase = phases.getPricingPhaseList().get(0);
                            entry.put("formattedPrice", phase.getFormattedPrice());
                            entry.put("currencyCode", phase.getPriceCurrencyCode());
                        }
                        entry.put("offerToken", offer.getOfferToken());
                        offers.put(entry);
                    }
                }
                item.put("offers", offers);
                out.put(item);
            }
            JSObject response = new JSObject();
            response.put("products", out);
            call.resolve(response);
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        if (!ready(call)) return;
        String productId = call.getString("productId", "");
        String obfuscatedAccountId = call.getString("obfuscatedAccountId", "");
        if (!PRODUCT_IDS.contains(productId) ||
            !obfuscatedAccountId.matches("[0-9a-f]{64}")) {
            call.reject("Invalid subscription product or account identifier.");
            return;
        }
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(Arrays.asList(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId).setProductType(BillingClient.ProductType.SUBS).build()))
            .build();
        client.queryProductDetailsAsync(params, (result, detailsResult) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                rejectBilling(call, result);
                return;
            }
            ProductDetails selected = null;
            for (ProductDetails candidate : detailsResult.getProductDetailsList()) {
                if (productId.equals(candidate.getProductId())) selected = candidate;
            }
            if (selected == null || selected.getSubscriptionOfferDetails() == null) {
                call.reject("This subscription is not currently available in Google Play.");
                return;
            }
            String offerToken = null;
            for (ProductDetails.SubscriptionOfferDetails offer : selected.getSubscriptionOfferDetails()) {
                if ("monthly".equals(offer.getBasePlanId()) && offer.getOfferId() == null) {
                    offerToken = offer.getOfferToken();
                    break;
                }
            }
            if (offerToken == null) {
                call.reject("The monthly Google Play billing plan is not active yet.");
                return;
            }
            BillingFlowParams.ProductDetailsParams productParams =
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(selected).setOfferToken(offerToken).build();
            BillingFlowParams flow = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Arrays.asList(productParams))
                .setObfuscatedAccountId(obfuscatedAccountId)
                .build();
            getActivity().runOnUiThread(() -> {
                BillingResult launched = client.launchBillingFlow(getActivity(), flow);
                if (launched.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    rejectBilling(call, launched);
                    return;
                }
                JSObject response = new JSObject();
                response.put("started", true);
                call.resolve(response);
            });
        });
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        if (!ready(call)) return;
        QueryPurchasesParams query = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .includeSuspendedSubscriptions(true)
            .build();
        client.queryPurchasesAsync(query, (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                rejectBilling(call, result);
                return;
            }
            JSObject response = new JSObject();
            response.put("purchases", serializePurchases(purchases));
            call.resolve(response);
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        JSObject payload = new JSObject();
        payload.put("responseCode", result.getResponseCode());
        payload.put("message", result.getDebugMessage());
        payload.put("purchases", serializePurchases(purchases));
        notifyListeners("purchasesUpdated", payload, true);
    }

    private JSArray serializePurchases(List<Purchase> purchases) {
        JSArray items = new JSArray();
        if (purchases == null) return items;
        for (Purchase purchase : purchases) {
            JSObject item = new JSObject();
            item.put("products", new JSArray(purchase.getProducts()));
            item.put("purchaseToken", purchase.getPurchaseToken());
            item.put("purchaseState", purchase.getPurchaseState());
            item.put("acknowledged", purchase.isAcknowledged());
            items.put(item);
        }
        return items;
    }

    private boolean ready(PluginCall call) {
        if (client == null || !client.isReady()) {
            call.reject("Google Play Billing is not connected. Check your Play Store and try again.");
            return false;
        }
        return true;
    }

    private void rejectBilling(PluginCall call, BillingResult result) {
        call.reject("Google Play Billing error (" + result.getResponseCode() + "): " + result.getDebugMessage());
    }

    @Override
    protected void handleOnDestroy() {
        if (client != null) client.endConnection();
        super.handleOnDestroy();
    }
}
