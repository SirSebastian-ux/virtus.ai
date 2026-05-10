import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

const MODULE_TITLES = {
  1: "Leadership Response ChainÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢",
  2: "Responsibility vs. Blame",
  3: "Trigger Mapping & Emotional Patterns",
  4: "Leadership Identity & Blind Spots",
  5: "Awareness & Thought ObservationÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢",
  6: "Operational Decision ArchitectureÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢",
  7: "Mental Focus & Cognitive Energy",
  8: "Leadership Regulation FoundationÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢",
  9: "Behavioral Discipline & Habit Control",
  10: "High-Stress Environment StabilizationÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢",
};
const CATEGORY_RULES = [
  {
    category: "relationships",
    title: "Relationships Coaching Library",
    words: [
      "relationship",
      "relationships",
      "attachment",
      "trust",
      "betrayal",
      "intimacy",
      "partnership",
      "partner",
      "love",
      "emotional safety",
      "vulnerability",
      "repair",
      "masculine",
      "feminine",
    ],
  },
  {
    category: "marriage",
    title: "Marriage Preparation Library",
    words: [
      "marriage",
      "couple",
      "sacred purpose of marriage",
      "marriage vision",
      "conscious partnership",
      "togetherness",
      "spiritual intimacy",
    ],
  },
  {
    category: "communication",
    title: "Communication Coaching Library",
    words: [
      "communication",
      "assertive",
      "speaking",
      "public speaking",
      "voice",
      "dialogue",
      "persuasion",
      "being heard",
      "media relations",
      "cadence",
    ],
  },
  {
    category: "mind-discipline",
    title: "Mind Discipline Library",
    words: [
      "mind discipline",
      "self-awareness",
      "awareness",
      "self-talk",
      "overthinking",
      "negative thinking",
      "focus",
      "analytical thinking",
      "mental focus",
      "cognitive",
      "higher self",
    ],
  },
  {
    category: "emotional-intelligence",
    title: "Emotional Intelligence Library",
    words: [
      "emotional intelligence",
      "emotional mastery",
      "emotional regulation",
      "emotional maturity",
      "emotional release",
      "emotional wounds",
      "validation",
      "triggers",
    ],
  },
  {
    category: "stress-regulation",
    title: "Stress Regulation Library",
    words: [
      "stress",
      "anxiety",
      "crisis",
      "grounding",
      "breathing",
      "coping",
      "stabilization",
      "chaos",
      "pressure",
      "renewal",
    ],
  },
  {
    category: "habit-discipline",
    title: "Habit Discipline Library",
    words: [
      "habit",
      "habits",
      "procrastination",
      "discipline",
      "self-sabotage",
      "routine",
      "behavioral discipline",
      "30-day discipline",
      "lifestyle redesign",
    ],
  },
  {
    category: "decision-thinking",
    title: "Decision Thinking Library",
    words: [
      "decision",
      "decision-making",
      "analytical",
      "strategic thinking",
      "planning",
      "organizing",
      "project management",
      "time management",
      "delegation",
      "data analysis",
      "stakeholder",
    ],
  },
  {
    category: "spirituality",
    title: "Spiritual Growth Library",
    words: [
      "spiritual",
      "spirituality",
      "faith",
      "meditation",
      "silence",
      "heart-mind",
      "sacred",
      "purpose",
      "service",
      "energy mastery",
      "becoming the light",
    ],
  },
  {
    category: "leadership",
    title: "Leadership Coaching Library",
    words: [
      "leadership",
      "leader",
      "self-leadership",
      "responsibility",
      "authority",
      "mentorship",
      "team",
      "performance",
      "executive",
    ],
  },
];

