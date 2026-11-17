import test from "node:test";
import assert from "node:assert/strict";
import { belongsToPersonalVirtusSubscription, subscriptionCancellationState } from "../lib/virtus-self-service-cancellation.mjs";

const base = {
  id: "sub_verified",
  customer: "cus_approved",
  status: "active",
  current_period_end: 1800000000,
  metadata: { user_id: "usr_owner", virtus_plan: "premium" },
};

test("valid individual membership belongs only to correct authenticated owner", () => {
  assert.equal(belongsToPersonalVirtusSubscription(base, "usr_owner", "cus_approved"), true);
  assert.equal(belongsToPersonalVirtusSubscription(base, "usr_other", "cus_approved"), false);
  assert.equal(belongsToPersonalVirtusSubscription(base, "usr_owner", "cus_other"), false);
});
test("organizational and unrelated subscriptions are excluded", () => {
  assert.equal(belongsToPersonalVirtusSubscription({ ...base, metadata: { ...base.metadata, organization_id: "org_1" } }, "usr_owner", "cus_approved"), false);
  assert.equal(belongsToPersonalVirtusSubscription({ ...base, metadata: { user_id: "usr_owner", virtus_plan: "unknown" } }, "usr_owner", "cus_approved"), false);
  assert.equal(belongsToPersonalVirtusSubscription({ ...base, metadata: {} }, "usr_owner", "cus_approved"), false);
});
test("cancellation state preserves paid-through date", () => {
  const state = subscriptionCancellationState(base);
  assert.equal(state.canCancel, true);
  assert.equal(state.periodEnd, 1800000000);
  const canceled = subscriptionCancellationState({ ...base, cancel_at_period_end: true, cancel_at: 1800000000 });
  assert.equal(canceled.cancellationScheduled, true);
  assert.equal(canceled.canCancel, false);
  assert.equal(canceled.cancelAt, 1800000000);
});
test("expired membership does not present a new cancellation option", () => {
  assert.equal(subscriptionCancellationState({ ...base, status: "canceled" }).canCancel, false);
});
