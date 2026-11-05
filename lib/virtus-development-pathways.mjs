/**
 * Virtus Cognitive Development curricula: skill acquisition by repeated practice
 * in progressively harder contexts, not diagnosis, psychotherapy, or an EWS book.
 * Each of 90 possible days has a unique technique × context assignment.
 * For seven-day pathways, users receive seven foundational exercises.
 */
const STEPS = Object.freeze([
  ["Describe the event", "Record one recent event using observable facts only.", "Which details could a neutral witness verify?"],
  ["Notice first meanings", "Record the first meaning your mind assigned before you responded.", "Which part of your description was interpretation, not observation?"],
  ["Name the response", "Identify the emotion, physical sensations and action urges without judging them.", "What did you feel and what did you want to do?"],
  ["Identify assumptions", "Examine the assumption that connected the event to your reaction.", "What belief would have to be true for your interpretation to be accurate?"],
  ["Test the evidence", "List two observations supporting and two observations challenging your initial interpretation.", "What can you actually establish, and what remains uncertain?"],
  ["Find alternatives", "Generate two realistic alternative explanations. Do not force yourself to endorse either.", "What else might account for the other person's behavior?"],
  ["Choose a response", "Choose one response consistent with your values, even if the original feeling persists.", "What action is yours to choose?"],
  ["Practice a pause", "Rehearse a brief pause before acting. Notice your internal commentary during it.", "What did the pause make possible?"],
  ["Reframe responsibly", "Rewrite your interpretation to reflect facts, uncertainty, and your own agency.", "How does the more balanced wording change the available options?"],
  ["Clarify the value", "Name the value you want your response to embody and distinguish it from winning an argument.", "Which principle matters more than the immediate impulse?"],
  ["Rehearse communication", "Say a respectful response aloud or write a realistic script. Keep it specific.", "What words express your intention without asserting the other person's motives?"],
  ["Listen actively", "Ask one genuine question and accurately reflect the other person's answer.", "What did you learn that your initial story left out?"],
  ["Set a boundary", "State one clear boundary, request or responsibility without a threat or accusation.", "What belongs to your control, and what requires another person's choice?"],
  ["Run an experiment", "Test one small alternative behavior in a real, appropriately safe situation.", "What actually happened compared with your prediction?"],
  ["Review consequences", "Examine the immediate and delayed effects of your action on yourself and the relationship.", "Which outcome supports repeating or adjusting the action?"],
  ["Seek feedback", "Request specific feedback from a trusted person where appropriate and safe.", "What evidence differs from your own impression?"],
  ["Repair and refine", "Where useful, acknowledge your part and formulate a proportionate repair or adjustment.", "What responsibility can you take without assuming responsibility for everyone?"],
  ["Integrate learning", "Compare this week's evidence with your baseline and set one next practice target.", "What have you demonstrated rather than merely intended?"],
]);
const CONTEXTS = Object.freeze([
  ["Personal awareness", "an ordinary private moment with low external pressure", "Describe what you notice without trying to control every feeling."],
  ["Close relationships", "a respectful disagreement or misunderstanding with someone close to you", "Prioritize mutual understanding and avoid mind-reading."],
  ["Work and collaboration", "a work task, team interaction or communication challenge", "Separate task requirements from personal worth."],
  ["Pressure and uncertainty", "a more demanding, uncertain or emotionally charged situation", "Apply the skill without sacrificing safety, boundaries or judgment."],
  ["Leadership and integration", "a consequential decision or a recurring pattern across situations", "Compare evidence across contexts and act with accountability."],
]);
const DOMAIN_LENSES = Object.freeze({
  self_awareness: "Observe the difference between what you notice, what you assume and what you choose.",
  emotional_regulation: "Notice emotion and body activation without treating emotion as a command.",
  communication: "Evaluate clarity, listening, tone and the impact of your words.",
  decision_making: "Identify alternatives, consequences, uncertainty and responsibility.",
  habits: "Notice cues, obstacles, repeatable actions and realistic follow-through.",
  leadership: "Consider decisions, authority, accountability and your impact on others.",
});
function safeFocus(goal) {
  return typeof goal?.desired_behavior === "string" ? goal.desired_behavior.slice(0, 220) : "";
}
export function developmentExercise(goal, completedCheckins = 0) {
  const duration = Number(goal?.program_days) || 7;
  const done = Number.isFinite(completedCheckins) ? Math.max(0, Math.floor(completedCheckins)) : 0;
  if (![7,30,60,90].includes(duration)) return null;
  if (done >= duration) return {
    completed: true, day: duration, duration, title: "Pathway completed",
    instruction: "Review your recorded evidence and decide whether to continue with a new goal.",
    question: "What specific change has your behavior demonstrated?",
  };
  const day = done + 1;
  const cycle = Math.floor((day - 1) / STEPS.length);
  const step = STEPS[(day - 1) % STEPS.length];
  const context = CONTEXTS[cycle];
  return {
    completed: false, day, duration,
    phase: context[0], title: step[0],
    instruction: `${step[1]} Apply this to ${context[1]}. ${context[2]}`,
    question: step[2],
    lens: DOMAIN_LENSES[goal?.focus_domain] || DOMAIN_LENSES.self_awareness,
    focus: safeFocus(goal),
    action: `Practice the ${step[0].toLowerCase()} skill once and describe what happened.`,
    methodology: "CBT-informed reflection, metacognition and behavioral rehearsal; educational coaching only.",
  };
}
export function programmeOutline(days, focusDomain = "self_awareness") {
  if (![7,30,60,90].includes(Number(days))) return [];
  const goal = { program_days: Number(days), focus_domain: focusDomain };
  return Array.from({ length: Number(days) }, (_, i) => developmentExercise(goal, i));
}
