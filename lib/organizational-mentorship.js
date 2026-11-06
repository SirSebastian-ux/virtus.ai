/**
 * Virtus AI Organizational Mentorship — initial product contract.
 * This module is deliberately separate from the legacy Operations workspace.
 * Billing, invitations and entitlement enforcement must be implemented server-side.
 */
export const ORGANIZATION_PLAN = Object.freeze({
  code: "organization_mentorship",
  currency: "usd",
  monthlySeatPriceCents: 1000,
  billingInterval: "month",
  seatUnit: "active_member",
  curriculum: Object.freeze([
    "leadership_architecture_10_modules",
    "architecture_of_the_conscious_mind_8_volumes",
  ]),
});

export const ORGANIZATION_ROLES = Object.freeze({
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
});

export const ORGANIZATION_MEMBER_STATUSES = Object.freeze({
  INVITED: "invited",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  REMOVED: "removed",
});

/** Employers may see enrollment and aggregate activity, never private coaching content. */
export const EMPLOYER_REPORT_ALLOWED_FIELDS = Object.freeze([
  "organization_id",
  "reporting_period",
  "licensed_seats",
  "active_seats",
  "invitation_count",
  "aggregate_module_completion",
  "aggregate_engagement",
]);

export function calculateMonthlySeatTotalCents(activeSeats) {
  if (!Number.isSafeInteger(activeSeats) || activeSeats < 0) {
    throw new RangeError("activeSeats must be a non-negative safe integer");
  }
  const total = activeSeats * ORGANIZATION_PLAN.monthlySeatPriceCents;
  if (!Number.isSafeInteger(total)) throw new RangeError("Seat total exceeds safe integer range");
  return total;
}

export function isOrganizationEmail(email, domain) {
  if (typeof email !== "string" || typeof domain !== "string") return false;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedDomain = domain.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9.-]+\\.[a-z]{2,}$/.test(normalizedDomain)) return false;
  const parts = normalizedEmail.split("@");
  return parts.length === 2 && parts[0].length > 0 && parts[1] === normalizedDomain;
}
