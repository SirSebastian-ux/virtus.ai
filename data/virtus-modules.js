export const virtusModules = [
  {
    id: "module-1",
    title: "Leadership Response Chain™",
    subtitle: "From thought to impact",
    duration: "7 days",
    coreSkill: "Response Awareness",
    rewardVp: 300,
    badge: "Response Awareness Foundation",
    chain: ["Thought", "Awareness", "Emotion", "Behavior", "Communication"],
    goal:
      "Help the user recognize the internal sequence behind leadership reactions before emotion becomes behavior and communication.",
    days: [
      {
        day: 1,
        title: "First Interpretation",
        goal: "Identify the first thought behind a leadership reaction.",
        exercises: [
          "Describe what happened.",
          "Write your first thought.",
          "Name the emotion that followed.",
          "Write how you behaved.",
          "Write how you communicated.",
        ],
        validation: [
          "User must describe a real situation.",
          "User must include a thought, not only a feeling.",
          "User must name at least one emotion.",
        ],
        fallbackQuestion:
          "What was the exact sentence in your mind?",
        vp: {
          start: 10,
          complete: 20,
          bonus: 10,
        },
      },
      {
        day: 2,
        title: "Full Chain Mapping",
        goal: "Map the complete leadership response from event to outcome.",
        exercises: [
          "Write the external event.",
          "Write the first thought.",
          "Write the emotion.",
          "Write the body reaction.",
          "Write the behavior.",
          "Write the communication.",
          "Write the final outcome.",
        ],
        validation: [
          "User must complete at least 5 parts of the chain.",
          "User must identify where awareness could have entered.",
        ],
        fallbackQuestion:
          "Where could you have paused before the reaction continued?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 3,
        title: "Emotional Activation",
        goal: "Recognize emotional trigger points before they control the response.",
        exercises: [
          "Identify one emotional moment.",
          "Name the first emotion.",
          "Locate it in the body.",
          "Identify the belief underneath it.",
          "Write a more regulated response.",
        ],
        validation: [
          "User must name the emotion clearly.",
          "User must connect emotion to a belief or interpretation.",
          "User must describe a regulated alternative.",
        ],
        fallbackQuestion:
          "What belief was underneath that emotion?",
        vp: {
          complete: 25,
          bonus: 10,
        },
      },
      {
        day: 4,
        title: "Blame Detection",
        goal: "Recognize when blame enters the leadership response chain.",
        exercises: [
          "Describe the situation.",
          "Write the first blaming thought.",
          "Identify who or what the mind blamed.",
          "Name the emotion that followed.",
          "Write what became less clear because blame was present.",
        ],
        validation: [
          "User must identify the blame direction.",
          "User must separate event from interpretation.",
        ],
        fallbackQuestion:
          "What did your mind decide before all facts were clear?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 5,
        title: "Leadership Identity Pattern",
        goal: "Identify repeated leadership identity patterns under pressure.",
        exercises: [
          "Complete: I am the one who...",
          "Complete: I always...",
          "Complete: I never...",
          "Identify when this pattern helps.",
          "Identify when this pattern creates tension.",
        ],
        validation: [
          "User must write at least 3 identity statements.",
          "User must identify one helpful side and one limiting side.",
        ],
        fallbackQuestion:
          "Which role do you enter under pressure: controller, fixer, rescuer, critic, or avoider?",
        vp: {
          complete: 25,
          bonus: 15,
        },
      },
      {
        day: 6,
        title: "Awareness Gap",
        goal: "Practice a pause before reacting.",
        exercises: [
          "Describe one moment of pressure.",
          "Write what you felt first.",
          "Insert a two-second pause.",
          "Write what response you chose.",
          "Compare reaction versus disciplined response.",
        ],
        validation: [
          "User must describe an actual pause or missed pause.",
          "User must compare impulse with chosen response.",
        ],
        fallbackQuestion:
          "What would you normally have done automatically?",
        vp: {
          record: 20,
          complete: 30,
        },
      },
      {
        day: 7,
        title: "Integration Review",
        goal: "Review the full week and choose one response pattern to improve.",
        exercises: [
          "Write what you learned about your Leadership Response Chain.",
          "Identify your most common trigger.",
          "Identify one repeated leadership pattern.",
          "Identify where you still struggle to pause.",
          "Complete: Next week, I will improve...",
        ],
        validation: [
          "User must identify one trigger.",
          "User must identify one pattern.",
          "User must create one clear commitment.",
        ],
        fallbackQuestion:
          "What is the one response pattern you will improve next week?",
        vp: {
          complete: 50,
          moduleBonus: 50,
        },
      },
    ],
  },
  {
    id: "module-2",
    order: 2,
    title: "Accountability Discipline & Ownership™",
    displayTitle: "Responsibility vs. Blame",
    subtitle: "From reactive justification to conscious ownership",
    duration: "7 days",
    coreSkill: "Ownership Discipline",
    rewardVp: 350,
    badge: "Ownership Standard Builder",
    chain: ["Trigger", "Blame", "Awareness", "Ownership", "Corrective Action"],
    goal:
      "Help the user shift from blame, defensiveness, and external justification into conscious ownership, influence, and disciplined responsibility.",
    completionRequirements: [
      "Complete all 7 days",
      "Complete the Ownership Scorecard",
      "Create one 30-day ownership standard",
    ],
    days: [
      {
        day: 1,
        title: "Blame Listening",
        goal: "Detect blame in internal leadership dialogue.",
        exercises: [
          "Describe one frustrating situation.",
          "Write the first internal sentence.",
          "Identify who or what your mind blamed.",
          "Write what was within your influence.",
        ],
        validation: [
          "User must describe a real situation.",
          "User must identify the first internal sentence.",
          "User must name where responsibility was placed.",
        ],
        fallbackQuestion: "What did your mind blame first?",
        vp: {
          start: 10,
          complete: 20,
          bonus: 10,
        },
      },
      {
        day: 2,
        title: "Defensive Reaction Log",
        goal:
          "Recognize when defensiveness protects identity instead of strengthening leadership.",
        exercises: [
          "Describe one moment you felt defensive.",
          "Write the first thought.",
          "Identify what part of your identity felt threatened.",
          "Write what you could say without defensiveness.",
        ],
        validation: [
          "User must identify a defensive moment.",
          "User must connect defensiveness to identity.",
          "User must write a non-defensive alternative.",
        ],
        fallbackQuestion: "What were you trying to protect in that moment?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 3,
        title: "Influence Mapping",
        goal: "Shift from external focus to internal influence.",
        exercises: [
          "Describe one frustrating situation.",
          "List what was outside your control.",
          "List what was within your control.",
          "List what was within your influence.",
          "Choose one corrective action.",
        ],
        validation: [
          "User must separate control, influence, and outside factors.",
          "User must choose one action.",
        ],
        fallbackQuestion: "What is one action still available to you?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 4,
        title: "Ownership Language",
        goal: "Replace blame language with ownership language.",
        exercises: [
          "Write one blame-based sentence.",
          "Rewrite it using ownership language.",
          "Remove exaggeration or accusation.",
          "Add one responsibility-based adjustment.",
        ],
        validation: [
          "User must provide one original blame statement.",
          "User must rewrite it clearly.",
          "User must avoid always, never, and accusation language.",
        ],
        fallbackQuestion:
          "How can you say this with responsibility instead of accusation?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 5,
        title: "Emotional Responsibility",
        goal: "Separate emotion from justification.",
        exercises: [
          "Describe one emotionally charged situation.",
          "Name the emotion.",
          "Write the story your mind created.",
          "Write how you justified your reaction.",
          "Write one regulated alternative response.",
        ],
        validation: [
          "User must name the emotion.",
          "User must separate emotion from story.",
          "User must identify the justification.",
          "User must create a regulated alternative.",
        ],
        fallbackQuestion:
          "Did the emotion explain your reaction, or justify it?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 6,
        title: "Balanced Responsibility",
        goal: "Practice ownership without self-criticism.",
        exercises: [
          "Describe one mistake or misstep.",
          "Write what happened objectively.",
          "Identify your contribution.",
          "Write one correction for next time.",
          "Remove any self-condemning language.",
        ],
        validation: [
          "User must describe behavior, not attack identity.",
          "User must identify one contribution.",
          "User must create one correction.",
        ],
        fallbackQuestion:
          "Are you correcting behavior, or attacking identity?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 7,
        title: "Ownership Standard",
        goal: "Install ownership as a consistent leadership standard.",
        exercises: [
          "Write three blame patterns you will reduce.",
          "Write three ownership behaviors you will practice.",
          "Create one 30-day leadership ownership standard.",
          "Write one situation where you will apply it.",
        ],
        validation: [
          "User must identify three blame patterns.",
          "User must identify three ownership behaviors.",
          "User must create one clear standard.",
        ],
        fallbackQuestion:
          "What ownership behavior will you practice for the next 30 days?",
        vp: {
          complete: 40,
          moduleBonus: 20,
        },
      },
    ],
    assessment: {
      id: "ownership-scorecard",
      title: "Ownership Scorecard",
      instruction:
        "Rate yourself from 1 to 5 based on your behavior during the past week.",
      scale: {
        min: 1,
        max: 5,
      },
      dimensions: [
        "Blame Awareness",
        "Defensiveness Control",
        "Internal Locus of Control",
        "Ownership Language",
        "Emotional Regulation",
        "Balanced Responsibility",
        "Influence-Focused Thinking",
        "Leadership Accountability",
        "Learning Orientation",
        "Ownership Consistency",
      ],
      maxScore: 50,
      vp: {
        complete: 30,
        bonus: 20,
      },
    },
  },
  {
    id: "module-3",
    order: 3,
    title: "Emotional Trigger Awareness & Response Control™",
    displayTitle: "Trigger Mapping & Emotional Patterns",
    subtitle: "Decoding emotional activation",
    duration: "7 days",
    coreSkill: "Emotional Regulation",
    rewardVp: 350,
    badge: "Trigger Regulation Builder",
    chain: [
      "Trigger",
      "Story",
      "Emotion",
      "Behavior",
      "Consequence",
      "Regulated Response",
    ],
    goal:
      "Help the user identify emotional triggers, uncover the stories beneath them, map repeated reaction loops, and build structured response control.",
    completionRequirements: [
      "Complete all 7 days",
      "Identify primary leadership triggers",
      "Create one Trigger Regulation Blueprint",
    ],
    days: [
      {
        day: 1,
        title: "Primary Leadership Triggers",
        goal: "Identify recurring situations that activate emotional responses.",
        exercises: [
          "Describe one situation that activated you.",
          "Identify the specific trigger.",
          "Name the first emotion.",
          "Write the thought that followed.",
          "Describe how you responded.",
        ],
        validation: [
          "User must describe a real leadership situation.",
          "User must identify the trigger, not only the emotion.",
          "User must name the first emotion clearly.",
        ],
        fallbackQuestion:
          "What specifically activated you in that situation?",
        vp: {
          start: 10,
          complete: 25,
          bonus: 10,
        },
      },
      {
        day: 2,
        title: "Root Emotion",
        goal: "Identify the deeper emotion beneath the visible reaction.",
        exercises: [
          "Describe what happened.",
          "Write the emotion you showed externally.",
          "Write the emotion you felt internally.",
          "Identify the fear or vulnerability beneath it.",
          "Write the belief that was activated.",
        ],
        validation: [
          "User must separate surface emotion from deeper emotion.",
          "User must identify one fear, uncertainty, or vulnerability.",
          "User must connect the emotion to a belief.",
        ],
        fallbackQuestion:
          "What emotion was underneath the visible reaction?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 3,
        title: "Trigger Story Mapping",
        goal: "Recognize the internal story that sustains emotional activation.",
        exercises: [
          "Describe the triggering event.",
          "Write the immediate story your mind created.",
          "Name the emotion that followed.",
          "Describe the behavior that resulted.",
          "Write one balanced alternative interpretation.",
        ],
        validation: [
          "User must identify the internal story clearly.",
          "User must separate fact from interpretation.",
          "User must create one balanced alternative interpretation.",
        ],
        fallbackQuestion:
          "What story did your mind create after the trigger?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 4,
        title: "Reaction Loop",
        goal: "Map the full loop from trigger to consequence.",
        exercises: [
          "Write the trigger.",
          "Write the interpretation.",
          "Name the dominant emotion.",
          "Describe the behavior.",
          "Write the consequence.",
          "Identify where you could insert a pause.",
          "Choose one better response.",
        ],
        validation: [
          "User must complete the trigger, interpretation, emotion, behavior, and consequence sequence.",
          "User must identify one intervention point.",
          "User must choose one alternative behavior.",
        ],
        fallbackQuestion:
          "Where in the loop could you interrupt the reaction?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 5,
        title: "Identity Sensitivity",
        goal: "Identify which leadership identity attachments intensify emotional reactions.",
        exercises: [
          "Write three leadership standards you hold strongly.",
          "Identify which standard feels threatened under pressure.",
          "Write what emotion appears when it is challenged.",
          "Identify whether it is a value or a rigid identity rule.",
          "Rewrite it with more flexibility.",
        ],
        validation: [
          "User must identify at least one leadership standard.",
          "User must connect the standard to emotional activation.",
          "User must distinguish value from rigid identity rule.",
        ],
        fallbackQuestion:
          "What part of your leadership identity felt threatened?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 6,
        title: "Trigger Forecast",
        goal: "Predict emotional activation before it happens.",
        exercises: [
          "Identify one upcoming situation that may activate you.",
          "Write the likely trigger.",
          "Write the likely story your mind may create.",
          "Name the emotion that may follow.",
          "Identify the physical warning signal.",
          "Choose the response you will practice.",
        ],
        validation: [
          "User must identify a future situation.",
          "User must forecast trigger, story, emotion, and physical signal.",
          "User must choose a regulated response in advance.",
        ],
        fallbackQuestion:
          "What upcoming situation is most likely to activate you?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 7,
        title: "Trigger Regulation Blueprint",
        goal: "Create a structured response plan for one recurring trigger.",
        exercises: [
          "Write your recurring trigger.",
          "Write your early warning signs.",
          "Name the primary emotion.",
          "Write the automatic story.",
          "Create a new reframe.",
          "Choose the new behavior you will practice.",
          "Write your reset strategy if escalation begins.",
        ],
        validation: [
          "User must identify one recurring trigger.",
          "User must create a reframe.",
          "User must choose one new behavior.",
          "User must define one reset strategy.",
        ],
        fallbackQuestion:
          "What new behavior will replace the old reaction?",
        vp: {
          complete: 50,
          moduleBonus: 50,
        },
      },
    ],
    blueprint: {
      id: "trigger-regulation-blueprint",
      title: "Trigger Regulation Blueprint",
      fields: [
        "My Trigger",
        "Early Warning Signs",
        "Primary Emotion",
        "Automatic Story",
        "New Reframe",
        "New Behavior I Will Practice",
        "Reset Strategy if I Escalate",
      ],
      vp: {
        complete: 30,
        bonus: 20,
      },
    },
  },
  {
    id: "module-4",
    order: 4,
    title: "Leadership Self-Perception & Judgment Gaps™",
    displayTitle: "Leadership Identity & Blind Spots",
    subtitle: "Strengthening self-awareness, perception accuracy, and behavioral alignment",
    duration: "7 days",
    coreSkill: "Leadership Self-Awareness",
    rewardVp: 350,
    badge: "Leadership Alignment Builder",
    chain: [
      "Identity",
      "Intention",
      "Impact",
      "Feedback",
      "Calibration",
      "Alignment",
    ],
    goal:
      "Help the user examine leadership identity, detect blind spots, compare intention with impact, and refine behavior for stronger alignment.",
    completionRequirements: [
      "Complete all 7 days",
      "Create one refined leadership identity statement",
      "Complete the Identity & Blind Spots Scorecard",
    ],
    days: [
      {
        day: 1,
        title: "Leadership Identity",
        goal: "Define your current leadership identity clearly.",
        exercises: [
          "Write who you are as a leader.",
          "List three strengths that define you.",
          "List three values you stand by.",
          "Identify one quality others rely on most.",
          "Notice which part of your identity you defend quickly.",
        ],
        validation: [
          "User must write a leadership identity statement.",
          "User must identify at least three strengths.",
          "User must identify at least three values.",
        ],
        fallbackQuestion:
          "How do you currently define yourself as a leader?",
        vp: {
          start: 10,
          complete: 25,
          bonus: 10,
        },
      },
      {
        day: 2,
        title: "Intention vs. Impact",
        goal: "Compare how you intend to lead with how others may experience your behavior.",
        exercises: [
          "Write one leadership strength you identify with.",
          "Describe how that strength may be experienced negatively.",
          "Write one recurring reaction you notice from others.",
          "Identify what behavior of yours may contribute to that reaction.",
          "Write one adjustment that would improve impact.",
        ],
        validation: [
          "User must identify one strength.",
          "User must compare intention with possible impact.",
          "User must identify one behavior to adjust.",
        ],
        fallbackQuestion:
          "How might others experience your behavior differently from what you intended?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 3,
        title: "Feedback Patterns",
        goal: "Identify repeated feedback themes that may reveal leadership blind spots.",
        exercises: [
          "Write three pieces of feedback you have received.",
          "Identify the theme connecting them.",
          "Write what behavior may contribute to the pattern.",
          "Notice if you tend to dismiss this feedback.",
          "Choose one recurring pattern that deserves attention.",
        ],
        validation: [
          "User must identify at least two feedback examples.",
          "User must look for repetition or common themes.",
          "User must choose one pattern for deeper attention.",
        ],
        fallbackQuestion:
          "What feedback have you received more than once?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 4,
        title: "Strength Calibration",
        goal: "Identify when a leadership strength becomes excessive or unhelpful.",
        exercises: [
          "Write your top three leadership strengths.",
          "Describe when each strength works best.",
          "Describe when each strength becomes excessive.",
          "Write how others may experience it when amplified.",
          "Choose one strength that needs better calibration.",
        ],
        validation: [
          "User must identify three strengths.",
          "User must explain when one strength becomes excessive.",
          "User must choose one strength to calibrate.",
        ],
        fallbackQuestion:
          "Which strength becomes a liability when pressure increases?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 5,
        title: "Ego Defense",
        goal: "Recognize how self-image defense appears during criticism, disagreement, or challenge.",
        exercises: [
          "Describe one moment of criticism or correction.",
          "Write your immediate internal reaction.",
          "Write what you said externally.",
          "Identify what part of your identity felt threatened.",
          "Write what you might see more clearly without defense.",
        ],
        validation: [
          "User must describe a real correction or disagreement.",
          "User must identify the internal defense.",
          "User must identify the threatened self-image.",
        ],
        fallbackQuestion:
          "What part of your self-image felt threatened in that moment?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 6,
        title: "External Mirror",
        goal: "Use trusted external perspective to reduce blind spots.",
        exercises: [
          "Choose one trusted person who can reflect your leadership impact.",
          "Ask one clear feedback question.",
          "Listen without defending or explaining.",
          "Write the feedback you received.",
          "Write what this perspective helped you see.",
        ],
        validation: [
          "User must identify an external mirror or review past feedback.",
          "User must write one feedback question or one received insight.",
          "User must reflect without immediate defense.",
        ],
        fallbackQuestion:
          "Who can give you honest feedback about your leadership impact?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 7,
        title: "Refined Leadership Identity",
        goal: "Create a more balanced and accurate leadership identity.",
        exercises: [
          "Write your previous leadership identity.",
          "Write your refined leadership identity.",
          "Identify one strength you will moderate.",
          "Identify one behavior you will adjust.",
          "Identify one value you will express more clearly.",
        ],
        validation: [
          "User must write a previous identity statement.",
          "User must write a refined identity statement.",
          "User must identify one behavior adjustment.",
        ],
        fallbackQuestion:
          "What is the more mature version of your leadership identity?",
        vp: {
          complete: 50,
          moduleBonus: 50,
        },
      },
    ],
    assessment: {
      id: "identity-blind-spots-scorecard",
      title: "Identity & Blind Spots Scorecard",
      instruction:
        "Rate yourself from 1 to 5 based on your leadership behavior during the past week.",
      scale: {
        min: 1,
        max: 5,
      },
      dimensions: [
        "Identity Awareness",
        "Intention vs. Impact Awareness",
        "Feedback Pattern Recognition",
        "Strength Calibration",
        "Ego Defense Awareness",
        "Perspective Expansion",
        "Behavioral Alignment",
        "Relational Awareness",
        "Blind Spot Responsiveness",
        "Identity Refinement",
      ],
      maxScore: 50,
      interpretation: [
        {
          min: 40,
          max: 50,
          label: "High Leadership Self-Awareness",
          meaning:
            "You demonstrate strong awareness of how identity influences behavior and how behavior influences others.",
        },
        {
          min: 30,
          max: 39,
          label: "Developing Leadership Alignment",
          meaning:
            "You show growing awareness of identity, impact, and blind spots, but greater consistency is still needed.",
        },
        {
          min: 20,
          max: 29,
          label: "Partial Awareness / Blind Spot Risk",
          meaning:
            "Some patterns of self-perception and external impact may still remain unexamined.",
        },
        {
          min: 0,
          max: 19,
          label: "Significant Perception Gap",
          meaning:
            "Leadership self-image may still be stronger than leadership accuracy.",
        },
      ],
      reflectionQuestions: [
        "One leadership identity strength I use well:",
        "One blind spot I need to continue examining:",
        "One behavior I will adjust to improve alignment:",
      ],
      vp: {
        complete: 30,
        bonus: 20,
      },
    },
  },
  {
    id: "module-5",
    order: 5,
    title: "Cognitive Awareness & Thought Observation™",
    displayTitle: "Awareness & Thought Observation",
    subtitle: "Cognitive stability and decision clarity",
    duration: "7 days",
    coreSkill: "Cognitive Stability",
    rewardVp: 350,
    badge: "Thought Observation Builder",
    chain: [
      "Situation",
      "Interpretation",
      "Emotion",
      "Reaction",
      "Communication",
      "Outcome",
    ],
    goal:
      "Help the user observe thoughts, detect emotional activation, recognize automatic reactions, create a cognitive pause, and strengthen decision clarity under pressure.",
    completionRequirements: [
      "Complete all 7 days",
      "Create one Personal Observation Map",
      "Write one awareness practice commitment",
    ],
    days: [
      {
        day: 1,
        title: "Thought Precision",
        goal: "Observe interpretations before they become leadership responses.",
        exercises: [
          "Describe one work situation.",
          "Write the meaning your mind assigned to it.",
          "Name the emotion that followed.",
          "Describe what you did or said.",
          "Review whether the interpretation was fact, assumption, or emotionally amplified.",
        ],
        validation: [
          "User must describe a real situation.",
          "User must identify the interpretation.",
          "User must distinguish fact from assumption or emotional amplification.",
        ],
        fallbackQuestion:
          "What interpretation did your mind form before you responded?",
        vp: {
          start: 10,
          complete: 25,
          bonus: 10,
        },
      },
      {
        day: 2,
        title: "Emotional Activation Detection",
        goal: "Detect emotional activation before it accelerates the response.",
        exercises: [
          "Describe one situation that activated you.",
          "Identify the activation point.",
          "Name the first emotion.",
          "Describe how you reacted or communicated.",
          "Review whether you noticed the activation early, late, or afterward.",
        ],
        validation: [
          "User must identify the activation point.",
          "User must name the first emotion.",
          "User must identify when they noticed the activation.",
        ],
        fallbackQuestion:
          "What activated inside you before your response changed?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 3,
        title: "Automatic Reaction Recognition",
        goal: "Recognize automatic reactions as they begin.",
        exercises: [
          "Describe one workplace interaction.",
          "Identify what triggered your reaction.",
          "Write what you felt ready to say or do.",
          "Describe how the interaction unfolded.",
          "Review whether you noticed the reaction before, during, or after it happened.",
        ],
        validation: [
          "User must identify the trigger.",
          "User must identify the automatic reaction.",
          "User must state when the reaction became visible.",
        ],
        fallbackQuestion:
          "What reaction was starting in you before you fully chose it?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 4,
        title: "Cognitive Pause",
        goal: "Create a brief pause before responding.",
        exercises: [
          "Describe one challenging situation.",
          "Write your first internal conclusion or impulse.",
          "State whether you created a pause.",
          "Write what you said or did after the pause.",
          "Review whether the pause improved your response.",
        ],
        validation: [
          "User must describe the initial impulse.",
          "User must state whether they paused.",
          "User must compare the response before and after the pause.",
        ],
        fallbackQuestion:
          "What would have happened if you responded without pausing?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 5,
        title: "Communication Self-Monitoring",
        goal: "Maintain internal observation while communicating.",
        exercises: [
          "Describe one important conversation.",
          "Write what you said and how you delivered it.",
          "Identify your internal state during the conversation.",
          "Describe how the other person or team responded.",
          "Review whether your internal state affected tone, pacing, listening, or clarity.",
        ],
        validation: [
          "User must describe a real communication moment.",
          "User must identify internal state.",
          "User must connect internal state to communication quality.",
        ],
        fallbackQuestion:
          "How did your internal state affect your tone or delivery?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 6,
        title: "Stress Self-Monitoring",
        goal: "Notice how stress changes thinking before it changes behavior.",
        exercises: [
          "Describe one stressful situation.",
          "Identify the stress signal.",
          "Write the first thought or conclusion that appeared.",
          "Describe how you reacted or communicated.",
          "Review whether you noticed the stress signal early, during, or afterward.",
        ],
        validation: [
          "User must identify a stress signal.",
          "User must connect stress to thought or behavior.",
          "User must state when the signal became visible.",
        ],
        fallbackQuestion:
          "What changed inside you when the pressure increased?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 7,
        title: "Personal Observation Map",
        goal: "Integrate thought observation into a consistent leadership discipline.",
        exercises: [
          "Write common interpretations you observed.",
          "Write situations that activated strong reactions.",
          "Write automatic reactions you identified.",
          "Write practices that helped you create a pause.",
          "Write communication changes you noticed.",
          "Choose one awareness practice to continue applying.",
        ],
        validation: [
          "User must identify at least one common interpretation.",
          "User must identify at least one automatic reaction.",
          "User must choose one awareness practice to continue.",
        ],
        fallbackQuestion:
          "Which awareness practice will you continue applying in your leadership role?",
        vp: {
          complete: 50,
          moduleBonus: 50,
        },
      },
    ],
    integrationMap: {
      id: "personal-observation-map",
      title: "Personal Observation Map",
      fields: [
        "Common Interpretations I Observed",
        "Situations That Activated Strong Reactions",
        "Automatic Reactions I Identified",
        "Practices That Helped Me Create a Pause",
        "Communication Changes I Noticed",
      ],
      commitmentFields: [
        "Awareness practice I will continue applying",
        "Situations where I will apply this practice",
        "How I will remind myself to pause and observe my internal response",
        "How this will improve my leadership effectiveness",
      ],
      vp: {
        complete: 30,
        bonus: 20,
      },
    },
  },
  {
    id: "module-6",
    order: 6,
    title: "Operational Decision Architecture™",
    displayTitle: "Operational Decision Architecture",
    subtitle: "Behavioral risk, decision quality, and performance under pressure",
    duration: "30 days",
    coreSkill: "Decision Stability Under Pressure",
    rewardVp: 1200,
    badge: "Operational Stability Builder",
    chain: [
      "Pressure",
      "Interpretation",
      "Activation",
      "Decision",
      "Communication",
      "Behavior",
      "Operational Outcome",
    ],
    goal:
      "Help the user strengthen decision stability, emotional regulation, behavioral discipline, and operational leadership consistency under pressure.",
    completionRequirements: [
      "Complete all 30 days",
      "Complete weekly calibration reviews",
      "Create one Personal Regulation System",
      "Complete the Integrated Operational Stability Index",
    ],
    weeks: [
      {
        week: 1,
        title: "Cognitive Interception & Impulse Awareness",
        focus:
          "Recognize internal activation early enough to protect decision quality under pressure.",
      },
      {
        week: 2,
        title: "Emotional Escalation Regulation Under Pressure",
        focus:
          "Detect physiological activation, escalation thresholds, and reset regulation under operational load.",
      },
      {
        week: 3,
        title: "Behavioral Output & Leadership Response Discipline",
        focus:
          "Translate internal regulation into visible leadership behavior, correction quality, and escalation containment.",
      },
      {
        week: 4,
        title: "Operational Integration & Leadership Alignment",
        focus:
          "Extend personal regulation into team stability, decision integrity, and repeatable operational standards.",
      },
    ],
    days: [
      {
        day: 1,
        title: "Early Decision Distortion",
        goal: "Notice when pressure begins to shape judgment before it shapes response.",
        exercises: [
          "Describe one operational situation.",
          "Write the first internal pressure signal.",
          "Identify the meaning or risk you assigned.",
          "Name the pressure activation that followed.",
          "Describe what you did or said.",
        ],
        validation: [
          "User must describe a real operational situation.",
          "User must identify the first internal pressure signal.",
          "User must connect pressure to judgment or response.",
        ],
        fallbackQuestion:
          "Where did pressure first begin to shape your judgment?",
        vp: {
          start: 10,
          complete: 25,
          bonus: 10,
        },
      },
      {
        day: 2,
        title: "Repeated Decision Distortions",
        goal: "Identify repeated judgment patterns that distort decisions under pressure.",
        exercises: [
          "Describe one pressure situation.",
          "Write the first automatic assessment.",
          "Choose the distortion type.",
          "Name the pressure activation that followed.",
          "Describe what you did or said.",
        ],
        validation: [
          "User must identify a repeated distortion.",
          "User must choose from control amplification, threat interpretation, urgency distortion, or attribution bias.",
          "User must connect the distortion to response quality.",
        ],
        fallbackQuestion:
          "Which repeated distortion shaped your judgment in that moment?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 3,
        title: "Operational Escalation Conditions",
        goal: "Map operational conditions that increase escalation risk.",
        exercises: [
          "Describe the operational condition.",
          "Write the risk meaning you attached to it.",
          "Identify the early escalation signal.",
          "Describe your response.",
          "Choose the escalation category.",
        ],
        validation: [
          "User must identify an operational condition.",
          "User must name the risk meaning attached to it.",
          "User must choose a category such as authority challenge, performance deviation, time compression, communication failure, or accountability friction.",
        ],
        fallbackQuestion:
          "What operational condition increased your pressure first?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 4,
        title: "Escalation Sequence",
        goal: "Recognize escalation as a sequence before it becomes visible behavior.",
        exercises: [
          "Write the operational condition.",
          "Write the internal assessment.",
          "Name the pressure activation.",
          "Identify the tone, posture, or pacing shift.",
          "Describe the response.",
          "Describe the outcome.",
          "Identify where regulation could enter earlier.",
        ],
        validation: [
          "User must complete the escalation sequence.",
          "User must identify one point of earlier regulation.",
          "User must connect internal activation to visible behavior.",
        ],
        fallbackQuestion:
          "Where in the escalation sequence could regulation have entered earlier?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 5,
        title: "Urgency Calibration",
        goal: "Calibrate decision speed so urgency does not replace judgment.",
        exercises: [
          "Describe one urgent situation.",
          "Rate how urgent it felt.",
          "Describe how quickly you moved into response.",
          "Review whether speed reduced evaluation quality.",
          "Write what a more calibrated response would look like.",
        ],
        validation: [
          "User must identify perceived urgency.",
          "User must compare urgency with actual need.",
          "User must describe one calibrated adjustment.",
        ],
        fallbackQuestion:
          "Was your response speed matching the operational need or your internal pressure?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 6,
        title: "Action Impulse Interruption",
        goal: "Interrupt pressure-driven action before it becomes visible behavior.",
        exercises: [
          "Describe the operational condition.",
          "Write the action impulse.",
          "Choose the interruption technique used.",
          "Describe the response outcome.",
          "Write whether it reduced escalation risk.",
        ],
        validation: [
          "User must identify the action impulse.",
          "User must apply or choose an interruption tool.",
          "User must compare impulse with disciplined response.",
        ],
        fallbackQuestion:
          "What did you feel like doing before you interrupted the impulse?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 7,
        title: "Decision Stability Index",
        goal: "Review early-stage operational decision regulation.",
        exercises: [
          "Rate pressure judgment awareness.",
          "Rate repeated distortion recognition.",
          "Rate escalation condition awareness.",
          "Rate escalation sequence awareness.",
          "Rate urgency calibration.",
          "Rate action impulse interruption.",
          "Choose one improvement priority for next week.",
        ],
        validation: [
          "User must complete the index.",
          "User must identify highest and lowest scoring areas.",
          "User must choose one practical improvement priority.",
        ],
        fallbackQuestion:
          "Which decision regulation area most needs deliberate practice next week?",
        vp: {
          complete: 50,
          moduleBonus: 20,
        },
      },
      {
        day: 8,
        title: "Stress Activation Mapping",
        goal: "Recognize physical activation before it shapes response.",
        exercises: [
          "Describe the operational situation.",
          "Identify the first physical signal.",
          "Rate activation from 1 to 10.",
          "Describe whether activation affected tone, pacing, or decision quality.",
          "Write one insight about your body under pressure.",
        ],
        validation: [
          "User must identify a physical signal.",
          "User must rate activation level.",
          "User must connect body activation to response quality.",
        ],
        fallbackQuestion:
          "What was the first physical sign that pressure was rising?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 9,
        title: "Escalation Threshold",
        goal: "Identify the point where regulation begins to weaken.",
        exercises: [
          "Rate the activation level where you enter the Yellow Zone.",
          "Identify early behavioral signals.",
          "Write threshold-lowering conditions.",
          "Complete: My escalation threshold begins when...",
          "Write one earlier intervention you will practice.",
        ],
        validation: [
          "User must identify a Yellow Zone threshold.",
          "User must identify behavioral signals.",
          "User must complete the threshold statement.",
        ],
        fallbackQuestion:
          "At what activation level does your regulation begin to weaken?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 10,
        title: "Deliberate Response Conversion",
        goal: "Convert emotional activation into a clear and measured response.",
        exercises: [
          "Describe one moment where activation moved too quickly into action.",
          "Describe one moment where activation became deliberate response.",
          "Identify the regulation tool used.",
          "Compare the two outcomes.",
          "Write one response conversion lesson.",
        ],
        validation: [
          "User must compare immediate action with deliberate response.",
          "User must identify a regulation tool.",
          "User must explain how the response quality changed.",
        ],
        fallbackQuestion:
          "How could activation have been converted into deliberate response?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 11,
        title: "Communication Volatility",
        goal: "Monitor tone, speed, and listening before volatility shapes communication.",
        exercises: [
          "Rate your activation level in one conversation.",
          "Identify whether speaking speed was stable or accelerated.",
          "Review listening quality.",
          "Rate tone as neutral, firm, or sharp.",
          "Describe the other person's response.",
        ],
        validation: [
          "User must identify tone or pace.",
          "User must evaluate listening quality.",
          "User must connect delivery to response from others.",
        ],
        fallbackQuestion:
          "What changed first in your communication under pressure?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 12,
        title: "Residual Pressure",
        goal: "Recognize when previous pressure affects current response quality.",
        exercises: [
          "Write the previous pressure load.",
          "Rate current activation from 1 to 10.",
          "Identify carryover signs.",
          "Describe how residual pressure affected tone, listening, patience, or judgment.",
          "Complete: My response quality decreases when I carry unresolved pressure from...",
        ],
        validation: [
          "User must identify previous pressure load.",
          "User must identify carryover signs.",
          "User must connect residual pressure to current response.",
        ],
        fallbackQuestion:
          "Is this response shaped only by the current situation, or by earlier pressure too?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 13,
        title: "Regulation Reset Protocols",
        goal: "Apply a reset before activation controls the interaction.",
        exercises: [
          "Describe the operational condition.",
          "Rate activation from 1 to 10.",
          "Choose the reset protocol used.",
          "Describe whether activation decreased.",
          "Write how the reset affected tone, clarity, pacing, or decision quality.",
        ],
        validation: [
          "User must identify activation level.",
          "User must choose physiological, cognitive, or environmental reset.",
          "User must describe the result of the reset.",
        ],
        fallbackQuestion:
          "What kind of reset did this moment require?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 14,
        title: "Emotional Regulation Index",
        goal: "Review emotional regulation stability under pressure.",
        exercises: [
          "Rate physiological activation detection.",
          "Rate escalation threshold recognition.",
          "Rate deliberate response conversion.",
          "Rate tone stability.",
          "Rate residual pressure awareness.",
          "Rate reset protocol use.",
          "Choose one emotional regulation priority.",
        ],
        validation: [
          "User must complete the index.",
          "User must identify a priority area.",
          "User must choose one practice for next week.",
        ],
        fallbackQuestion:
          "Which emotional regulation area needs stronger consistency under pressure?",
        vp: {
          complete: 50,
          moduleBonus: 20,
        },
      },
      {
        day: 15,
        title: "Behavioral Pattern Accountability",
        goal: "Identify visible leadership behavior patterns under pressure.",
        exercises: [
          "Describe one pressure context.",
          "Choose the behavioral pattern: intensify, avoid, or overcompensate.",
          "Describe how others responded.",
          "Review whether the behavior improved or destabilized the situation.",
          "Complete: My dominant behavioral pattern under pressure is...",
        ],
        validation: [
          "User must identify a visible behavioral pattern.",
          "User must describe the effect on others.",
          "User must complete the dominant pattern statement.",
        ],
        fallbackQuestion:
          "Do you intensify, avoid, or overcompensate under pressure?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 16,
        title: "Conflict Interception",
        goal: "Intercept conflict before escalation overtakes the conversation.",
        exercises: [
          "Describe one disagreement or tension point.",
          "Apply one clarifying question.",
          "Stabilize tone.",
          "Refocus on the operational objective.",
          "Describe whether tension increased or decreased.",
        ],
        validation: [
          "User must describe a real disagreement.",
          "User must identify an interception tool.",
          "User must describe the effect on escalation.",
        ],
        fallbackQuestion:
          "What would reduce escalation without reducing clarity?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 17,
        title: "Proportional Response",
        goal: "Match correction to the situation, not to emotional activation.",
        exercises: [
          "Describe one situation requiring correction.",
          "Rate the actual severity as minor, moderate, or significant.",
          "Write the initial response impulse.",
          "Describe the response applied.",
          "Review whether the response matched the issue.",
        ],
        validation: [
          "User must identify actual severity.",
          "User must compare impulse with applied response.",
          "User must assess proportionality.",
        ],
        fallbackQuestion:
          "What level of response did this situation actually require?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 18,
        title: "Directive Clarity",
        goal: "Deliver direction with precision under pressure.",
        exercises: [
          "Write one directive you gave.",
          "Identify the objective.",
          "Identify the owner.",
          "Identify the timeframe.",
          "Review tone stability and confirmation of understanding.",
        ],
        validation: [
          "User must identify objective, owner, and timeframe.",
          "User must review tone stability.",
          "User must state whether understanding was confirmed.",
        ],
        fallbackQuestion:
          "Was the instruction clear enough to be executed without confusion?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 19,
        title: "Micro-Leadership Corrections",
        goal: "Correct small deviations early, clearly, and proportionately.",
        exercises: [
          "Describe one minor deviation.",
          "Write the correction given.",
          "Rate tone as neutral, firm, or sharper than necessary.",
          "Describe whether the correction stabilized or increased tension.",
          "Write one adjustment for future correction.",
        ],
        validation: [
          "User must describe a minor deviation.",
          "User must write a specific correction.",
          "User must assess tone and effect.",
        ],
        fallbackQuestion:
          "What is the smallest effective correction needed here?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 20,
        title: "Escalation Containment",
        goal: "Stabilize interaction before escalation spreads.",
        exercises: [
          "Describe what started the escalation.",
          "Identify the point of intensification.",
          "Choose a containment action.",
          "Describe how duration could be reduced.",
          "Review tone intensity and other-person response.",
        ],
        validation: [
          "User must identify the point of intensification.",
          "User must choose a containment action.",
          "User must connect containment to stabilization.",
        ],
        fallbackQuestion:
          "What will stabilize this conversation right now?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 21,
        title: "Behavioral Output Index",
        goal: "Review visible leadership behavior consistency under pressure.",
        exercises: [
          "Rate pressure behavior recognition.",
          "Rate conflict interception.",
          "Rate proportional response.",
          "Rate directive clarity.",
          "Rate micro-correction consistency.",
          "Rate escalation containment.",
          "Choose one behavioral priority.",
        ],
        validation: [
          "User must complete the index.",
          "User must identify a behavioral priority.",
          "User must choose one practice for next week.",
        ],
        fallbackQuestion:
          "Which visible leadership behavior needs stronger consistency?",
        vp: {
          complete: 50,
          moduleBonus: 20,
        },
      },
      {
        day: 22,
        title: "Cross-Level Response Alignment",
        goal: "Increase consistency in leadership response across levels.",
        exercises: [
          "Compare your response style with other leaders.",
          "Review escalation threshold consistency.",
          "Review tone stability across levels.",
          "Identify visible inconsistency.",
          "Write one behavioral adjustment to increase alignment.",
        ],
        validation: [
          "User must compare response styles.",
          "User must identify one inconsistency.",
          "User must choose one alignment adjustment.",
        ],
        fallbackQuestion:
          "Where is leadership response inconsistency most visible?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 23,
        title: "Accountability Reinforcement",
        goal: "Reinforce expectations consistently enough to prevent drift.",
        exercises: [
          "Identify one operational or behavioral standard.",
          "Review whether it is clearly defined.",
          "Identify recent drift.",
          "Review whether reinforcement was consistent.",
          "Write one standard you need to reinforce more consistently.",
        ],
        validation: [
          "User must identify one standard.",
          "User must identify whether drift occurred.",
          "User must choose one reinforcement priority.",
        ],
        fallbackQuestion:
          "Which standard needs clearer and more consistent reinforcement?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 24,
        title: "Decision Integrity Under Load",
        goal: "Protect decision quality when operational pressure is high.",
        exercises: [
          "Describe one decision made under pressure.",
          "Identify the standard at stake.",
          "Write the decision taken.",
          "Identify whether urgency, fatigue, frustration, or convenience influenced it.",
          "Review whether the decision remained aligned with the required standard.",
        ],
        validation: [
          "User must describe a decision under pressure.",
          "User must identify the standard at stake.",
          "User must assess pressure influence and alignment.",
        ],
        fallbackQuestion:
          "Did this decision protect the standard or adapt it to the pressure?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 25,
        title: "Integrity Stress Test",
        goal: "Maintain alignment between standards and action when pressure increases.",
        exercises: [
          "Describe the load condition.",
          "Identify the compromise risk.",
          "Write how pressure influenced the decision.",
          "Review whether the final decision aligned with standards.",
          "Complete: One area where pressure challenges my decision discipline is...",
        ],
        validation: [
          "User must identify load condition.",
          "User must identify compromise risk.",
          "User must assess final alignment.",
        ],
        fallbackQuestion:
          "Would you make the same decision in a calmer and clearer state?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 26,
        title: "Team-Level Escalation Reduction",
        goal: "Recognize rising group tension and stabilize it before it spreads.",
        exercises: [
          "Identify the first activation point in a group interaction.",
          "Write the escalation signal.",
          "Describe the group response.",
          "Identify an early intervention opportunity.",
          "Apply one stabilizing action and review the outcome.",
        ],
        validation: [
          "User must describe a group interaction.",
          "User must identify a team escalation signal.",
          "User must apply or choose one stabilizing action.",
        ],
        fallbackQuestion:
          "What is happening in the room right now?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 27,
        title: "Communication Stabilization",
        goal: "Make communication stability a consistent leadership pattern.",
        exercises: [
          "Review tone consistency across the week.",
          "Identify fatigue influence.",
          "Review directive structure consistency.",
          "Review correction stability.",
          "Write one communication pattern to stabilize.",
        ],
        validation: [
          "User must review communication consistency.",
          "User must identify one destabilizing factor.",
          "User must choose one communication pattern to stabilize.",
        ],
        fallbackQuestion:
          "Which communication pattern must become more predictable?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 28,
        title: "High-Pressure Scenario Simulation",
        goal: "Apply regulation tools in a realistic high-pressure scenario.",
        exercises: [
          "Define the pressure context.",
          "Identify the first leadership risk.",
          "Choose three core disciplines to apply.",
          "Document the result.",
          "Identify the weakest point under pressure.",
        ],
        validation: [
          "User must define a realistic high-pressure scenario.",
          "User must choose three disciplines.",
          "User must identify the weakest point.",
        ],
        fallbackQuestion:
          "Which leadership discipline must remain strongest right now?",
        vp: {
          complete: 40,
          bonus: 10,
        },
      },
      {
        day: 29,
        title: "Personal Regulation System",
        goal: "Turn strongest regulation practices into a repeatable personal system.",
        exercises: [
          "Write your early warning signals.",
          "Write your primary interruption tool.",
          "Write your escalation threshold level.",
          "Write your directive structure standard.",
          "Write your containment rule.",
          "Write your integrity check question.",
        ],
        validation: [
          "User must complete all six regulation system fields.",
          "User must identify a repeatable structure.",
          "User must define one integrity check question.",
        ],
        fallbackQuestion:
          "Are you responding from your system, or from the pressure of the moment?",
        vp: {
          complete: 50,
          bonus: 20,
        },
      },
      {
        day: 30,
        title: "Operational Stability Review",
        goal: "Complete the final calibration assessment and define continuation commitments.",
        exercises: [
          "Complete the Integrated Operational Stability Index.",
          "Identify your primary escalation condition.",
          "Identify your dominant visible behavior under pressure.",
          "Write your most effective regulation tool.",
          "Identify one ongoing risk area.",
          "State your personal regulation system in one sentence.",
          "Write one weekly practice to maintain.",
        ],
        validation: [
          "User must complete the final index.",
          "User must identify one risk area.",
          "User must state their regulation system in one sentence.",
          "User must define one continuation practice.",
        ],
        fallbackQuestion:
          "What leadership behavior must now become non-negotiable?",
        vp: {
          complete: 70,
          moduleBonus: 100,
        },
      },
    ],
    indexes: [
      {
        id: "operational-decision-stability-index",
        title: "Operational Decision Stability Index",
        day: 7,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Pressure begins to influence judgment before response",
          "Repeated decision distortions",
          "Operational escalation conditions",
          "Escalation sequence recognition",
          "Urgency calibration",
          "Action impulse interruption",
        ],
        maxScore: 60,
        interpretation: [
          {
            min: 50,
            max: 60,
            label: "Strong early-stage operational decision regulation",
          },
          {
            min: 35,
            max: 49,
            label: "Developing regulation awareness",
          },
          {
            min: 20,
            max: 34,
            label: "Pressure still influences judgment and response too quickly",
          },
          {
            min: 0,
            max: 19,
            label: "Escalation and decision instability remain largely automatic",
          },
        ],
      },
      {
        id: "emotional-regulation-stability-index",
        title: "Emotional Regulation Stability Index",
        day: 14,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Physiological activation detection",
          "Escalation threshold recognition",
          "Deliberate response conversion",
          "Tone stability under pressure",
          "Residual pressure awareness",
          "Reset protocol use",
        ],
        maxScore: 60,
      },
      {
        id: "behavioral-output-consistency-index",
        title: "Behavioral Output Consistency Index",
        day: 21,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Pressure behavior pattern recognition",
          "Conflict interception",
          "Proportional response",
          "Directive clarity",
          "Micro-correction consistency",
          "Escalation containment",
        ],
        maxScore: 60,
      },
      {
        id: "integrated-operational-stability-index",
        title: "Integrated Operational Stability Index",
        day: 30,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Early decision distortion recognition",
          "Escalation sequence detection",
          "Activation threshold intervention",
          "Deliberate response conversion",
          "Proportionate tone and correction",
          "Escalation containment",
          "Standards under load",
          "Communication stability",
          "Team-level escalation reduction",
          "Repeatable regulation system",
        ],
        maxScore: 100,
      },
    ],
    personalRegulationSystem: {
      id: "personal-regulation-system",
      title: "Personal Regulation System",
      fields: [
        "My Early Warning Signals",
        "My Primary Interruption Tool",
        "My Escalation Threshold Level",
        "My Directive Structure Standard",
        "My Containment Rule",
        "My Integrity Check Question",
      ],
      sequence: ["Signal", "Interrupt", "Clarify", "Contain", "Check Integrity"],
      vp: {
        complete: 50,
        bonus: 20,
      },
    },
  },
  {
    id: "module-7",
    order: 7,
    title: "Attention Management & Cognitive Performance™",
    displayTitle: "Mental Focus & Cognitive Energy",
    subtitle: "Managing attention, mental fatigue, and cognitive clarity",
    duration: "7 days",
    coreSkill: "Cognitive Energy Management",
    rewardVp: 350,
    badge: "Cognitive Focus Builder",
    chain: [
      "Attention",
      "Mental Energy",
      "Focus",
      "Distraction",
      "Recovery",
      "Decision Clarity",
    ],
    goal:
      "Help the user manage attention, recognize mental fatigue, recover focus, protect deep work, reduce distraction, and improve leadership decision clarity.",
    completionRequirements: [
      "Complete all 7 days",
      "Create one Personal Focus Strategy",
      "Complete the Personal Cognitive Focus Map",
    ],
    days: [
      {
        day: 1,
        title: "Attention Observation",
        goal: "Observe how attention moves during the workday.",
        exercises: [
          "Identify one task you were working on.",
          "Write what interrupted your attention.",
          "Estimate how long it took to regain focus.",
          "Describe the impact on task quality or progress.",
          "Write one pattern you noticed about your attention.",
        ],
        validation: [
          "User must identify a real task.",
          "User must identify the interruption.",
          "User must describe the effect on focus or task quality.",
        ],
        fallbackQuestion:
          "What pulled your attention away from the task?",
        vp: {
          start: 10,
          complete: 25,
          bonus: 10,
        },
      },
      {
        day: 2,
        title: "Mental Fatigue Recognition",
        goal: "Recognize early signs of mental fatigue before clarity declines.",
        exercises: [
          "Write the time of day when mental energy dropped.",
          "Identify the activity being performed.",
          "Name the signs of mental fatigue.",
          "Describe how fatigue affected communication, patience, or decision quality.",
          "Write one adjustment you made or could make.",
        ],
        validation: [
          "User must identify a fatigue moment.",
          "User must name at least one fatigue signal.",
          "User must connect fatigue to work quality or leadership behavior.",
        ],
        fallbackQuestion:
          "What signal showed that your mental clarity was starting to decline?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 3,
        title: "Attention Recovery",
        goal: "Recover focus deliberately after interruption.",
        exercises: [
          "Write the task you were working on.",
          "Identify what interrupted your attention.",
          "Describe how you returned to the task.",
          "Estimate how long it took to regain concentration.",
          "Write what helped restore focus.",
        ],
        validation: [
          "User must identify a real interruption.",
          "User must describe the return-to-task process.",
          "User must identify one recovery method.",
        ],
        fallbackQuestion:
          "What was the objective of the task before you were interrupted?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 4,
        title: "Strategic Energy Allocation",
        goal: "Match high-value work to periods of strongest mental energy.",
        exercises: [
          "Write one task you performed.",
          "Write the time of day.",
          "Rate mental energy as high, moderate, or low.",
          "Identify the task type: strategic, analytical, routine, or communication.",
          "Write whether the task matched your energy level.",
        ],
        validation: [
          "User must identify task type.",
          "User must rate mental energy.",
          "User must reflect on whether the task matched cognitive capacity.",
        ],
        fallbackQuestion:
          "Was this the best use of your cognitive energy at that time?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 5,
        title: "Deep Focus",
        goal: "Protect one period of sustained attention for important work.",
        exercises: [
          "Choose one task that requires deep focus.",
          "Set a planned focus period.",
          "Identify distractions to minimize.",
          "Complete the focus session.",
          "Review whether sustained attention improved work quality.",
        ],
        validation: [
          "User must select one important task.",
          "User must define a focus period.",
          "User must review the quality of the session.",
        ],
        fallbackQuestion:
          "Which task requires uninterrupted thinking today?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 6,
        title: "Cognitive Distraction Management",
        goal: "Identify and manage external and internal distractions.",
        exercises: [
          "Write the task you were working on.",
          "Identify the source of distraction.",
          "Label it as external or internal.",
          "Write how long the distraction lasted.",
          "Describe its impact on your ability to return to the task.",
          "Choose one strategy to reduce this distraction.",
        ],
        validation: [
          "User must identify a distraction source.",
          "User must label it as external or internal.",
          "User must choose one distraction-management strategy.",
        ],
        fallbackQuestion:
          "Does this require your attention right now?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 7,
        title: "Personal Focus Strategy",
        goal: "Create a practical strategy for cognitive clarity and leadership performance.",
        exercises: [
          "Write what you learned about your attention.",
          "Identify your strongest mental energy periods.",
          "Write the distractions you need to manage.",
          "Choose strategies to protect focus.",
          "List tasks that require protected focus time.",
          "Write one focus practice you will continue applying.",
        ],
        validation: [
          "User must identify strongest focus periods.",
          "User must identify key distractions.",
          "User must create one practical focus strategy.",
          "User must choose one continuing practice.",
        ],
        fallbackQuestion:
          "Which focus practice will you carry into your daily leadership routine?",
        vp: {
          complete: 50,
          moduleBonus: 50,
        },
      },
    ],
    focusStrategy: {
      id: "personal-focus-strategy",
      title: "Personal Focus Strategy",
      fields: [
        "Key distractions I need to manage",
        "Periods when my mental energy is strongest",
        "Strategies I will use to protect my focus",
        "Tasks that require protected focus time",
      ],
      commitmentFields: [
        "Focus practice I will implement",
        "Situations where I will apply this practice",
        "How I will protect my attention during demanding tasks",
        "How improved focus will strengthen my performance",
      ],
      vp: {
        complete: 30,
        bonus: 20,
      },
    },
    cognitiveFocusMap: {
      id: "personal-cognitive-focus-map",
      title: "Personal Cognitive Focus Map",
      fields: [
        "Moments when my focus was strongest",
        "Situations that fragmented my attention",
        "Signs that my cognitive energy was decreasing",
        "Practices that helped restore my attention",
        "Changes I intend to apply to protect my focus",
      ],
      vp: {
        complete: 30,
        bonus: 20,
      },
    },
  },
  {
    id: "module-8",
    order: 8,
    title: "Leadership Regulation Foundation™",
    displayTitle: "Leadership Regulation Foundation",
    subtitle:
      "Executive emotional stability and authority discipline for high-pressure environments",
    duration: "30 days",
    coreSkill: "Executive Authority Regulation",
    rewardVp: 1200,
    badge: "Executive Stability Builder",
    chain: [
      "Event",
      "Interpretation",
      "Identity Reaction",
      "Emotional Activation",
      "Authority Expression",
      "Leadership Response",
    ],
    goal:
      "Help the user build stable authority under scrutiny, challenge, ego activation, validation pressure, and sustained leadership demand.",
    completionRequirements: [
      "Complete all 30 days",
      "Complete weekly calibration indexes",
      "Create one Authority Sustainability Blueprint",
      "Complete the Executive Stability Index",
    ],
    weeks: [
      {
        week: 1,
        title: "Emotional Awareness Architecture",
        focus:
          "Identify identity triggers, ego sensitivity, validation dependency, status threat, and emotional narrative distortion.",
      },
      {
        week: 2,
        title: "Authority Stabilization Under Scrutiny",
        focus:
          "Strengthen composure, tone control, body regulation, and defensive communication control under visible pressure.",
      },
      {
        week: 3,
        title: "Pressure Endurance & Energy Architecture",
        focus:
          "Preserve leadership quality under sustained load, decision fatigue, cognitive fragmentation, and pressure cycles.",
      },
      {
        week: 4,
        title: "Leadership Identity Consolidation",
        focus:
          "Build detached authority, psychological sovereignty, emotional independence, and long-term composure discipline.",
      },
    ],
    days: [
      {
        day: 1,
        title: "Identity Trigger Awareness",
        goal:
          "Recognize when leadership becomes psychologically personal.",
        exercises: [
          "Describe the external event.",
          "Write the internal interpretation about role, status, or authority.",
          "Name the emotion that followed.",
          "Describe how you responded.",
          "Separate the operational issue from the identity reaction.",
        ],
        validation: [
          "User must describe a real leadership event.",
          "User must identify an identity-based interpretation.",
          "User must separate operational reality from personal reaction.",
        ],
        fallbackQuestion:
          "Is this operational, or is identity reacting?",
        vp: {
          start: 10,
          complete: 25,
          bonus: 10,
        },
      },
      {
        day: 2,
        title: "Ego Sensitivity",
        goal:
          "Recognize ego-based activation before it shapes authority expression.",
        exercises: [
          "Describe one moment where you felt questioned, challenged, evaluated, or compared.",
          "Write the internal ego interpretation.",
          "Name the emotion that followed.",
          "Describe how tone, posture, or pacing changed.",
          "Write what a non-defensive response would sound like.",
        ],
        validation: [
          "User must identify a challenge or evaluation moment.",
          "User must identify ego interpretation.",
          "User must describe visible authority changes.",
        ],
        fallbackQuestion:
          "Is this threatening your role, or your ego?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 3,
        title: "Validation Dependency",
        goal:
          "Identify when approval-seeking shapes tone, clarity, or authority posture.",
        exercises: [
          "Describe one moment where you wanted agreement or approval.",
          "Write the approval need that appeared.",
          "Describe how it affected tone, pacing, or clarity.",
          "Write how you responded.",
          "Rewrite the response with stable authority.",
        ],
        validation: [
          "User must identify a validation need.",
          "User must connect approval-seeking to communication behavior.",
          "User must rewrite with clearer authority.",
        ],
        fallbackQuestion:
          "Is this adjustment for clarity, or for approval?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 4,
        title: "Emotional Narrative Control",
        goal:
          "Separate observable facts from identity-protective interpretations.",
        exercises: [
          "Write what happened as fact only.",
          "Write the interpretation attached to authority, standards, or leadership.",
          "Name the emotion that followed.",
          "Describe how the interpretation influenced response.",
          "Rewrite the interpretation using operational language only.",
        ],
        validation: [
          "User must separate fact from interpretation.",
          "User must identify emotional narrative.",
          "User must rewrite using operational language.",
        ],
        fallbackQuestion:
          "What do you know as fact, and what are you adding through identity-based meaning?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 5,
        title: "Status Threat Calibration",
        goal:
          "Detect when perceived status threat increases tone, urgency, or authority intensity.",
        exercises: [
          "Describe one moment of public challenge, comparison, evaluation, or scrutiny.",
          "Write the status interpretation that formed.",
          "Name the emotion that followed.",
          "Describe how tone, speed, or authority posture changed.",
          "Write the response that would serve the situation without overcompensation.",
        ],
        validation: [
          "User must identify a status-sensitive moment.",
          "User must name the internal status interpretation.",
          "User must create a non-overcompensating response.",
        ],
        fallbackQuestion:
          "Is this a threat to standards, or to status?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 6,
        title: "Authority vs. Ego",
        goal:
          "Distinguish standard-based authority from ego-based reaction.",
        exercises: [
          "Describe one corrective or directive moment.",
          "Write the standard involved.",
          "Name the emotion you felt.",
          "Review whether your tone was proportional.",
          "Write whether you were protecting the standard or protecting self-image.",
          "Rewrite the correction in standard-based language.",
        ],
        validation: [
          "User must identify the standard involved.",
          "User must distinguish authority from ego.",
          "User must rewrite correction without personal charge.",
        ],
        fallbackQuestion:
          "Are you protecting standards, or protecting yourself?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 7,
        title: "Emotional Awareness Stability Index",
        goal:
          "Review identity-level activation and emotional awareness stability.",
        exercises: [
          "Rate identity trigger recognition.",
          "Rate ego sensitivity detection.",
          "Rate validation need separation.",
          "Rate emotional narrative control.",
          "Rate status challenge stability.",
          "Rate authority versus ego differentiation.",
          "Choose one emotional awareness priority.",
        ],
        validation: [
          "User must complete the index.",
          "User must identify one primary pattern.",
          "User must choose one improvement priority.",
        ],
        fallbackQuestion:
          "Which identity-based reaction influenced your authority most this week?",
        vp: {
          complete: 50,
          moduleBonus: 20,
        },
      },
      {
        day: 8,
        title: "Authority Presence",
        goal:
          "Distinguish stable authority presence from performative authority.",
        exercises: [
          "Describe one interaction where visibility or scrutiny was present.",
          "Write the context of observation.",
          "Review whether tone or pacing changed.",
          "Write whether you spoke, interrupted, or explained more than usual.",
          "Identify whether you embodied authority or performed it.",
        ],
        validation: [
          "User must identify a visible setting.",
          "User must assess performance-based authority behavior.",
          "User must distinguish presence from performance.",
        ],
        fallbackQuestion:
          "Are you trying to demonstrate authority, or express it with stability?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 9,
        title: "Public Challenge Containment",
        goal:
          "Maintain authority stability during visible challenge.",
        exercises: [
          "Describe one public challenge or group disagreement.",
          "Write what was said.",
          "Write your initial internal reaction.",
          "Describe whether tone or pacing shifted.",
          "Write how you contained or escalated the situation.",
          "Choose one adjustment for future public challenge.",
        ],
        validation: [
          "User must describe a visible challenge.",
          "User must identify internal reaction.",
          "User must review containment or escalation.",
        ],
        fallbackQuestion:
          "What response will protect clarity without increasing intensity?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 10,
        title: "Neutrality Under Opposition",
        goal:
          "Remain steady under direct opposition without emotional acceleration.",
        exercises: [
          "Describe one moment of direct opposition.",
          "Write what was said.",
          "Rate emotional activation from 1 to 10.",
          "Review whether you interrupted or accelerated response.",
          "Describe tone shift.",
          "Classify your response as neutral, defensive, or intensified.",
        ],
        validation: [
          "User must identify direct opposition.",
          "User must rate activation.",
          "User must classify response quality.",
        ],
        fallbackQuestion:
          "Can you stay steady long enough to understand the issue before reacting to it?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 11,
        title: "Voice Stability",
        goal:
          "Regulate tone, pace, volume, and delivery under pressure.",
        exercises: [
          "Describe one visible or high-pressure interaction.",
          "Rate activation from 1 to 10.",
          "Review speaking speed as stable or accelerated.",
          "Classify tone as neutral, firm, or sharp.",
          "Review volume as consistent or elevated.",
          "Review listening as complete or interrupted.",
        ],
        validation: [
          "User must rate activation.",
          "User must review voice pace and tone.",
          "User must connect voice to authority stability.",
        ],
        fallbackQuestion:
          "Does your voice reflect control, or activation?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 12,
        title: "Executive Body Language",
        goal:
          "Align posture, facial expression, gesture, and eye contact with stable authority.",
        exercises: [
          "Describe one visible pressure interaction.",
          "Rate activation from 1 to 10.",
          "Review posture as neutral, tense, or leaning forward.",
          "Review facial expression as neutral, tight, or reactive.",
          "Review gesture control as measured or excessive.",
          "Evaluate whether body language reinforced stability or signaled activation.",
        ],
        validation: [
          "User must assess physical presence.",
          "User must identify one body signal.",
          "User must connect body language to authority expression.",
        ],
        fallbackQuestion:
          "Does your physical presence support the authority you intend to communicate?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 13,
        title: "Defensive Communication",
        goal:
          "Remove unnecessary justification, over-explanation, and self-protective communication.",
        exercises: [
          "Describe one moment where you felt questioned, corrected, or challenged.",
          "Write what was asked or stated.",
          "Write your immediate internal reaction.",
          "Identify whether you justified, repeated yourself, interrupted, or intensified tone.",
          "Rewrite one response in concise, standard-based language.",
        ],
        validation: [
          "User must identify a defensive communication moment.",
          "User must name the defensive pattern.",
          "User must rewrite concisely.",
        ],
        fallbackQuestion:
          "Are you answering the issue, or defending yourself?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 14,
        title: "Authority Stability Index",
        goal:
          "Review visible authority stability under scrutiny.",
        exercises: [
          "Rate tone stability during public challenge.",
          "Rate avoidance of authority performance.",
          "Rate neutrality under opposition.",
          "Rate voice pacing control.",
          "Rate composed body language.",
          "Rate defensive communication control.",
          "Choose one visible authority behavior to strengthen.",
        ],
        validation: [
          "User must complete the index.",
          "User must identify one visible instability pattern.",
          "User must choose one authority practice priority.",
        ],
        fallbackQuestion:
          "Which visible authority behavior needs the most reinforcement?",
        vp: {
          complete: 50,
          moduleBonus: 20,
        },
      },
      {
        day: 15,
        title: "Sustained Load Mapping",
        goal:
          "Measure accumulated leadership load before it weakens authority stability.",
        exercises: [
          "Record total meaningful decisions made.",
          "Record number of emotionally charged interactions.",
          "Record hours of uninterrupted deep work.",
          "Record hours spent in reactive communication.",
          "Rate sleep quality from 1 to 10.",
          "Rate end-of-day activation from 1 to 10.",
          "Review whether the current load is sustainable.",
        ],
        validation: [
          "User must measure leadership load.",
          "User must rate activation or sleep quality.",
          "User must assess sustainability.",
        ],
        fallbackQuestion:
          "What needs to be reduced or redistributed to preserve stability?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 16,
        title: "Decision Fatigue Risk",
        goal:
          "Identify when decision volume reduces clarity, patience, or leadership discipline.",
        exercises: [
          "Record decisions made before 12:00.",
          "Record decisions made after 15:00.",
          "Rate activation level at major decisions.",
          "Classify decision complexity as low, medium, or high.",
          "Identify whether you deferred, accelerated, or simplified any decision because of fatigue.",
          "Review whether decision quality declined across the day.",
        ],
        validation: [
          "User must track decision volume.",
          "User must identify fatigue influence.",
          "User must review impact on decision quality.",
        ],
        fallbackQuestion:
          "Are you deciding with clarity, or trying to reduce cognitive load quickly?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 17,
        title: "Cognitive Bandwidth Protection",
        goal:
          "Protect mental continuity from interruption, task switching, and fragmented attention.",
        exercises: [
          "Record number of task interruptions.",
          "Record longest uninterrupted focus block.",
          "Record number of context switches.",
          "Rate end-of-day energy from 1 to 10.",
          "Rate activation after back-to-back meetings.",
          "Identify one structural change to reduce fragmentation.",
        ],
        validation: [
          "User must measure interruption or context switching.",
          "User must rate energy or activation.",
          "User must identify one structural change.",
        ],
        fallbackQuestion:
          "Is your attention being used intentionally, or consumed by fragmentation?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 18,
        title: "Energy Leak Elimination",
        goal:
          "Reduce avoidable energy loss that weakens leadership endurance.",
        exercises: [
          "Identify one issue you replay mentally without productive action.",
          "Identify one task that could be delegated.",
          "Identify one recurring interaction that drains energy.",
          "Identify one low-impact issue receiving too much attention.",
          "Identify one emotional carryover from a previous event.",
          "Select one energy leak to reduce or eliminate.",
        ],
        validation: [
          "User must identify at least one energy leak.",
          "User must classify avoidable energy expenditure.",
          "User must choose one reduction action.",
        ],
        fallbackQuestion:
          "Is this receiving energy because it is important, or because it is unresolved?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 19,
        title: "Recovery Architecture",
        goal:
          "Build recovery into the leadership operating rhythm.",
        exercises: [
          "Record time between high-pressure interactions.",
          "Record number of back-to-back meetings without reset.",
          "Rate sleep quality over the last three days.",
          "Record whether physical recovery happened this week.",
          "Record cognitive disengagement time after work.",
          "Define one structural recovery adjustment for the coming week.",
        ],
        validation: [
          "User must measure recovery structure.",
          "User must identify recovery absence.",
          "User must define one recovery adjustment.",
        ],
        fallbackQuestion:
          "What recovery action is required to sustain the quality of your authority?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 20,
        title: "Pressure Tolerance",
        goal:
          "Remain composed, measured, and clear while pressure is active.",
        exercises: [
          "Identify one real-time pressure moment.",
          "Rate activation level from 1 to 10.",
          "Reduce speaking speed deliberately.",
          "Insert one 3-second pause before response.",
          "Ask one clarifying question before directive.",
          "Maintain neutral posture.",
          "Review whether regulation reduced intensity.",
        ],
        validation: [
          "User must identify a pressure moment.",
          "User must apply at least one tolerance action.",
          "User must review intensity or clarity change.",
        ],
        fallbackQuestion:
          "Can you stay steady long enough to respond with structure rather than urgency?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 21,
        title: "Leadership Endurance Index",
        goal:
          "Review leadership durability under sustained demand.",
        exercises: [
          "Rate sustained load awareness.",
          "Rate decision fatigue detection.",
          "Rate cognitive bandwidth protection.",
          "Rate energy leak reduction.",
          "Rate structured recovery.",
          "Rate composure during repeated pressure spikes.",
          "Choose one endurance discipline to strengthen.",
        ],
        validation: [
          "User must complete the index.",
          "User must identify endurance weakness.",
          "User must choose one structural adjustment.",
        ],
        fallbackQuestion:
          "Which endurance discipline now requires stronger structure?",
        vp: {
          complete: 50,
          moduleBonus: 20,
        },
      },
      {
        day: 22,
        title: "Detached Authority",
        goal:
          "Separate operational responsibility from emotional attachment.",
        exercises: [
          "Identify one decision or discussion where emotional investment is high.",
          "Write the operational objective.",
          "Identify the personal attachment present.",
          "Review whether attachment increased tone intensity, defensiveness, or rigidity.",
          "Write how the response would change if fully role-focused.",
          "Rewrite the response using role-based language.",
        ],
        validation: [
          "User must identify personal attachment.",
          "User must separate standard from self.",
          "User must rewrite with role-based authority.",
        ],
        fallbackQuestion:
          "Is this about standards, or about self?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 23,
        title: "Psychological Sovereignty",
        goal:
          "Remain internally governed instead of externally dictated.",
        exercises: [
          "Document one praise moment.",
          "Document one criticism or challenge.",
          "Document one high-pressure operational demand.",
          "Rate emotional activation for each.",
          "Review tone, posture, or pacing shifts.",
          "Identify whether internal state was governed by the event or by discipline.",
        ],
        validation: [
          "User must identify external influence.",
          "User must rate activation.",
          "User must assess internal command.",
        ],
        fallbackQuestion:
          "What response reflects internal command rather than environmental reaction?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 24,
        title: "Independence from Evaluation",
        goal:
          "Separate performance evaluation from personal identity.",
        exercises: [
          "Identify one evaluation moment.",
          "Write what was evaluated.",
          "Rate emotional activation from 1 to 10.",
          "Describe tone or posture shift.",
          "Classify response as objective or defensive.",
          "Write how the response would differ if identity were separate from outcome.",
        ],
        validation: [
          "User must identify an evaluation moment.",
          "User must assess identity fusion.",
          "User must rewrite with emotional independence.",
        ],
        fallbackQuestion:
          "Are you receiving information, or turning this into identity judgment?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 25,
        title: "Authority Sustainability Blueprint",
        goal:
          "Formalize structures that preserve authority stability over time.",
        exercises: [
          "Define one weekly awareness review practice.",
          "Define one structural recovery boundary.",
          "Define one decision pacing rule.",
          "Define one tone stability commitment.",
          "Define one energy protection measure.",
          "Define one escalation containment protocol.",
        ],
        validation: [
          "User must complete all six blueprint fields.",
          "User must define structural support, not only intention.",
          "User must create a sustainable authority practice.",
        ],
        fallbackQuestion:
          "Is your stability dependent on effort, or supported by structure?",
        vp: {
          complete: 50,
          bonus: 20,
        },
      },
      {
        day: 26,
        title: "Composure Standard",
        goal:
          "Make composure the default operating standard, not the recovery strategy.",
        exercises: [
          "Define your vocal pacing standard.",
          "Define your posture standard during disagreement.",
          "Define your activation-threshold rule.",
          "Define your directive tone standard.",
          "Define your listening minimum.",
          "Write these as non-negotiable operating commitments.",
        ],
        validation: [
          "User must define a composure standard.",
          "User must include tone, posture, threshold, directive tone, and listening.",
          "User must frame the standard as operational commitment.",
        ],
        fallbackQuestion:
          "Are you operating from stability, or trying to recover it after reaction?",
        vp: {
          complete: 40,
          bonus: 10,
        },
      },
      {
        day: 27,
        title: "Ego Reduction",
        goal:
          "Reduce ego rigidity and strengthen adaptable authority.",
        exercises: [
          "Identify one situation where you were challenged, corrected, or offered an alternative view.",
          "Write your immediate internal reaction.",
          "Describe whether resistance to revision appeared.",
          "Review tone, posture, or pacing intensity.",
          "Write how ego may have influenced rigidity.",
          "Rewrite your response as if only standards, facts, and decision quality remained.",
        ],
        validation: [
          "User must identify ego rigidity or resistance.",
          "User must assess visible response.",
          "User must rewrite without self-image protection.",
        ],
        fallbackQuestion:
          "Are you protecting decision quality, or protecting self-image?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 28,
        title: "Crisis Stability Simulation",
        goal:
          "Apply the leadership regulation framework under compressed pressure.",
        exercises: [
          "Choose one realistic high-pressure scenario.",
          "Rate activation level from 1 to 10.",
          "Pause for 3 seconds before the first statement.",
          "Lower speaking speed deliberately.",
          "Ask one clarifying question before issuing a directive.",
          "Maintain neutral posture and tone.",
          "Issue one concise, standard-based directive.",
          "Review whether urgency overrode composure.",
        ],
        validation: [
          "User must define a realistic crisis scenario.",
          "User must apply crisis regulation actions.",
          "User must review tone, clarity, and urgency control.",
        ],
        fallbackQuestion:
          "Can you create enough structure in the first response to stabilize the environment rather than intensify it?",
        vp: {
          complete: 40,
          bonus: 10,
        },
      },
      {
        day: 29,
        title: "Leadership Identity Integration Index",
        goal:
          "Assess whether regulation is becoming structural rather than situational.",
        exercises: [
          "Rate authority tone stability across audiences.",
          "Rate identity trigger control.",
          "Rate separation of performance outcomes from self-worth.",
          "Rate composure under sustained demand.",
          "Rate urgency control.",
          "Rate ego resistance during decision revision.",
          "Rate recovery structure.",
          "Rate listening tolerance under challenge.",
          "Choose one integration area for continued reinforcement.",
        ],
        validation: [
          "User must complete the integration index.",
          "User must identify remaining volatility.",
          "User must choose one structural support.",
        ],
        fallbackQuestion:
          "Where does inconsistency still appear most clearly in your leadership expression?",
        vp: {
          complete: 60,
          moduleBonus: 30,
        },
      },
      {
        day: 30,
        title: "Executive Stability Index",
        goal:
          "Complete final calibration and define long-term authority discipline commitments.",
        exercises: [
          "Complete the Executive Stability Index.",
          "Identify the most significant measurable improvement.",
          "Identify the primary instability reduced or eliminated.",
          "Identify the area requiring ongoing reinforcement.",
          "Write the structural adjustment that must remain permanent.",
          "Define three non-negotiable leadership commitments.",
          "Write your highest-priority discipline moving forward.",
        ],
        validation: [
          "User must complete the final index.",
          "User must identify ongoing reinforcement area.",
          "User must define three authority commitments.",
        ],
        fallbackQuestion:
          "What leadership discipline now requires the strongest long-term protection?",
        vp: {
          complete: 70,
          moduleBonus: 100,
        },
      },
    ],
    indexes: [
      {
        id: "emotional-awareness-stability-index",
        title: "Emotional Awareness Stability Index",
        day: 7,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Identity trigger recognition",
          "Ego sensitivity detection",
          "Validation need separation",
          "Emotional narrative control",
          "Status challenge stability",
          "Authority versus ego differentiation",
        ],
        maxScore: 60,
        interpretation: [
          {
            min: 50,
            max: 60,
            label: "Strong early-stage awareness and improving regulation under scrutiny",
          },
          {
            min: 35,
            max: 49,
            label: "Developing awareness with inconsistency under pressure",
          },
          {
            min: 20,
            max: 34,
            label: "Identity-driven reactions still influence tone and response frequently",
          },
          {
            min: 0,
            max: 19,
            label: "Ego, validation, and status sensitivity still shape authority behavior significantly",
          },
        ],
      },
      {
        id: "authority-stability-index",
        title: "Authority Stability Index",
        day: 14,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Tone stability during public challenge",
          "Avoidance of authority performance",
          "Emotional neutrality under opposition",
          "Voice pacing control",
          "Composed body language",
          "Defensive communication control",
        ],
        maxScore: 60,
      },
      {
        id: "leadership-endurance-index",
        title: "Leadership Endurance Index",
        day: 21,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Sustained load awareness",
          "Decision fatigue detection",
          "Cognitive bandwidth protection",
          "Energy leak reduction",
          "Structured recovery",
          "Composure during repeated pressure spikes",
        ],
        maxScore: 60,
      },
      {
        id: "leadership-identity-integration-index",
        title: "Leadership Identity Integration Index",
        day: 29,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Authority tone across audiences",
          "Identity trigger control",
          "Separation of performance outcomes from self-worth",
          "Composure under sustained demand",
          "Urgency control",
          "Decision revision without ego resistance",
          "Structured recovery",
          "Listening tolerance under challenge",
        ],
        maxScore: 80,
      },
      {
        id: "executive-stability-index",
        title: "Executive Stability Index",
        day: 30,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Identity trigger detection",
          "Ego sensitivity regulation",
          "Validation need independence",
          "Measured tone under scrutiny",
          "Non-performative authority",
          "Defensive communication reduction",
          "Decision clarity under sustained demand",
          "Cognitive bandwidth protection",
          "Structured recovery",
          "Evaluation independence",
          "Decision revision without ego resistance",
          "Composure as default operating standard",
        ],
        maxScore: 120,
        interpretation: [
          {
            min: 100,
            max: 120,
            label: "High executive stability integration",
          },
          {
            min: 75,
            max: 99,
            label: "Strong foundation with continued improvement needed under sustained demand or higher scrutiny",
          },
          {
            min: 50,
            max: 74,
            label: "Volatility risk remains present under fatigue, pressure, or evaluation",
          },
          {
            min: 0,
            max: 49,
            label: "Structural reinforcement is still required for stable authority consistency",
          },
        ],
      },
    ],
    sustainabilityBlueprint: {
      id: "authority-sustainability-blueprint",
      title: "Authority Sustainability Blueprint",
      fields: [
        "One weekly awareness review practice",
        "One structural recovery boundary",
        "One decision pacing rule",
        "One tone stability commitment",
        "One energy protection measure",
        "One escalation containment protocol",
      ],
      vp: {
        complete: 50,
        bonus: 20,
      },
    },
    composureStandard: {
      id: "composure-standard",
      title: "Composure Standard",
      fields: [
        "My vocal pacing standard",
        "My posture standard during disagreement",
        "My activation-threshold rule",
        "My directive tone standard",
        "My listening minimum",
      ],
      vp: {
        complete: 40,
        bonus: 10,
      },
    },
  },
  {
    id: "module-9",
    order: 9,
    title: "Behavioral Consistency & Performance Discipline™",
    displayTitle: "Behavioral Discipline & Performance Habits",
    subtitle:
      "Building the behavioral consistency required for effective leadership performance",
    duration: "7 days",
    coreSkill: "Behavioral Consistency",
    rewardVp: 350,
    badge: "Behavioral Discipline Builder",
    chain: [
      "Condition",
      "Default Pattern",
      "Behavior",
      "Reinforcement",
      "Correction",
      "Disciplined Standard",
      "Performance Outcome",
    ],
    goal:
      "Help the user identify repeated leadership behaviors, correct unproductive habits, reinforce disciplined standards, and build reliable daily leadership execution.",
    completionRequirements: [
      "Complete all 7 days",
      "Create one Leadership Standard Integration Plan",
      "Complete one Behavioral Standards Commitment",
    ],
    days: [
      {
        day: 1,
        title: "Behavioral Pattern Audit",
        goal:
          "Identify recurring behavior patterns that shape leadership execution.",
        exercises: [
          "Describe one situation or context.",
          "Write the behavior you repeated.",
          "Identify what reinforced that behavior.",
          "Write the immediate result.",
          "Assess whether the behavior strengthened or weakened leadership execution.",
        ],
        validation: [
          "User must describe a real leadership situation.",
          "User must identify a repeated behavior.",
          "User must assess the effect on execution, communication, or follow-through.",
        ],
        fallbackQuestion:
          "Is this behavior aligned with disciplined leadership, or is it simply a repeated routine?",
        vp: {
          start: 10,
          complete: 25,
          bonus: 10,
        },
      },
      {
        day: 2,
        title: "Behavioral Default Patterns",
        goal:
          "Evaluate familiar response patterns that influence leadership conduct under pressure.",
        exercises: [
          "Describe one situation where you relied on a familiar response pattern.",
          "Write the repeated behavior you noticed.",
          "Identify what reinforced the pattern.",
          "Describe how the behavior influenced the outcome.",
          "Write what a more disciplined response would look like.",
        ],
        validation: [
          "User must identify a default behavior.",
          "User must connect the behavior to a leadership outcome.",
          "User must create one disciplined alternative.",
        ],
        fallbackQuestion:
          "Are you acting from disciplined leadership judgment, or from a familiar default pattern?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 3,
        title: "Reinforcement Conditions",
        goal:
          "Identify workplace conditions that reinforce repeated leadership behaviors.",
        exercises: [
          "Describe the workplace condition or pressure.",
          "Write the repeated behavior that followed.",
          "Identify what reinforced the pattern.",
          "Describe the impact on execution, communication, or decision quality.",
          "Write whether this condition strengthens or weakens leadership reliability.",
        ],
        validation: [
          "User must identify a workplace condition.",
          "User must identify the repeated behavior that followed.",
          "User must explain the reinforcement effect.",
        ],
        fallbackQuestion:
          "What condition is influencing your conduct right now?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 4,
        title: "Correct and Replace",
        goal:
          "Correct unproductive behavior before it becomes a standard of execution.",
        exercises: [
          "Identify the condition influencing the behavior.",
          "Identify the unproductive behavior beginning to appear.",
          "Choose the disciplined leadership behavior that should replace it.",
          "Apply the correction.",
          "Record the outcome.",
        ],
        validation: [
          "User must identify behavioral drift.",
          "User must choose a replacement behavior.",
          "User must describe the result of the correction.",
        ],
        fallbackQuestion:
          "What behavior would reflect a stronger leadership standard in this moment?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 5,
        title: "Standard Reinforcement",
        goal:
          "Reinforce one productive leadership behavior through repeated use.",
        exercises: [
          "Choose one leadership behavior to reinforce today.",
          "Write where you applied it.",
          "Describe how it influenced the interaction or decision.",
          "Review whether repetition became easier during the day.",
          "Write how this behavior strengthens leadership credibility.",
        ],
        validation: [
          "User must choose one specific behavior.",
          "User must apply it in a real situation.",
          "User must describe the effect of repetition.",
        ],
        fallbackQuestion:
          "What action reflects the leadership standard you want to strengthen today?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 6,
        title: "Consistency Protection",
        goal:
          "Maintain disciplined leadership standards under pressure, fatigue, and changing demand.",
        exercises: [
          "Describe one situation that created demand.",
          "Identify the leadership standard that began to weaken.",
          "Write the behavior you applied to restore consistency.",
          "Describe the outcome.",
          "Write what this revealed about your ability to protect standards under pressure.",
        ],
        validation: [
          "User must identify a demand situation.",
          "User must identify the standard at risk.",
          "User must describe one consistency-restoring behavior.",
        ],
        fallbackQuestion:
          "What leadership standard is at risk of weakening right now?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 7,
        title: "Leadership Standard Integration",
        goal:
          "Consolidate disciplined behaviors into reliable daily leadership standards.",
        exercises: [
          "Write the behavior patterns that became clearer during this module.",
          "Choose one or two leadership standards to continue reinforcing.",
          "Write where you will apply each standard most often.",
          "Write what will remind you to apply it consistently.",
          "Write the expected benefit to leadership performance.",
          "Create one behavioral commitment moving forward.",
        ],
        validation: [
          "User must identify at least one behavior pattern.",
          "User must define one continuing leadership standard.",
          "User must create one practical reinforcement plan.",
        ],
        fallbackQuestion:
          "Which standard must now guide your leadership behavior daily?",
        vp: {
          complete: 50,
          moduleBonus: 50,
        },
      },
    ],
    integrationPlan: {
      id: "leadership-standard-integration-plan",
      title: "Leadership Standard Integration Plan",
      fields: [
        "Leadership standard I will strengthen",
        "Where I will apply it most often",
        "What will remind me to apply it consistently",
        "Expected benefit to my leadership performance",
      ],
      vp: {
        complete: 30,
        bonus: 20,
      },
    },
    standardsCommitment: {
      id: "behavioral-standards-commitment",
      title: "Behavioral Standards Commitment",
      fields: [
        "Leadership behavior I will intentionally reinforce",
        "Situations where I will apply this behavior most often",
        "How I will remind myself to apply it consistently",
        "How this behavior will improve my leadership effectiveness",
      ],
      vp: {
        complete: 30,
        bonus: 20,
      },
    },
  },
  {
    id: "module-10",
    order: 10,
    title: "High-Stress Environment Stabilization™",
    displayTitle: "High-Stress Environment Stabilization",
    subtitle:
      "Leadership composure and decision stability framework for high-pressure operations",
    duration: "30 days",
    coreSkill: "High-Stress Leadership Stabilization",
    rewardVp: 1200,
    badge: "Executive Composure Integrator",
    chain: [
      "Pressure",
      "Interpretation",
      "Activation",
      "Composure",
      "Decision",
      "Behavior",
      "Operational Stability",
    ],
    goal:
      "Help the user integrate composure stability, decision stability, and behavioral consistency into a reliable leadership operating standard under sustained pressure.",
    completionRequirements: [
      "Complete all 30 days",
      "Complete the Executive Stability Scorecard",
      "Create one Leadership Composure Blueprint",
      "Create one 30-day continuation commitment",
    ],
    weeks: [
      {
        week: 1,
        title: "Pressure Detection Architecture",
        focus:
          "Detect operational pressure, interpretation shifts, internal activation, pressure narratives, and cognitive distortion before instability becomes visible.",
      },
      {
        week: 2,
        title: "Composure Stabilization Under Operational Pressure",
        focus:
          "Stabilize tone, communication, authority, pacing, emotional neutrality, and executive presence during active operational tension.",
      },
      {
        week: 3,
        title: "Pressure Endurance & Energy Architecture",
        focus:
          "Protect decision clarity, energy, composure, cognitive reset, and leadership sustainability across prolonged operational pressure.",
      },
      {
        week: 4,
        title: "Leadership Identity Consolidation",
        focus:
          "Strengthen detached authority, psychological sovereignty, identity stability, approval independence, non-reactive posture, and full composure integration.",
      },
    ],
    days: [
      {
        day: 1,
        title: "Operational Pressure Activation",
        goal:
          "Identify operational situations that activate pressure before they influence leadership behavior.",
        exercises: [
          "Describe the operational condition or activation point.",
          "Write the immediate internal shift you noticed.",
          "Describe how pressure affected your interpretation.",
          "Write the leadership response that followed.",
          "Identify whether the pressure was operational urgency or internal acceleration.",
        ],
        validation: [
          "User must identify a real operational pressure point.",
          "User must describe the internal pressure shift.",
          "User must connect pressure to interpretation or response.",
        ],
        fallbackQuestion:
          "What is activating pressure in you right now?",
        vp: {
          start: 10,
          complete: 25,
          bonus: 10,
        },
      },
      {
        day: 2,
        title: "Pressure Interpretation Discipline",
        goal:
          "Separate verified facts from pressure-shaped assumptions.",
        exercises: [
          "Write the operational event.",
          "Write the immediate interpretation.",
          "Identify whether the interpretation was fact or assumption.",
          "Describe how the interpretation influenced your response.",
          "Rewrite the interpretation using confirmed facts only.",
        ],
        validation: [
          "User must identify event and interpretation separately.",
          "User must classify fact versus assumption.",
          "User must rewrite with verified reality.",
        ],
        fallbackQuestion:
          "What are the confirmed facts here?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 3,
        title: "Emotional Activation Mapping",
        goal:
          "Map how pressure-shaped interpretation increases internal activation.",
        exercises: [
          "Write the operational event.",
          "Write the interpretation that formed first.",
          "Name the internal activation state.",
          "Describe how activation affected communication or behavior.",
          "Identify where awareness could have entered earlier.",
        ],
        validation: [
          "User must identify interpretation before activation.",
          "User must name the activation state.",
          "User must connect activation to behavior.",
        ],
        fallbackQuestion:
          "What interpretation is increasing this activation right now?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 4,
        title: "Reaction vs. Response",
        goal:
          "Convert pressure-driven reaction into deliberate leadership response.",
        exercises: [
          "Describe the stimulus that triggered the situation.",
          "Write the immediate reaction impulse.",
          "State whether you created a pause before acting.",
          "Describe how the final response differed from the impulse.",
          "Write what a disciplined response required.",
        ],
        validation: [
          "User must identify reaction impulse.",
          "User must compare impulse with response.",
          "User must describe the stabilizing pause or missed pause.",
        ],
        fallbackQuestion:
          "Is pressure accelerating you into reaction right now?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 5,
        title: "Pressure Narrative Identification",
        goal:
          "Identify internal narratives that intensify pressure beyond verified facts.",
        exercises: [
          "Write the operational event.",
          "Write the internal pressure narrative.",
          "Describe how the narrative affected activation or communication.",
          "Identify whether it increased urgency or severity.",
          "Rewrite the narrative using verified facts.",
        ],
        validation: [
          "User must identify the internal narrative.",
          "User must separate narrative from fact.",
          "User must rewrite with verified facts.",
        ],
        fallbackQuestion:
          "What narrative are you constructing about this event right now?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 6,
        title: "Cognitive Distortion Under Pressure",
        goal:
          "Detect where pressure narrows perception and weakens interpretive accuracy.",
        exercises: [
          "Write the operational event.",
          "Write the rapid conclusion that formed.",
          "Identify the possible pressure distortion.",
          "Write what additional information is needed.",
          "Create a more accurate interpretation.",
        ],
        validation: [
          "User must identify a rapid conclusion.",
          "User must name a possible distortion.",
          "User must request or define missing information.",
        ],
        fallbackQuestion:
          "What evidence supports this interpretation?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 7,
        title: "Pressure Detection Calibration",
        goal:
          "Review pressure activation, interpretation discipline, internal activation, response control, narrative awareness, and perception accuracy.",
        exercises: [
          "Rate pressure activation awareness.",
          "Rate interpretation discipline.",
          "Rate internal activation recognition.",
          "Rate response discipline under pressure.",
          "Rate narrative awareness.",
          "Rate perception accuracy under pressure.",
          "Choose one pressure pattern to stabilize next week.",
        ],
        validation: [
          "User must complete the weekly calibration.",
          "User must identify one pressure pattern.",
          "User must choose one Week 2 priority.",
        ],
        fallbackQuestion:
          "Which pressure pattern created the greatest leadership risk this week?",
        vp: {
          complete: 50,
          moduleBonus: 20,
        },
      },
      {
        day: 8,
        title: "Tone Control in Escalation",
        goal:
          "Stabilize leadership tone during escalating operational conversations.",
        exercises: [
          "Describe the operational event that triggered the conversation.",
          "Write how your tone shifted.",
          "Describe how others responded to your tone.",
          "Write how a more controlled tone could change the outcome.",
          "Choose one tone-control action to practice.",
        ],
        validation: [
          "User must identify a real tense conversation.",
          "User must describe tone shift.",
          "User must connect tone to team response.",
        ],
        fallbackQuestion:
          "Does your tone reflect leadership control, or visible pressure?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 9,
        title: "Neutral Communication",
        goal:
          "Deliver difficult messages with clarity, structure, and emotional neutrality.",
        exercises: [
          "Describe the operational issue requiring communication.",
          "Name the internal activation present.",
          "Write how you regulated delivery.",
          "Describe how others responded.",
          "Rewrite the message with fact, expectation, and next step.",
        ],
        validation: [
          "User must identify internal activation.",
          "User must describe message delivery.",
          "User must rewrite with neutral structure.",
        ],
        fallbackQuestion:
          "Can you deliver this message with clarity, structure, and control?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 10,
        title: "Authority During Disagreement",
        goal:
          "Maintain authority without defensiveness during disagreement.",
        exercises: [
          "Describe the issue that generated disagreement.",
          "Write the first interpretation that formed.",
          "Describe how you regulated your response.",
          "Write how the conversation evolved.",
          "Identify how authority remained stable or became defensive.",
        ],
        validation: [
          "User must describe disagreement.",
          "User must identify interpretation.",
          "User must evaluate authority stability.",
        ],
        fallbackQuestion:
          "Are you hearing resistance, or receiving information that requires evaluation?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 11,
        title: "Controlled Response in Meetings",
        goal:
          "Control response timing during high-tension meetings.",
        exercises: [
          "Describe the issue that created tension.",
          "Write the response impulse you noticed.",
          "State whether you paused before responding.",
          "Describe how the conversation evolved after your response.",
          "Write what disciplined timing required.",
        ],
        validation: [
          "User must identify response impulse.",
          "User must describe pause or immediate response.",
          "User must connect timing to meeting stability.",
        ],
        fallbackQuestion:
          "Do you need to respond now, or understand more first?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 12,
        title: "Authority Without Escalation",
        goal:
          "Reinforce authority without relying on emotional intensity.",
        exercises: [
          "Describe the issue requiring leadership intervention.",
          "Name the internal activation that emerged.",
          "Write how you regulated tone, pace, or style.",
          "Describe how others responded.",
          "Write the firm but controlled version of your message.",
        ],
        validation: [
          "User must identify an authority moment.",
          "User must distinguish standard reinforcement from emotional intensity.",
          "User must write a controlled authority message.",
        ],
        fallbackQuestion:
          "Are you reinforcing standards, or increasing intensity?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 13,
        title: "Neutrality During Disruption",
        goal:
          "Maintain emotional neutrality during operational disruption.",
        exercises: [
          "Describe the disruption.",
          "Name the internal activation that emerged.",
          "Write how you regulated communication, tone, or posture.",
          "Describe how the team responded.",
          "Identify how neutrality affected coordination.",
        ],
        validation: [
          "User must identify an operational disruption.",
          "User must describe internal activation.",
          "User must connect neutrality to team response.",
        ],
        fallbackQuestion:
          "Can you address this issue with calm structure instead of emotional urgency?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 14,
        title: "Executive Presence During Escalation",
        goal:
          "Use visible leadership presence as a stabilizing force during escalation.",
        exercises: [
          "Describe the event that triggered escalation.",
          "Name the internal pressure you noticed.",
          "Write how you regulated posture, tone, or pacing.",
          "Describe how others responded to your presence.",
          "Identify what your presence signaled to the environment.",
        ],
        validation: [
          "User must describe escalation.",
          "User must identify visible leadership signals.",
          "User must connect presence to environmental stability.",
        ],
        fallbackQuestion:
          "Does your presence reflect pressure, or does it reflect control?",
        vp: {
          complete: 50,
          moduleBonus: 20,
        },
      },
      {
        day: 15,
        title: "Composure When Authority Is Questioned",
        goal:
          "Remain composed when authority, judgment, or direction is challenged.",
        exercises: [
          "Describe what triggered the challenge.",
          "Write the internal interpretation that emerged.",
          "Describe how you regulated your response.",
          "Write how the discussion evolved.",
          "Identify whether you responded to the issue or defended position.",
        ],
        validation: [
          "User must identify a direct or indirect authority challenge.",
          "User must describe internal interpretation.",
          "User must assess defensiveness versus composure.",
        ],
        fallbackQuestion:
          "Are you responding to the issue, or defending your position?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 16,
        title: "Decision Clarity Under Pressure",
        goal:
          "Protect structured evaluation when pressure demands quick decisions.",
        exercises: [
          "Describe the situation requiring a decision.",
          "Name the pressure factors present.",
          "State whether you paused to evaluate before deciding.",
          "Write the actual objective of the decision.",
          "Describe how the decision influenced the outcome.",
        ],
        validation: [
          "User must describe a pressure decision.",
          "User must identify decision objective.",
          "User must assess clarity versus acceleration.",
        ],
        fallbackQuestion:
          "What is the actual objective of this decision?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 17,
        title: "Decision Fatigue Awareness",
        goal:
          "Recognize when repeated decision demand reduces precision.",
        exercises: [
          "Describe the decision or issue requiring attention.",
          "Name the mental state you noticed.",
          "State whether you slowed the decision or responded immediately.",
          "Describe how the outcome reflected your clarity level.",
          "Write one pacing adjustment for future decisions.",
        ],
        validation: [
          "User must identify cognitive fatigue or reduced precision.",
          "User must connect fatigue to decision behavior.",
          "User must create one decision-pacing adjustment.",
        ],
        fallbackQuestion:
          "Is this decision shaped by clarity, or by accumulated mental fatigue?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 18,
        title: "Leadership Energy Management",
        goal:
          "Observe how energy levels influence clarity, communication, and decision effectiveness.",
        exercises: [
          "Describe the activity you were engaged in.",
          "Name the energy state you noticed.",
          "Describe how energy affected communication or decisions.",
          "State whether you introduced a pause, reset, or pacing adjustment.",
          "Write one energy-management improvement for tomorrow.",
        ],
        validation: [
          "User must identify energy state.",
          "User must connect energy to behavior.",
          "User must define one adjustment.",
        ],
        fallbackQuestion:
          "What is your current energy state, and how is it affecting your leadership?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 19,
        title: "Composure Across Pressure Cycles",
        goal:
          "Maintain composure across accumulated operational pressure.",
        exercises: [
          "Describe the operational pressure that had been building.",
          "Name the internal reaction you noticed.",
          "Describe how you regulated your response.",
          "Write how others responded to your tone or communication.",
          "Identify whether the response matched the current issue or accumulated pressure.",
        ],
        validation: [
          "User must identify accumulated pressure.",
          "User must separate current issue from pressure carryover.",
          "User must describe response regulation.",
        ],
        fallbackQuestion:
          "Is this situation shaping your response, or is accumulated pressure carrying into it?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 20,
        title: "Cognitive Reset Under Load",
        goal:
          "Use short resets to protect decision quality during sustained demand.",
        exercises: [
          "Describe the activity or decision taking place.",
          "Name the mental signals of increasing load.",
          "State whether you introduced a brief reset.",
          "Describe how clarity changed after the reset.",
          "Write where resets should be placed in your schedule.",
        ],
        validation: [
          "User must identify cognitive load.",
          "User must describe reset or missed reset.",
          "User must assess clarity change.",
        ],
        fallbackQuestion:
          "Is your current response shaped by clarity, or by cognitive overload?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 21,
        title: "Burnout Prevention Through Regulation",
        goal:
          "Identify early strain signals before they weaken leadership performance.",
        exercises: [
          "Describe the operational demand present.",
          "Name the strain signal you noticed.",
          "Describe how you regulated your response.",
          "Write what restored clarity, steadiness, or composure.",
          "Choose one sustainability adjustment for tomorrow.",
        ],
        validation: [
          "User must identify strain signal.",
          "User must connect strain to leadership behavior.",
          "User must choose one sustainability adjustment.",
        ],
        fallbackQuestion:
          "What is this signal telling you about your current level of strain?",
        vp: {
          complete: 50,
          moduleBonus: 20,
        },
      },
      {
        day: 22,
        title: "Detached Authority",
        goal:
          "Separate role responsibility from personal validation.",
        exercises: [
          "Describe the situation where authority was exercised, questioned, or tested.",
          "Write the internal interpretation that occurred.",
          "Describe how you regulated your response.",
          "Write how the interaction unfolded.",
          "Identify whether authority remained role-based or became personal.",
        ],
        validation: [
          "User must identify an authority moment.",
          "User must assess personal meaning versus role clarity.",
          "User must describe detached response.",
        ],
        fallbackQuestion:
          "Is this an operational issue, or are you turning it into a personal issue?",
        vp: {
          complete: 30,
          bonus: 10,
        },
      },
      {
        day: 23,
        title: "Psychological Sovereignty",
        goal:
          "Keep internal stability stronger than external feedback, pressure, praise, or criticism.",
        exercises: [
          "Describe the external signal that occurred.",
          "Name the internal reaction you noticed.",
          "Describe how you regulated your response.",
          "Write how maintaining stability influenced the interaction.",
          "Identify whether your leadership was governed internally or externally.",
        ],
        validation: [
          "User must identify external influence.",
          "User must describe internal reaction.",
          "User must assess internal command.",
        ],
        fallbackQuestion:
          "Can you receive this information without allowing it to control your leadership posture?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 24,
        title: "Identity Stability Across Environments",
        goal:
          "Maintain leadership identity across different audiences and hierarchy levels.",
        exercises: [
          "Describe the environment or audience present.",
          "Write any shift in tone, posture, or communication style.",
          "Describe how you regulated leadership presence.",
          "Write how maintaining stability influenced the interaction.",
          "Identify where identity was stable or environment-dependent.",
        ],
        validation: [
          "User must identify environment or audience.",
          "User must assess leadership posture shift.",
          "User must describe stability regulation.",
        ],
        fallbackQuestion:
          "Are you changing communication style appropriately, or changing your leadership posture?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 25,
        title: "Independence from Approval",
        goal:
          "Keep authority grounded in clarity instead of approval.",
        exercises: [
          "Describe the decision or discussion.",
          "Write the external reaction you noticed.",
          "Describe whether that reaction influenced communication or decision.",
          "Write how restoring clarity affected the outcome.",
          "Create one approval-independence statement.",
        ],
        validation: [
          "User must identify approval pressure.",
          "User must assess influence on behavior.",
          "User must restore clarity through role logic.",
        ],
        fallbackQuestion:
          "Are you leading from clarity, or from the need to be approved?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 26,
        title: "Non-Reactive Leadership Posture",
        goal:
          "Remain steady when others become emotionally activated.",
        exercises: [
          "Describe the event that triggered emotional reaction in another person.",
          "Write the internal reaction you noticed in yourself.",
          "Describe how you regulated tone, posture, or communication.",
          "Write how the conversation changed after your response.",
          "Identify whether you absorbed or stabilized the reaction.",
        ],
        validation: [
          "User must identify emotional reaction from others.",
          "User must name internal reaction.",
          "User must describe non-reactive regulation.",
        ],
        fallbackQuestion:
          "Can you remain steady without absorbing this reaction into your own behavior?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 27,
        title: "Strategic Silence",
        goal:
          "Use disciplined silence to improve clarity and response quality.",
        exercises: [
          "Describe the discussion topic that triggered the impulse to respond.",
          "Write the internal interpretation that occurred.",
          "State how long you allowed the conversation to continue before responding.",
          "Describe whether more information emerged during the pause.",
          "Write how silence affected the final response.",
        ],
        validation: [
          "User must identify response impulse.",
          "User must use or evaluate a pause.",
          "User must describe what silence revealed.",
        ],
        fallbackQuestion:
          "Does this moment require your response now, or would the discussion benefit from more space first?",
        vp: {
          complete: 35,
          bonus: 10,
        },
      },
      {
        day: 28,
        title: "Composure During Uncertainty",
        goal:
          "Maintain stability when information is incomplete or evolving.",
        exercises: [
          "Describe the issue or decision involving uncertainty.",
          "Name the internal reaction you noticed.",
          "Describe how you regulated communication, posture, or decision pace.",
          "Write how your response influenced confidence or discussion quality.",
          "Separate what is known, unknown, and still under evaluation.",
        ],
        validation: [
          "User must identify uncertainty.",
          "User must separate known from unknown.",
          "User must avoid false certainty or rushed closure.",
        ],
        fallbackQuestion:
          "What is known, what is unknown, and what still requires evaluation?",
        vp: {
          complete: 40,
          bonus: 10,
        },
      },
      {
        day: 29,
        title: "Leadership Composure Blueprint",
        goal:
          "Define the core disciplines that stabilize leadership under pressure.",
        exercises: [
          "Identify three practices that stabilize your response under pressure.",
          "Write where each practice must be applied most consistently.",
          "Write the internal signal that activates each practice.",
          "Write how each discipline strengthens leadership over time.",
          "Create your personal composure blueprint.",
        ],
        validation: [
          "User must identify three stabilizing disciplines.",
          "User must connect each discipline to situations and signals.",
          "User must create a practical blueprint.",
        ],
        fallbackQuestion:
          "What stabilizes you most reliably under pressure?",
        vp: {
          complete: 60,
          moduleBonus: 30,
        },
      },
      {
        day: 30,
        title: "Executive Composure Consolidation",
        goal:
          "Consolidate the full leadership stability architecture and define long-term reinforcement.",
        exercises: [
          "Complete the Executive Stability Scorecard.",
          "Identify three regulation systems to keep in daily leadership.",
          "Write where each system must be applied consistently.",
          "Write the internal signals that activate each discipline.",
          "Define how each discipline will remain active in your routine.",
          "Create your 30-day continuation commitment.",
        ],
        validation: [
          "User must complete the final scorecard.",
          "User must identify three long-term regulation systems.",
          "User must create one continuation commitment.",
        ],
        fallbackQuestion:
          "Which regulation disciplines now form the core of your leadership stability?",
        vp: {
          complete: 70,
          moduleBonus: 100,
        },
      },
    ],
    indexes: [
      {
        id: "pressure-detection-calibration",
        title: "Pressure Detection Calibration",
        day: 7,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Pressure Activation Awareness",
          "Interpretation Discipline",
          "Internal Activation Recognition",
          "Response Discipline Under Pressure",
          "Narrative Awareness",
          "Perception Accuracy Under Pressure",
        ],
        maxScore: 60,
      },
      {
        id: "executive-stability-scorecard",
        title: "Executive Stability Scorecard",
        day: 30,
        scale: {
          min: 1,
          max: 10,
        },
        dimensions: [
          "Pressure Detection",
          "Tone Discipline",
          "Authority Stability",
          "Response Pacing",
          "Decision Clarity",
          "Emotional Regulation",
          "Energy Regulation",
          "Identity Stability",
          "Non-Reactive Leadership Posture",
          "Composure Consistency",
        ],
        maxScore: 100,
        interpretation: [
          {
            min: 85,
            max: 100,
            label: "Strong composure integration",
          },
          {
            min: 70,
            max: 84,
            label: "Good regulation with a clear stability foundation",
          },
          {
            min: 55,
            max: 69,
            label: "Moderate regulation with inconsistent application under pressure",
          },
          {
            min: 0,
            max: 54,
            label: "Composure requires stronger daily reinforcement and calibration",
          },
        ],
      },
    ],
    composureBlueprint: {
      id: "leadership-composure-blueprint",
      title: "Leadership Composure Blueprint",
      fields: [
        "Three practices that stabilize my response under pressure",
        "Situations where each practice must be applied",
        "Internal signals that activate each practice",
        "How each discipline strengthens leadership stability over time",
      ],
      vp: {
        complete: 60,
        bonus: 30,
      },
    },
    leadershipCommitment: {
      id: "leadership-stability-commitment",
      title: "Leadership Stability Commitment",
      fields: [
        "The leadership discipline I will maintain daily",
        "The situations where I most need to apply this discipline",
        "The internal signals that indicate my regulation is weakening",
        "The immediate action I will take to restore composure",
        "The leadership standard I now commit to protecting consistently",
      ],
      vp: {
        complete: 40,
        bonus: 20,
      },
    },
    continuationPlan: {
      id: "thirty-day-continuation-plan",
      title: "30-Day Continuation Plan",
      fields: [
        "Three leadership disciplines I will continue daily",
        "Three situations where I most need regulation",
        "Three warning signs that indicate instability is increasing",
        "My 30-day continuation commitment",
      ],
      vp: {
        complete: 40,
        bonus: 20,
      },
    },
    finalAffirmation:
      "I will lead with composure under pressure, clarity under uncertainty, and stability under scrutiny. I will regulate tone, pace, judgment, and authority consistently across operational conditions.",
  },
];