function detectWorkbookCategory(fileName = "", text = "") {
  const name = String(fileName || "").toLowerCase();
  const combined = `${fileName}\n${String(text).slice(0, 2500)}`.toLowerCase();

  const directFileNameRules = [
    { category: "emotional-intelligence", words: ["emotional intelligence", "emotional mastery", "emotional regulation", "emotional maturity"] },
    { category: "relationships", words: ["relationship", "relationships", "trust", "betrayal", "attachment", "intimacy", "partnership"] },
    { category: "marriage", words: ["marriage", "couple", "conscious partnership", "spiritual intimacy"] },
    { category: "communication", words: ["communication", "assertive", "public speaking", "voice", "dialogue", "media relations", "cadence"] },
    { category: "stress-regulation", words: ["stress", "anxiety", "crisis", "grounding", "breathing", "coping", "stabilization"] },
    { category: "habit-discipline", words: ["habit", "procrastination", "self-sabotage", "discipline", "routine"] },
    { category: "decision-thinking", words: ["decision", "analytical", "strategic thinking", "planning", "organizing", "project management", "time management", "delegation", "data analysis", "stakeholder"] },
    { category: "spirituality", words: ["spiritual", "faith", "meditation", "silence", "sacred", "purpose", "energy mastery"] },
    { category: "mind-discipline", words: ["mind discipline", "self-awareness", "awareness map", "self-talk", "overthinking", "negative thinking", "higher self"] },
    { category: "leadership", words: ["leadership", "leader", "self-leadership", "authority", "mentorship", "team", "executive"] },
  ];

  for (const rule of directFileNameRules) {
    if (rule.words.some((word) => name.includes(word))) {
      return rule.category;
    }
  }

  const scored = CATEGORY_RULES.map((rule) => {
    const score = rule.words.reduce((total, word) => {
      return combined.includes(word.toLowerCase()) ? total + 1 : total;
    }, 0);

    return {
      category: rule.category,
      score,
    };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].category : "leadership";
}

function getCategoryTitle(category = "leadership") {
  return (
    CATEGORY_RULES.find((rule) => rule.category === category)?.title ||
    "Virtus Coaching Library"
  );
}

function detectModuleNumber(fileName = "", text = "") {
  const combined = `${fileName}\n${String(text).slice(0, 1000)}`;

  const directMatch = combined.match(/module\s*(\d{1,2})/i);
  if (directMatch) {
    const number = Number(directMatch[1]);
    if (number >= 1 && number <= 10) return number;
  }

  for (const [number, title] of Object.entries(MODULE_TITLES)) {
    if (combined.toLowerCase().includes(title.toLowerCase().replace("ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢", ""))) {
      return Number(number);
    }
  }

  return null;
}

function detectChunkType(text = "") {
  const clean = text.toLowerCase();

  if (clean.includes("exercise") || clean.includes("practice")) return "practice";
  if (clean.includes("reflection") || clean.includes("question")) return "reflection";
  if (clean.includes("example") || clean.includes("scenario")) return "example";
  if (clean.includes("framework") || clean.includes("model")) return "framework";

  return "concept";
}

function buildTags(moduleNumber, category = "leadership", content = "") {
  const tags = [category, "virtus", "coaching"];

  const clean = content.toLowerCase();

  if (moduleNumber) tags.push(`module-${moduleNumber}`);
  if (clean.includes("emotion") || clean.includes("trigger")) tags.push("emotional-regulation");
  if (clean.includes("decision")) tags.push("decision-making");
  if (clean.includes("responsibility") || clean.includes("blame")) tags.push("responsibility");
  if (clean.includes("stress") || clean.includes("anxiety")) tags.push("stress-regulation");
  if (clean.includes("habit") || clean.includes("discipline")) tags.push("discipline");
  if (clean.includes("communication") || clean.includes("dialogue")) tags.push("communication");
  if (clean.includes("relationship") || clean.includes("trust")) tags.push("relationships");
  if (clean.includes("marriage") || clean.includes("couple")) tags.push("marriage");
  if (clean.includes("spiritual") || clean.includes("faith")) tags.push("spirituality");

  return [...new Set(tags)];
}

function chunkText(text = "", maxLength = 1800) {
  const clean = String(text)
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!clean) return [];

  const paragraphs = clean.split(/\n\s*\n/);
  const chunks = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const p = paragraph.trim();
    if (!p) continue;

    if ((current + "\n\n" + p).length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks.filter((chunk) => chunk.length >= 80).slice(0, 80);
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const isSystemLibraryManager =
      String(user.email || "").toLowerCase() === "sebastian@ewellnessolutions.com";

    if (!isSystemLibraryManager) {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const fileIds = Array.isArray(body.fileIds) ? body.fileIds : [];

    if (fileIds.length === 0) {
      return Response.json(
        { error: "No fileIds provided. Send specific uploaded file IDs to ingest." },
        { status: 400 }
      );
    }

    let filesQuery = admin
      .from("user_files")
      .select("id, file_name, file_type, extracted_text")
      .in("id", fileIds);


    const { data: files, error: filesError } = await filesQuery;

    if (filesError) {
      return Response.json({ error: filesError.message }, { status: 500 });
    }

    const validFiles = (files || []).filter((file) =>
      String(file.extracted_text || "").trim()
    );

    if (validFiles.length === 0) {
      return Response.json(
        { error: "No readable extracted_text found for these files." },
        { status: 400 }
      );
    }

    const results = [];

    for (const file of validFiles) {
      const moduleNumber = detectModuleNumber(file.file_name, file.extracted_text);
      const category = moduleNumber
        ? "leadership"
        : detectWorkbookCategory(file.file_name, file.extracted_text);

      const moduleTitle = moduleNumber
        ? MODULE_TITLES[moduleNumber]
        : getCategoryTitle(category);

      const libraryKey = moduleNumber
        ? `ews-leadership-module-${moduleNumber}`
        : `ews-${category}-${file.id}`;

      const { data: source, error: sourceError } = await admin
        .from("virtus_library_sources")
        .upsert(
          {
            library_key: libraryKey,
            title: file.file_name,
            source_type: "uploaded_workbook",
            category,
            module_number: moduleNumber,
            module_title: moduleTitle,
            visibility: "system",
          },
          { onConflict: "library_key" }
        )
        .select()
        .single();

      if (sourceError) {
        results.push({
          file_name: file.file_name,
          success: false,
          error: sourceError.message,
        });
        continue;
      }

      await admin
        .from("virtus_library_chunks")
        .delete()
        .eq("source_id", source.id);

      const chunks = chunkText(file.extracted_text);

      const rows = chunks.map((content, index) => ({
        source_id: source.id,
        category,
        module_number: moduleNumber,
        module_title: moduleTitle,
        chunk_type: detectChunkType(content),
        title: `${moduleTitle} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Part ${index + 1}`,
        content,
        tags: buildTags(moduleNumber, category, content),
        use_cases: ["chat", "practice", "docx", "pdf", "pptx"],
      }));

      if (rows.length > 0) {
        const { error: chunksError } = await admin
          .from("virtus_library_chunks")
          .insert(rows);

        if (chunksError) {
          results.push({
            file_name: file.file_name,
            success: false,
            error: chunksError.message,
          });
          continue;
        }
      }

      results.push({
        file_name: file.file_name,
        success: true,
        module_number: moduleNumber,
        category,
        module_title: moduleTitle,
        chunks: rows.length,
      });
    }

    return Response.json({
      success: true,
      ingested_files: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

