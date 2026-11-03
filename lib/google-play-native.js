import { Capacitor, registerPlugin } from "@capacitor/core";

export const VIRTUS_GOOGLE_PLAY_PRODUCTS = Object.freeze({
  life_coach: "virtus_life_coach",
  plus: "virtus_trainer",
  premium: "virtus_mentor",
});

const nativeBilling = registerPlugin("VirtusPlayBilling");

export function isVirtusPlayNativeAvailable() {
  return Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android" &&
    Capacitor.isPluginAvailable("VirtusPlayBilling");
}

// Only used after server-side purchase lifecycle and Google configuration are enabled.
export async function getVirtusPlayProducts() {
  if (!isVirtusPlayNativeAvailable()) throw new Error("This Android version does not support Google Play Billing.");
  return nativeBilling.getProducts();
}

export async function getVirtusPlayPurchases() {
  if (!isVirtusPlayNativeAvailable()) throw new Error("This Android version does not support Google Play Billing.");
  return nativeBilling.restorePurchases();
}

export async function beginVirtusPlayPurchase(appPlan, userId) {
  if (process.env.NEXT_PUBLIC_VIRTUS_GOOGLE_PLAY_BILLING_ENABLED !== "true") {
    throw new Error("Google Play subscriptions are not available yet.");
  }
  if (!isVirtusPlayNativeAvailable()) throw new Error("This Android build does not support Google Play Billing.");
  const productId = VIRTUS_GOOGLE_PLAY_PRODUCTS[appPlan];
  if (!productId || !userId) throw new Error("A valid membership and signed-in account are required.");
  const bytes = new TextEncoder().encode(userId);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const obfuscatedAccountId = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  // Google Play Billing opens its native checkout dialog.
  // Purchase success must be verified through the server, never trusted from the device.
  return nativeBilling.purchase({ productId, obfuscatedAccountId });
}

export async function observeVirtusPlayPurchases(callback) {
  if (!isVirtusPlayNativeAvailable()) throw new Error("Native billing is unavailable.");
  return nativeBilling.addListener("purchasesUpdated", callback);
}
