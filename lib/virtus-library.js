const MODULE_HINTS = [
  {
    module: 1,
    words: [
      "respond",
      "reaction",
      "communicate",
      "communication",
      "behavior",
      "emotion",
      "pause",
      "listen",
      "message",
      "leadership response",
    ],
  },
  {
    module: 2,
    words: [
      "blame",
      "responsibility",
      "accountability",
      "ownership",
      "fault",
      "excuse",
      "not listening",
      "team",
      "standard",
      "consequence",
    ],
  },
  {
    module: 3,
    words: [
      "trigger",
      "angry",
      "frustrated",
      "reactive",
      "emotion",
      "pattern",
      "stress",
      "pressure",
      "defensive",
      "overwhelmed",
    ],
  },
  {
    module: 4,
    words: [
      "identity",
      "blind spot",
      "self-perception",
      "judgment",
      "ego",
      "defensive",
      "authority",
      "question my decisions",
      "criticized",
    ],
  },
  {
    module: 5,
    words: [
      "thought",
      "awareness",
      "overthinking",
      "confused",
      "interpretation",
      "meaning",
      "assumption",
      "mind",
      "observe",
      "belief",
    ],
  },
  {
    module: 6,
    words: [
      "decision",
      "decisions",
      "operational",
      "prioritize",
      "clarity",
      "execution",
      "risk",
      "options",
      "strategy",
    ],
  },
  {
    module: 7,
    words: [
      "focus",
      "attention",
      "energy",
      "cognitive",
      "distraction",
      "mental performance",
      "concentration",
      "fatigue",
    ],
  },
  {
    module: 8,
    words: [
      "regulation",
      "emotional control",
      "stabilize",
      "calm",
      "pressure",
      "reactivity",
      "nervous system",
      "self-control",
    ],
  },
  {
    module: 9,
    words: [
      "habit",
      "discipline",
      "repeat",
      "consistency",
      "performance",
      "behavior",
      "routine",
      "procrastination",
      "control",
      "follow through",
    ],
  },
  {
    module: 10,
    words: [
      "crisis",
      "high stress",
      "emergency",
      "pressure",
      "stabilize",
      "panic",
      "chaos",
      "conflict",
      "urgent",
      "overload",
    ],
  },
];

const CATEGORY_HINTS = [
  {
    category: "emotional-intelligence",
    words: [
      "emotional intelligence",
      "emotion",
      "emotional",
      "feelings",
      "trigger",
      "angry",
      "anger",
      "reactive",
      "regulation",
      "empathy",
      "validation",
      "maturity",
    ],
  },
  {
    category: "relationships",
    words: [
      "relationship",
      "relationships",
      "partner",
      "trust",
      "betrayal",
      "intimacy",
      "attachment",
      "love",
      "vulnerability",
      "repair",
      "conflict",
    ],
  },
  {
    category: "marriage",
    words: [
      "marriage",
      "couple",
      "wife",
      "husband",
      "spouse",
      "togetherness",
      "partnership",
      "married",
      "marry",
      "wedding",
    ],
  },
  {
    category: "communication",
    words: [
      "communication",
      "communicate",
      "speak",
      "speaking",
      "conversation",
      "dialogue",
      "voice",
      "assertive",
      "persuasion",
      "public speaking",
      "being heard",
    ],
  },
  {
    category: "mind-discipline",
    words: [
      "mind",
      "thought",
      "thinking",
      "awareness",
      "self-awareness",
      "overthinking",
      "negative thinking",
      "self-talk",
      "focus",
      "belief",
      "higher self",
    ],
  },
  {
    category: "stress-regulation",
    words: [
      "stress",
      "anxiety",
      "panic",
      "crisis",
      "pressure",
      "grounding",
      "breathing",
      "overwhelmed",
      "calm",
      "coping",
      "stabilization",
    ],
  },
  {
    category: "habit-discipline",
    words: [
      "habit",
      "habits",
      "discipline",
      "procrastination",
      "routine",
      "consistency",
      "self-sabotage",
      "follow through",
      "behavior",
    ],
  },
  {
    category: "decision-thinking",
    words: [
      "decision",
      "decisions",
      "analytical",
      "analysis",
      "planning",
      "organizing",
      "strategy",
      "project",
      "time management",
      "delegation",
      "data",
      "stakeholder",
    ],
  },
  {
    category: "spirituality",
    words: [
      "spiritual",
      "spirituality",
      "faith",
      "meditation",
      "silence",
      "sacred",
      "purpose",
      "service",
      "energy",
      "heart",
      "soul",
    ],
  },
  {
    category: "leadership",
    words: [
      "leadership",
      "leader",
      "team",
      "manager",
      "executive",
      "authority",
      "accountability",
      "ownership",
      "performance",
      "standard",
      "work",
    ],
  },
];

