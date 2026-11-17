import test from "node:test";
import assert from "node:assert/strict";
import {
  ORGANIZATION_PLAN,
  EMPLOYER_REPORT_ALLOWED_FIELDS,
  calculateMonthlySeatTotalCents,
  isOrganizationEmail,
} from "../lib/organizational-mentorship.js";

test("organization plan is $10 per active member monthly", () => {
  assert.equal(ORGANIZATION_PLAN.monthlySeatPriceCents, 1000);
  assert.equal(calculateMonthlySeatTotalCents(0), 0);
  assert.equal(calculateMonthlySeatTotalCents(25), 25000);
  assert.throws(() => calculateMonthlySeatTotalCents(-1), RangeError);
  assert.throws(() => calculateMonthlySeatTotalCents(1.5), RangeError);
});

test("organization email validation matches the exact approved domain", () => {
  assert.equal(isOrganizationEmail("Employee@Example.com", "example.com"), true);
  assert.equal(isOrganizationEmail("person@otherexample.com", "example.com"), false);
  assert.equal(isOrganizationEmail("person@example.com.attacker.org", "example.com"), false);
});

test("employer reporting contract excludes private conversations", () => {
  for (const field of ["messages", "conversation_content", "personal_assessment", "private_notes"]) {
    assert.equal(EMPLOYER_REPORT_ALLOWED_FIELDS.includes(field), false);
  }
});
