

export const DEFAULT_VIRTUS_PLAN = "trial_guest";

export const DEFAULT_VIRTUS_PLAN_STATUS = "active";
export const VIRTUS_PLAN_DEFINITIONS = {
  trial_guest: {
    plan: "trial_guest",
    label: "Trial Guest",
    status: "trialing",
    isGuest: true,
    isPaid: false,
    isTrial: true,
    inheritsPremiumExperience: true,
    description: "3-day premium-style trial without signup at the start. Registration is required after the trial ends.",
    projectScope: {
      canUseProjects: true,
      maxProjects: 1,
    },
  },

  free: {
    plan: "free",
    label: "Free",
    status: "active",
    isGuest: false,
    isPaid: false,
    isTrial: false,
    inheritsPremiumExperience: false,
    description: "Registered entry plan with saved chats, standard usage, and basic continuity.",
    projectScope: {
      canUseProjects: true,
      maxProjects: 3,
    },
  },

  plus: {
    plan: "plus",
    label: "Plus",
    status: "active",
    isGuest: false,
    isPaid: true,
    isTrial: false,
    inheritsPremiumExperience: false,
    description: "Life-coach layer with stronger continuity, better memory, and more personal support.",
    projectScope: {
      canUseProjects: true,
      maxProjects: 5,
    },
  },

  premium: {
    plan: "premium",
    label: "Premium / Virtus Prime",
    status: "active",
    isGuest: false,
    isPaid: true,
    isTrial: false,
    inheritsPremiumExperience: true,
    description: "Highest strategic layer with deeper continuity, stronger personalization, and advanced project support.",
    projectScope: {
      canUseProjects: true,
      maxProjects: null,
    },
  },
};
export function getPlanDefinition(plan) {
  return VIRTUS_PLAN_DEFINITIONS[plan] ?? VIRTUS_PLAN_DEFINITIONS[DEFAULT_VIRTUS_PLAN];
}
export function isTrialGuestPlan(plan) {
  return getPlanDefinition(plan).plan === "trial_guest";
}
export function isGuestPlan(plan) {
  return getPlanDefinition(plan).isGuest === true;
}
export function isPaidPlan(plan) {
  return getPlanDefinition(plan).isPaid === true;
}
export function hasPremiumExperience(plan) {
  return getPlanDefinition(plan).inheritsPremiumExperience === true;
}
export function getDefaultPlanStatusForPlan(plan) {
  return getPlanDefinition(plan).status ?? DEFAULT_VIRTUS_PLAN_STATUS;
}
export function isFreePlan(plan) {
  return getPlanDefinition(plan).plan === "free";
}
export function isPlusPlan(plan) {
  return getPlanDefinition(plan).plan === "plus";
}
export function isPremiumPlan(plan) {
  return getPlanDefinition(plan).plan === "premium";
}
export function isRegisteredAccountPlan(plan) {
  return isGuestPlan(plan) === false;
}
export function getPlanLabel(plan) {
  return getPlanDefinition(plan).label ?? "Free";
}
export function getPlanDescription(plan) {
  return getPlanDefinition(plan).description ?? "";
}
export function isDefaultPlan(plan) {
  return getPlanDefinition(plan).plan === DEFAULT_VIRTUS_PLAN;
}
export function getPlanKey(plan) {
  return getPlanDefinition(plan).plan;
}
export function getProjectScope(plan) {
  const key = getPlanKey(plan);

  return (
    VIRTUS_PLAN_DEFINITIONS[key]?.projectScope ?? {
      canUseProjects: false,
      maxProjects: 0,
    }
  );
}
export function getPlanStatusLabel(plan) {
  return getPlanDefinition(plan).status ?? DEFAULT_VIRTUS_PLAN_STATUS;
}
export function isExpiredPlanStatus(planStatus) {
  return planStatus === "expired";
}
export function allowsPersonalContinuity(plan) {
  return isPremiumPlan(plan) || isPlusPlan(plan) || isTrialGuestPlan(plan);
}
export function getSupportLayer(plan) {
  if (isTrialGuestPlan(plan)) return "strategic";
  if (isPremiumPlan(plan)) return "strategic";
  if (isPlusPlan(plan)) return "coaching";
  if (isFreePlan(plan)) return "standard";

  return "standard";
}

