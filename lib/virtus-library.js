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
    return [5, 1, 2];
  }

  return [...new Set(modules)].slice(0, 4);
}

function getMessageTerms(message = "") {
  return normalizeText(message)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4)
    .slice(0, 30);
}

function scoreChunk(chunk, terms) {
  const searchable = normalizeText(
    `${chunk.title || ""} ${chunk.content || ""} ${(chunk.tags || []).join(" ")}`
  );

  let score = 0;

  for (const term of terms) {
    if (searchable.includes(term)) {
      score += 2;
    }
  }

  if (chunk.chunk_type === "practice") score += 1;
  if (chunk.chunk_type === "reflection") score += 1;
  if (chunk.chunk_type === "framework") score += 1;

  return score;
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
  const terms = getMessageTerms(message);

  const { data: chunks, error } = await supabase
    .from("virtus_library_chunks")
    .select(
      "module_number, module_title, chunk_type, title, content, tags, use_cases"
    )
    .eq("category", "leadership")
    .in("module_number", relevantModules)
    .limit(120);

  if (error || !chunks || chunks.length === 0) {
    return "";
  }

  const rankedChunks = chunks
    .map((chunk) => ({
      ...chunk,
      relevance_score: scoreChunk(chunk, terms),
    }))
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);

  if (rankedChunks.length === 0) {
    return "";
  }

  return `
INTERNAL VIRTUS COACHING LIBRARY CONTEXT

Use this context silently as methodology.
Do not announce module names unless the user specifically asks.
Do not say "according to the workbook".
Do not dump exercises mechanically.
Do not copy long sections.
Transform the material into original Virtus language.
Detect the user's real pattern and respond naturally.

Relevant internal material:

${rankedChunks
  .map(
    (chunk, index) => `
${index + 1}. ${chunk.module_title || "Leadership Library"} — ${chunk.chunk_type}
${String(chunk.content || "").slice(0, 900)}
`
  )
  .join("\n")}
`;
}
