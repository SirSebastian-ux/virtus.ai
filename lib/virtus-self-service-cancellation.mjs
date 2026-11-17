// Never allow a personal billing action to modify organizational or other EWS subscriptions.
export function belongsToPersonalVirtusSubscription(subscription, userId, customerId) {
  const metadata = subscription?.metadata || {};
  const actualCustomer = typeof subscription?.customer === "string"
    ? subscription.customer : subscription?.customer?.id;
  return Boolean(
    userId &&
    customerId &&
    actualCustomer === customerId &&
    metadata.user_id === userId &&
    ["life_coach", "plus", "premium"].includes(metadata.virtus_plan) &&
    !metadata.organization_id
  );
}

export function subscriptionCancellationState(subscription) {
  const status = subscription?.status || "unknown";
  const end = subscription?.current_period_end
    ?? subscription?.items?.data?.[0]?.current_period_end
    ?? null;
  return {
    id: subscription.id,
    status,
    plan: subscription?.metadata?.virtus_plan || "",
    cancellationScheduled: Boolean(subscription?.cancel_at_period_end),
    cancelAt: subscription?.cancel_at_period_end ? (subscription?.cancel_at ?? end) : null,
    periodEnd: end,
    canCancel: ["active", "trialing", "past_due"].includes(status) && !subscription?.cancel_at_period_end,
  };
}
