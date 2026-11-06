import { randomBytes, createHash } from "node:crypto";

export const ORG_ROLES = Object.freeze(["owner","admin","member"]);
export const ORG_REPORT_MINIMUM_COHORT = 10;

export function validateOrganizationName(value) {
  const name=typeof value==="string" ? value.trim().replace(/\s+/g," ") : "";
  return name.length >= 3 && name.length <= 140 ? {value:name} :
    {error:"Organization name must contain 3 to 140 characters."};
}
export function normalizeInviteEmail(value) {
  const email=typeof value==="string" ? value.trim().toLowerCase() : "";
  if(email.length < 5 || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}
export function newOrganizationSlug(name) {
  const root=String(name).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,56) || "organization";
  return `${root}-${randomBytes(4).toString("hex")}`;
}
export function generateInviteToken() { return randomBytes(32).toString("hex"); }
export function digestInviteToken(token) {
  if(typeof token !=="string" || !/^[0-9a-f]{64}$/.test(token)) return null;
  return createHash("sha256").update(token,"utf8").digest("hex");
}
export function isOrgAdmin(membership) {
  return membership?.status==="active" && ["owner","admin"].includes(membership.role);
}
export function isBillableOrganization(org) {
  return org?.status==="active" && org?.billing_status==="active" &&
    Number.isInteger(org.seat_limit) && org.seat_limit>0;
}
export function countPaidSeats(memberships) {
  return (Array.isArray(memberships)?memberships:[]).filter(m=>m.status==="active"&&m.role==="member").length;
}
export function privacySafeOrganizationReport(rows, cohortSize, minimum=ORG_REPORT_MINIMUM_COHORT) {
  if(!Number.isInteger(cohortSize)||cohortSize<minimum) return {
    available:false,reason:"Minimum reporting cohort not met",minimumCohort:minimum,
  };
  // Participation metrics only. No individual psychological ratings, chat text, or goal titles.
  return {available:true,cohortSize,
    seatsActivated:(rows||[]).filter(r=>r?.status==="active"&&r?.role==="member").length,
    minimumCohort:minimum,
    disclosure:"Administrative participation data, not employee psychological or performance scores."};
}