function normalizeText(value = "") {
  return String(value || "").toLowerCase();
}

function detectRelevantModules(message = "") {
  const clean = normalizeText(message);

  const scored = MODULE_HINTS.map((item) => {
    const score = item.words.reduce((total, word) => {
      return clean.includes(word) ? total + 1 : total;
    }, 0);

    return {
      module: item.module,
      score,
    };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const modules = scored.map((item) => item.module);

  if (modules.length === 0) {
    return [5, 1, 2, 8];
  }

  return [...new Set(modules)].slice(0, 5);
}

function detectRelevantCategories(message = "") {
  const clean = normalizeText(message);

  const scored = CATEGORY_HINTS.map((item) => {
    const score = item.words.reduce((total, word) => {
      return clean.includes(word) ? total + 1 : total;
    }, 0);

    return {
      category: item.category,
      score,
    };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const categories = scored.map((item) => item.category);

  if (categories.length === 0) {
    return ["leadership", "mind-discipline", "emotional-intelligence"];
  }

  if (!categories.includes("leadership")) {
    categories.push("leadership");
  }

  return [...new Set(categories)].slice(0, 5);
}

function getMessageTerms(message = "") {
  return normalizeText(message)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4)
    .slice(0, 35);
}

function scoreChunk(chunk, terms, relevantCategories, relevantModules) {
  const searchable = normalizeText(
    `${chunk.category || ""} ${chunk.module_title || ""} ${chunk.title || ""} ${chunk.content || ""} ${(chunk.tags || []).join(" ")}`
  );

  let score = 0;

  if (relevantCategories.includes(chunk.category)) {
    score += 4;
  }

  if (chunk.module_number && relevantModules.includes(chunk.module_number)) {
    score += 5;
  }

  for (const term of terms) {
    if (searchable.includes(term)) {
      score += 2;
    }
  }

  if (chunk.chunk_type === "practice") score += 1;
  if (chunk.chunk_type === "reflection") score += 1;
  if (chunk.chunk_type === "framework") score += 1;
  if (chunk.chunk_type === "example") score += 1;

  return score;
}

function dedupeChunks(chunks = []) {
  const seen = new Set();

  return chunks.filter((chunk) => {
    const key = `${chunk.title || ""}-${String(chunk.content || "").slice(0, 160)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function getVirtusLibraryContext({
  supabase,
  message,
  limit = 6,
} = {}) {
  if (!supabase || !message) {
    return "";
  }

  const relevantModules = detectRelevantModules(message);
  const relevantCategories = detectRelevantCategories(message);
  const terms = getMessageTerms(message);

  const selectFields =
    "category, module_number, module_title, chunk_type, title, content, tags, use_cases";

  const { data: categoryChunks, error: categoryError } = await supabase
    .from("virtus_library_chunks")
    .select(selectFields)
    .in("category", relevantCategories)
    .limit(350);

  const { data: leadershipModuleChunks, error: moduleError } = await supabase
    .from("virtus_library_chunks")
    .select(selectFields)
    .eq("category", "leadership")
    .in("module_number", relevantModules)
    .limit(160);

  if (categoryError && moduleError) {
    return "";
  }

  const combinedChunks = dedupeChunks([
    ...(categoryChunks || []),
    ...(leadershipModuleChunks || []),
  ]);

  if (combinedChunks.length === 0) {
    return "";
  }

  const rankedChunks = combinedChunks
    .map((chunk) => ({
      ...chunk,
      relevance_score: scoreChunk(
        chunk,
        terms,
        relevantCategories,
        relevantModules
      ),
    }))
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);

  if (rankedChunks.length === 0) {
    return "";
  }

  return `
INTERNAL VIRTUS COACHING LIBRARY CONTEXT

Use this context silently as methodology.
Do not announce workbook names, library names, categories, or module names unless the user specifically asks.
Do not say "according to the workbook".
Do not say "based on the material you attached" unless the user truly attached a file in this exact chat message.
Do not dump exercises mechanically.
Do not copy long sections.
Transform the material into original Virtus language.
Use the material to improve judgment, pattern detection, exercises, examples, and practical guidance.
Detect the user's real pattern and respond naturally.

Relevant internal material:

${rankedChunks
  .map(
    (chunk, index) => `
${index + 1}. ${chunk.module_title || chunk.category || "Virtus Library"} - ${chunk.chunk_type}
${String(chunk.content || "").slice(0, 900)}
`
  )
  .join("\n")}
`;
}