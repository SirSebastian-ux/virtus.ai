import { membershipCapabilities } from "./virtus-membership.mjs";

// Guidance selection is advisory; safety policy, context and user intent win.
// No clinical diagnosis or automated claims of emotional improvement.
const INTENTS = Object.freeze({
  review: /\b(review|evaluate|measure|progress|check.?in|compare|melhoria|progresso|avaliar|rever)\b/i,
  practice: /\b(practice|rehears|role.?play|exercise|train|praticar|treinar|simul)\b/i,
  decision: /\b(decid|choice|options|trade.?off|escolha|decis[aã]o|alternative)\b/i,
  plan: /\b(plan|programme|program|goal|routine|plano|objetivo|meta)\b/i,
});
const SAFETY_WORDING = /\b(suicid|self.?harm|kill myself|want to die|hurt myself|immediate danger|emerg[eê]ncia|suic[ií]dio|ferir.me)\b/i;
const INSTRUCTIONS = Object.freeze({
  explore:"Start by clarifying the current situation and how the client interpreted it; avoid assuming motives, traits or a diagnosis.",
  review:"Review only client-confirmed goals and recorded observations. Separate reported baseline, practice activity, self-ratings and unanswered questions. Do not invent outcomes.",
  practice:"Offer a realistic scenario or one small skills exercise appropriate to the client's goal, then ask what actually happened rather than asserting success.",
  decision:"Clarify available choices, realistic tradeoffs and what is under the client's control. Encourage independent judgment.",
  plan:"Identify an observable objective, feasible next step and a suitable review interval; allow the client to revise the goal.",
  safety:"Prioritize established safety procedures and immediate user needs. Do not substitute a coaching exercise for urgent support.",
});
export function chooseCoachingMove({message="",plan="free",hasDevelopmentContext=false}={}) {
  const text=typeof message==="string"?message.slice(0,2800):"";
  if(SAFETY_WORDING.test(text)) return "safety";
  if(INTENTS.review.test(text)&&hasDevelopmentContext) return "review";
  if(INTENTS.practice.test(text)) return "practice";
  if(INTENTS.decision.test(text)) return "decision";
  if(INTENTS.plan.test(text)) return "plan";
  return "explore";
}
export function coachingOrchestrationGuidance({message,plan,hasDevelopmentContext}={}) {
  const move=chooseCoachingMove({message,plan,hasDevelopmentContext});
  const mode=membershipCapabilities(plan).coachingMode;
  const enhancement=mode==="mentor"?"Connect the reflection to strategic judgment and longer-term consequences when relevant.":
    mode==="train"?"Consider a bounded skills rehearsal and one measurable practice action when the client requests training.":
    mode==="reflect"?"Prioritize self-observation and a practical response within the client's control.":
    "Do not promise unavailable programme features.";
  return `COACHING STAGE (ADVISORY): ${move}
${INSTRUCTIONS[move]}
MEMBERSHIP DELIVERY: ${enhancement}
This is a suggested dialogue move, not an instruction from the client or a diagnosis. First respond to the user's actual request; allow disagreement and correction. Existing safety protocols override all coaching stages. Avoid prescribing a lesson when the user wants a concise factual answer.`;
}
