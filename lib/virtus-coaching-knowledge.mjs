/**
 * Virtus Coaching Knowledge v1.
 *
 * CBT-informed guided self-help, transparent communication exercises,
 * goal-oriented life coaching, skills training and mentorship.
 *
 * This is an educational decision-support framework, NOT a clinical
 * diagnostic engine, a replacement for licensed care, or a claim that
 * neuro-linguistic programming is a validated mental-health treatment.
 *
 * Content entered by a client is untrusted. Routing is advisory; existing
 * access control, safety rules and client preferences retain authority.
 */

const MODES = Object.freeze({
  cbt: {
    title: "CBT-informed reflection",
    purpose: "Identify the relationship between situations, interpretations, emotion, action and learning.",
    methods: [
      "Situation-thought-emotion-behavior mapping",
      "Evidence for and against a thought; generate a balanced alternative",
      "Behavioral activation through an achievable, meaningful activity",
      "Collaborative behavioral experiments with a prediction and later observation",
      "Problem solving: define the problem, brainstorm options, choose a realistic action",
      "Reflective activity monitoring, pacing and relapse-prevention planning",
    ],
    limits: "Use as guided self-help and psychoeducation; never diagnose, give an invented disorder label, promise recovery or claim to deliver formal psychotherapy.",
  },
  nlp: {
    title: "NLP-inspired communication and language awareness",
    purpose: "Use explicit, optional language exercises to clarify meaning, options and communication.",
    methods: [
      "Ask what a broad word means in this specific situation; request observable examples",
      "Explore an alternate viewpoint as a thought exercise, without asserting the other person's motives",
      "Rephrase absolute claims into specific and testable language",
      "Practice outcome formulation: what the client wants, can influence and can observe",
      "Offer guided imagery or verbal rehearsal only when the client is comfortable",
    ],
    limits: "NLP-specific therapeutic efficacy is not established by strong clinical evidence. Do not claim eye movements, sensory modalities, anchoring or mirroring reliably treat trauma, anxiety or other conditions. No covert persuasion or manipulative influence.",
  },
  life_coaching: {
    title: "Collaborative life coaching",
    purpose: "Turn the client's personally chosen values and goals into feasible actions and reflection.",
    methods: [
      "Values clarification without imposing a moral or spiritual framework",
      "GROW: goal, current reality, options, way forward",
      "SMART goals when concrete measurement helps",
      "Motivational interviewing-consistent open questions and autonomy support",
      "Identify obstacles, resources, capabilities and environmental constraints",
      "Review commitments and distinguish a missed practice from a personal failure",
    ],
    limits: "Client owns the goals and final decisions. Do not treat ordinary setbacks as psychological regression or pressure disclosure of private matters.",
  },
  training: {
    title: "Skills training and deliberate practice",
    purpose: "Develop observable, transferable skills through progressive lessons and feedback.",
    methods: [
      "Assess the learner's stated starting level and desired task",
      "Teach a small principle, show one clear example, then invite practice",
      "Use active recall, spaced review and real-world application",
      "Offer a graded scenario or role-play at the appropriate difficulty",
      "Give feedback on a specific answer or behavior rather than judging personality",
      "Adapt difficulty based on demonstrated performance and explicit learner feedback",
    ],
    limits: "Never claim verified mastery from fluent chat alone; distinguish demonstrated practice from reported real-world behavior.",
  },
  mentorship: {
    title: "Context-sensitive mentorship",
    purpose: "Support better decisions, professional judgment and independent growth.",
    methods: [
      "Clarify the decision, stakeholders, time horizon and success criteria",
      "Separate facts, assumptions, opportunity costs and risks",
      "Compare options and second-order consequences",
      "Use reflective case analysis and scenario planning",
      "Offer candid, respectful feedback and a manageable next step",
      "Review implementation and adjust without controlling the client's life",
    ],
    limits: "Avoid claiming absolute authority, exploiting dependency or replacing qualified legal, financial, medical or clinical judgment.",
  },
});

