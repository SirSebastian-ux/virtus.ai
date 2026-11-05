/**
 * Small, evidence-aware practice pathway. One client-confirmed check-in
 * advances one day. These are skills practice, not clinical treatment.
 */
const CYCLE = Object.freeze([
  { title: "Observe", instruction: "Identify a real situation and describe what happened without assigning motive.", question: "What did you observe, and what interpretation did you add?" },
  { title: "Examine", instruction: "Explore the assumption underneath your first interpretation; notice plausible alternatives.", question: "What evidence supports your interpretation, and what could challenge it?" },
  { title: "Pause", instruction: "Before responding, create a deliberate pause and name the response you can choose.", question: "Where did you notice the opportunity to pause?" },
  { title: "Reframe", instruction: "Choose a more balanced and responsible interpretation without dismissing your experience.", question: "What alternative interpretation is both plausible and useful?" },
  { title: "Practice", instruction: "Attempt one small behavior that expresses your chosen response in a real situation.", question: "What did you actually do? What was the consequence?" },
  { title: "Communicate", instruction: "Express your intention clearly, listen, and notice your impact.", question: "How did your words affect the interaction?" },
  { title: "Review", instruction: "Review what happened and choose one adjustment for the next situation.", question: "Which response worked, and what would you do differently?" },
]);
const PHASES = Object.freeze(["Awareness", "Deliberate practice", "Application", "Integration"]);
export function developmentExercise(goal, completedCheckins = 0) {
  const duration = Number(goal?.program_days) || 7;
  const done = Number.isFinite(completedCheckins) ? Math.max(0, Math.floor(completedCheckins)) : 0;
  if (![7,30,60,90].includes(duration)) return null;
  if (done >= duration) return {
    completed: true, day: duration, duration,
    title: "Pathway completed",
    instruction: "Review your recorded experiences and choose whether to continue your development with a new goal.",
    question: "What evidence of changed behavior do you have?",
  };
  const day = done + 1;
  const cycle = CYCLE[(day - 1) % CYCLE.length];
  const phase = PHASES[Math.min(3, Math.floor((day - 1) / Math.max(1, duration / 4)))];
  return {
    completed: false, day, duration, phase,
    title: cycle.title,
    instruction: cycle.instruction,
    question: cycle.question,
    focus: typeof goal?.desired_behavior === "string" ? goal.desired_behavior.slice(0, 500) : "",
  };
}
