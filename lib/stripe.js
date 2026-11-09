import Stripe from "stripe";

// Do not require payment credentials during Next.js static build/module evaluation.
// Payment endpoints still fail closed when a request requires Stripe.
export const stripe = new Proxy({}, {
  get(_target, property) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
    const client = new Stripe(secret, { apiVersion: "2025-03-31.basil" });
    const value = client[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