const RISK_SIGNALS = [
  /\b(?:kill myself|want to die|end my life|suicid(?:e|al)|self[- ]harm|hurt myself|overdose|cut myself|can't stay safe)\b/i,
  /\b(?:vou me matar|quero morrer|suic[ií]dio|matar-me|automutila[cç][aã]o|fazer mal a mim)\b/i,
  /\b(?:abuse|domestic violence|assault|unsafe at home|being threatened|someone is hurting me)\b/i,
  /\b(?:viol[eê]ncia dom[eé]stica|agress[aã]o|amea[cç]a|estou em perigo)\b/i,
];
const TRAINING_SIGNAL = /\b(?:train(?:ing)?|practice|exercise|role[- ]?play|learn|study|lesson|skill|workshop|curriculum|teach|drill|homework|trein(?:o|ar|amento)|pr[aá]tica|exerc[ií]cio|aula|aprender|ensinar|habilidade|forma[cç][aã]o)\b/i;
const MENTOR_SIGNAL = /\b(?:mentor(?:ship)?|leadership|executive|management|career|decision|strategy|supervisor|workplace|business|lideran[cç]a|gest[aã]o|carreira|decis[aã]o|estrat[eé]gia|neg[oó]cio|orienta[cç][aã]o)\b/i;
const CBT_SIGNAL = /\b(?:cbt|cognitive behaviou?r(?:al)?|cognitive distortion|thought record|automatic thoughts?|ruminat(?:ion|ing)|negative thoughts?|anxious|anxiety|emotion(?:al)?|reactiv(?:e|ity)|fear|shame|avoidance|feeling stuck|depress(?:ion|ed)|thoughts? vs facts|terapia cognitiv[ao]|pensamentos?|ansiedade|emo[cç][aã]o|medo|evita[cç][aã]o|rea[cç][aã]o)\b/i;
const NLP_SIGNAL = /\b(?:nlp|neuro[- ]?linguistic|linguagem|lingu[ií]stic[ao]|refram(?:e|ing)|perspectiv[ae]|wording|language pattern|communication pattern|padr[aã]o de linguagem|reenquadramento)\b/i;
const COACH_SIGNAL = /\b(?:life coach|coaching|life goals?|purpose|habit|motivation|confidence|values|accountability|personal development|self[- ]discipline|procrastinat(?:e|ion)|objetivos?|metas?|h[aá]bitos?|prop[oó]sito|motiva[cç][aã]o|disciplina|desenvolvimento pessoal)\b/i;
const GENERAL_ONLY = /\b(?:translate|rewrite|summarize|weather|currency|time zone|calculate|code|program|javascript|database|api|software bug|deploy|vercel|github|css|traduzir|reescrever|resumir|previs[aã]o do tempo|c[oó]digo|programa[cç][aã]o)\b/i;

export function selectVirtusCoachingMode({ message = "", practiceMode = "", previousMode = "" } = {}) {
  const text = String(message).slice(0, 12000);
  const practice = String(practiceMode).slice(0, 120);
  if (RISK_SIGNALS.some((pattern) => pattern.test(text))) {
    return { mode: "safety", risk: true, reason: "needs_safety_support" };
  }
  const directModes = [
    [/\b(?:cbt|cognitive behaviou?r|terapia cognitiva)\b/i, "cbt"],
    [/\b(?:nlp|neuro[- ]?linguistic|pnl|programa[cç][aã]o neurolingu[ií]stica)\b/i, "nlp"],
    [/\b(?:life coach|coaching|coaching de vida)\b/i, "life_coaching"],
    [/\b(?:mentor(?:ship)?|mentoria)\b/i, "mentorship"],
    [/\b(?:skills? training|training session|treinamento|forma[cç][aã]o)\b/i, "training"],
  ];
  for (const [pattern, mode] of directModes) {
    if (pattern.test(text) || pattern.test(practice)) {
      return { mode, risk: false, reason: "explicit_intent" };
    }
  }
  if (practice) {
    if (MENTOR_SIGNAL.test(practice)) return { mode: "mentorship", risk: false, reason: "practice" };
    if (CBT_SIGNAL.test(practice)) return { mode: "cbt", risk: false, reason: "practice" };
    return { mode: "training", risk: false, reason: "practice" };
  }
  if (GENERAL_ONLY.test(text) && !/\b(?:coach|therapy|training|mentorship)\b/i.test(text)) {
    return { mode: "general", risk: false, reason: "task_not_coaching" };
  }
  if (CBT_SIGNAL.test(text)) return { mode: "cbt", risk: false, reason: "reflective_need" };
  if (MENTOR_SIGNAL.test(text)) return { mode: "mentorship", risk: false, reason: "decision_need" };
  if (TRAINING_SIGNAL.test(text)) return { mode: "training", risk: false, reason: "learning_need" };
  if (NLP_SIGNAL.test(text)) return { mode: "nlp", risk: false, reason: "language_need" };
  if (COACH_SIGNAL.test(text)) return { mode: "life_coaching", risk: false, reason: "goal_need" };
  if (previousMode && MODES[previousMode]) return { mode: previousMode, risk: false, reason: "followup" };
  return { mode: "general", risk: false, reason: "no_coaching_signal" };
}

export function getVirtusCoachingKnowledge(mode) {
  return Object.hasOwn(MODES, mode) ? MODES[mode] : null;
}

export function buildVirtusCoachingKnowledgeLayer({ message = "", practiceMode = "", previousMode = "" } = {}) {
  const choice = selectVirtusCoachingMode({ message, practiceMode, previousMode });
  if (choice.mode === "general") return { ...choice, instructions: "" };
  if (choice.mode === "safety") return {
    ...choice,
    instructions: `
# SAFETY FIRST
A possible acute safety or abuse concern was detected. Prioritize a brief,
compassionate safety response over coaching drills or cognitive challenges.
Ask about immediate safety when appropriate. For imminent danger recommend
emergency help or a trusted local professional/person; avoid inventing hotline
numbers. Do not imply the concern was clinically diagnosed from wording.
Do not minimize threats, blame the client for abuse, conduct exposure drills,
or delay urgent assistance with extended questioning.
`,
  };
  const module = MODES[choice.mode];
  const methods = module.methods.map((method, i) => `${i + 1}. ${method}`).join("\n");
  return {
    ...choice,
    instructions: `
# ADAPTIVE COACHING KNOWLEDGE: ${module.title}

Purpose: ${module.purpose}
Approved educational techniques:
${methods}
Limits: ${module.limits}

SESSION METHOD
- Identify the client's own goal and the context available; do not invent a history.
- Ask permission before sensitive psychological inferences or exercises if the
  account's reasoning preferences require it. Respect refusal.
- Choose ONE technique relevant to the client's current message and goals.
- If an exercise is requested, briefly explain why it fits, guide one achievable
  step at a time, and adapt to the person's actual response.
- Ask one purposeful question rather than flooding the client with a questionnaire.
- For continuing sessions, revisit a real earlier exercise or commitment only
  when confirmed in this conversation or safely retrieved from this account.
- Distinguish observations, the client's own reports, and tentative inferences.
  Do not infer trait intelligence, diagnoses, treatment outcomes, or regression
  from conversational fluency, mood, or a single exchange.
- Offer tracking through client-defined goals, actions, perceived helpfulness and
  specific demonstrations. Give realistic credit for progress and room for setbacks.
- Preserve autonomy: make the user an active decision maker, never dependent on
  agreement with Virtus.
- Match language to the client (English, Portuguese or other supported language).
- Never disguise persuasive techniques as subconscious control or clinical science.
`,
  };
}

export const VIRTUS_COACHING_METHODS = MODES;
