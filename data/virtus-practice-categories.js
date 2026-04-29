export const virtusPracticeCategories = [
  {
    id: "leadership-skills",
    title: "Leadership Skills",
    description: "Practice leadership awareness, responsibility, decision-making, and communication.",
    prompt:
      "I want to practice leadership skills. Start with one structured exercise and guide me step by step. Ask me one question at a time.",
    practiceMode: "category:leadership-skills",
    minimumPlan: "free",
  },
  {
    id: "executive-training",
    title: "Executive Training",
    description: "Use the internal leadership module system for deeper executive practice.",
    prompt:
      "I want to begin Executive Training. Use the internal leadership module library and guide me through the right exercise step by step. Ask me one question at a time.",
    practiceMode: "category:executive-training",
    minimumPlan: "premium",
  },
  {
    id: "emotional-intelligence",
    title: "Emotional Intelligence",
    description: "Practice emotional awareness, regulation, empathy, and mature response.",
    prompt:
      "I want to practice emotional intelligence. Guide me through one structured exercise. Ask me one question at a time.",
    practiceMode: "category:emotional-intelligence",
    minimumPlan: "free",
  },
  {
    id: "mind-discipline",
    title: "Mind Discipline",
    description: "Train thought observation, awareness, focus, and disciplined action.",
    prompt:
      "I want to practice mind discipline. Help me observe the thought behind my emotion or behavior. Ask me one question at a time.",
    practiceMode: "category:mind-discipline",
    minimumPlan: "free",
  },
  {
    id: "stress-regulation",
    title: "Stress Regulation",
    description: "Practice calming the nervous system and responding with clarity.",
    prompt:
      "I want to practice stress regulation. Start with one simple exercise and guide me step by step. Ask me one question at a time.",
    practiceMode: "category:stress-regulation",
    minimumPlan: "free",
  },
  {
    id: "anxiety-support",
    title: "Anxiety Support",
    description: "Practice thought clarity, grounding, and calmer interpretation.",
    prompt:
      "I want anxiety support. Help me identify the thought behind the anxiety and guide me through one safe structured exercise. Ask me one question at a time.",
    practiceMode: "category:anxiety-support",
    minimumPlan: "free",
  },
  {
    id: "mood-support",
    title: "Mood Support",
    description: "Practice gentle reflection, emotional clarity, and constructive next steps.",
    prompt:
      "I want mood support. Help me understand what thought may be affecting my mood and guide me through one simple exercise. Ask me one question at a time.",
    practiceMode: "category:mood-support",
    minimumPlan: "free",
  },
  {
    id: "habit-recovery-support",
    title: "Habit & Recovery Support",
    description: "Practice awareness, interruption, replacement, and responsibility.",
    prompt:
      "I want habit and recovery support. Help me identify the trigger, thought, urge, and next disciplined action. Ask me one question at a time.",
    practiceMode: "category:habit-recovery-support",
    minimumPlan: "plus",
  },
  {
    id: "relationships",
    title: "Relationships",
    description: "Practice emotional maturity, communication, boundaries, and repair.",
    prompt:
      "I want to practice relationship skills. Help me understand the situation clearly and guide me through one structured exercise. Ask me one question at a time.",
    practiceMode: "category:relationships",
    minimumPlan: "free",
  },
  {
    id: "assertive-communication",
    title: "Assertive Communication",
    description: "Practice clear, respectful, strong, and emotionally disciplined expression.",
    prompt:
      "I want to practice assertive communication. Help me turn my thoughts into a clear and respectful message. Ask me one question at a time.",
    practiceMode: "category:assertive-communication",
    minimumPlan: "free",
  },
  {
    id: "marriage-preparation",
    title: "Preparation for Marriage",
    description: "Practice readiness, values, communication, expectations, and commitment.",
    prompt:
      "I want to begin preparation for marriage. Guide me through one structured reflection exercise. Ask me one question at a time.",
    practiceMode: "category:marriage-preparation",
    minimumPlan: "plus",
  },
  {
    id: "spirituality",
    title: "Spirituality",
    description: "Practice inner truth, alignment, reflection, discipline, and meaning.",
    prompt:
      "I want to practice spirituality. Guide me through one grounded spiritual reflection exercise. Ask me one question at a time.",
    practiceMode: "category:spirituality",
    minimumPlan: "free",
  },
];

export function getPracticeCategoryById(id) {
  return virtusPracticeCategories.find((category) => category.id === id) || null;
}
