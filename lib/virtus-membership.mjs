/**
 * Canonical membership capabilities. Legacy billing keys stay unchanged.
 * Never authorize from client-supplied plan values: API reads the profile.
 */
const PLAN_CAPABILITIES = Object.freeze({
  free: Object.freeze({
    publicName: "No active membership", tagline: "Explore your account",
    maxActiveGoals: 0, programDays: [], coachingMode: "account_only",
    maxProjects: 3, canCreateDevelopmentGoals: false,
  }),
  trial_guest: Object.freeze({
    publicName: "Trial Guest", tagline: "Explore the Virtus experience",
    maxActiveGoals: 0, programDays: [], coachingMode: "trial",
    maxProjects: 1, canCreateDevelopmentGoals: false,
  }),
  life_coach: Object.freeze({
    publicName: "Life Coach", tagline: "Understand yourself",
    maxActiveGoals: 3, programDays: [7], coachingMode: "reflect",
    maxProjects: 3, canCreateDevelopmentGoals: true,
  }),
  plus: Object.freeze({
    publicName: "Trainer", tagline: "Develop your capabilities",
    maxActiveGoals: 10, programDays: [7, 30], coachingMode: "train",
    maxProjects: 5, canCreateDevelopmentGoals: true,
  }),
  premium: Object.freeze({
    publicName: "Mentor", tagline: "Master your decisions and direction",
    maxActiveGoals: 30, programDays: [7, 30, 60, 90], coachingMode: "mentor",
    maxProjects: null, canCreateDevelopmentGoals: true,
  }),
});
export const MEMBERSHIP_LEVELS = PLAN_CAPABILITIES;

export function membershipCapabilities(rawPlan) {
  const plan = typeof rawPlan === "string" ? rawPlan : "";
  return PLAN_CAPABILITIES[plan] || PLAN_CAPABILITIES.free;
}
export function canCreateGoal(plan, goals) {
  const capabilities = membershipCapabilities(plan);
  if (!capabilities.canCreateDevelopmentGoals) return false;
  const active = (Array.isArray(goals) ? goals : []).filter((goal) => goal.status === "active").length;
  return active < capabilities.maxActiveGoals;
}
export function canChooseProgram(plan, days) {
  return membershipCapabilities(plan).programDays.includes(Number(days));
}
export function canResumeGoal(plan, goals, requestedId) {
  const target = (Array.isArray(goals) ? goals : []).find((goal) => goal.id === requestedId);
  if (!target) return false;
  if (target.status === "active") return true;
  return canCreateGoal(plan, goals);
}
export function membershipConversationGuidance(plan) {
  const mode = membershipCapabilities(plan).coachingMode;
  if (mode === "reflect") return `LIFE COACH WORKFLOW — SELF-AWARENESS
First understand the situation and the client's interpretation. Explore one relevant belief, identify uncertainty, and help the client choose a reasonable next response. Offer basic reflection or a 7-day practice only when relevant. Do not invent psychological history or infer diagnoses. Do not withhold essential safety guidance on account of plan.`;
  if (mode === "train") return `TRAINER WORKFLOW — PRACTICE
Provide the same respectful and accurate conversation as Life Coach. When the client wants a skill, structure a realistic rehearsal, behavior experiment, role-play or 7/30-day development exercise. Elicit an observable goal and use client-reported evidence to review results. Never pretend a practice was completed without confirmation.`;
  if (mode === "mentor") return `MENTOR WORKFLOW — INTEGRATION AND JUDGMENT
Provide the same respectful and accurate conversation as all plans. When appropriate, integrate client-confirmed goals, strategic choices, consequence analysis, leadership simulations, accountability and sustained 7/30/60/90-day development programmes. Distinguish evidence from hypothesis; never claim to know private client patterns without supporting authorized context.`;
  return `Provide helpful, truthful, psychologically responsible basic conversation appropriate to the authorized account. Do not promise unavailable premium features.`;
}