export function getPlanPolicy(plan) {
  return {
    plan: getPlanKey(plan),
    label: getPlanLabel(plan),
    description: getPlanDescription(plan),
    status: getPlanStatusLabel(plan),
    trialDays: getTrialDays(plan),
    requiresRegistrationAfterTrial: requiresRegistrationAfterTrial(plan),
    blocksWhenExpired: blocksWhenExpired(plan),
    nextPlan: getNextPlan(plan),
    upgradeLabel: getUpgradeLabel(plan),
    dailyMessageLimit: getDailyMessageLimit(plan),
    recentConversationLimit: getRecentConversationLimit(plan),
    singleChatMemoryLimit: getSingleChatMemoryLimit(plan),
    runtimeFactsLimit: getRuntimeFactsLimit(plan),
    allowsSavedChats: allowsSavedChats(plan),
    allowsProjectContinuity: allowsProjectContinuity(plan),
    allowsPersonalContinuity: allowsPersonalContinuity(plan),
    allowsCrossChatMemory: allowsCrossChatMemory(plan),
    allowsPersonalMemoryWrites: allowsPersonalMemoryWrites(plan),
    allowsProjectMemoryWrites: allowsProjectMemoryWrites(plan),
    projectScope: getProjectScope(plan),
    supportLayer: getSupportLayer(plan),
    isPremiumLike: isPremiumLikePlan(plan),
    isPaid: isPaidPlan(plan),
  };
}

export function getDailyMessageLimit(plan) {
  const planKey = getPlanKey(plan);

  if (planKey === "trial_guest") return 60;
  if (planKey === "free") return 40;
  if (planKey === "plus") return 120;
  if (planKey === "premium") return null;

  return 40;
}

export function getRecentConversationLimit(plan) {
  const planKey = getPlanKey(plan);

  if (planKey === "trial_guest") return 20;
  if (planKey === "free") return 4;
  if (planKey === "plus") return 12;
  if (planKey === "premium") return null;

  return 4;
}

export function getSingleChatMemoryLimit(plan) {
  return getRecentConversationLimit(plan);
}

export function getRuntimeFactsLimit(plan) {
  const planKey = getPlanKey(plan);

  if (planKey === "trial_guest") return 20;
  if (planKey === "free") return 4;
  if (planKey === "plus") return 12;
  if (planKey === "premium") return null;

  return 4;
}

export function getTrialDays(plan) {
  if (isTrialGuestPlan(plan)) return 3;
  return null;
}

export function requiresRegistrationAfterTrial(plan) {
  return isTrialGuestPlan(plan);
}

export function blocksWhenExpired(plan) {
  return isTrialGuestPlan(plan);
}

export function allowsSavedChats(plan) {
  return true;
}

export function allowsProjectContinuity(plan) {
  return isPremiumPlan(plan) || isTrialGuestPlan(plan);
}

export function allowsCrossChatMemory(plan) {
  return isPremiumPlan(plan) || isPlusPlan(plan) || isTrialGuestPlan(plan);
}

export function allowsPersonalMemoryWrites(plan) {
  return isPremiumPlan(plan) || isPlusPlan(plan) || isTrialGuestPlan(plan);
}

export function allowsProjectMemoryWrites(plan) {
  return isPremiumPlan(plan) || isTrialGuestPlan(plan);
}

export function getNextPlan(plan) {
  if (isTrialGuestPlan(plan)) return "free";
  if (isFreePlan(plan)) return "plus";
  if (isPlusPlan(plan)) return "premium";
  return null;
}

export function getUpgradeLabel(plan) {
  const nextPlan = getNextPlan(plan);

  if (nextPlan === "free") return "Register to continue";
  if (nextPlan === "plus") return "Upgrade to Plus";
  if (nextPlan === "premium") return "Upgrade to Premium / Virtus Prime";

  return null;
}

export function isPremiumLikePlan(plan) {
  return hasPremiumExperience(plan);
}

