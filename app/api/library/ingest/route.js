import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

const MODULE_TITLES = {
  1: "Leadership Response Chain™",
  2: "Responsibility vs. Blame",
  3: "Trigger Mapping & Emotional Patterns",
  4: "Leadership Identity & Blind Spots",
  5: "Awareness & Thought Observation™",
  6: "Operational Decision Architecture™",
  7: "Mental Focus & Cognitive Energy",
  8: "Leadership Regulation Foundation™",
  9: "Behavioral Discipline & Habit Control",
  10: "High-Stress Environment Stabilization™",
};

function detectModuleNumber(fileName = "", text = "") {
  const combined = `${fileName}\n${String(text).slice(0, 1000)}`;

  const directMatch = combined.match(/module\s*(\d{1,2})/i);
  if (directMatch) {
    const number = Number(directMatch[1]);
    if (number >= 1 && number <= 10) return number;
  }

  for (const [number, title] of Object.entries(MODULE_TITLES)) {
    if (combined.toLowerCase().includes(title.toLowerCase().replace("™", ""))) {
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

function buildTags(moduleNumber, content = "") {
  const tags = ["leadership", "virtus", "coaching"];

  const clean = content.toLowerCase();

  if (moduleNumber) tags.push(`module-${moduleNumber}`);
  if (clean.includes("emotion") || clean.includes("trigger")) tags.push("emotional-regulation");
  if (clean.includes("decision")) tags.push("decision-making");
  if (clean.includes("responsibility") || clean.includes("blame")) tags.push("responsibility");
  if (clean.includes("stress")) tags.push("stress-regulation");
  if (clean.includes("habit") || clean.includes("discipline")) tags.push("discipline");
  if (clean.includes("communication")) tags.push("communication");

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

    const body = await req.json().catch(() => ({}));
    const fileIds = Array.isArray(body.fileIds) ? body.fileIds : [];

    if (fileIds.length === 0) {
      return Response.json(
        { error: "No fileIds provided. Send specific uploaded file IDs to ingest." },
        { status: 400 }
      );
    }

    const { data: files, error: filesError } = await admin
      .from("user_files")
      .select("id, file_name, file_type, extracted_text")
      .eq("user_id", user.id)
      .in("id", fileIds);

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
      const moduleTitle = moduleNumber
        ? MODULE_TITLES[moduleNumber]
        : "Leadership Coaching Library";

      const libraryKey = moduleNumber
        ? `ews-leadership-module-${moduleNumber}`
        : `ews-leadership-${file.id}`;

      const { data: source, error: sourceError } = await admin
        .from("virtus_library_sources")
        .upsert(
          {
            library_key: libraryKey,
            title: file.file_name,
            source_type: "uploaded_workbook",
            category: "leadership",
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
        category: "leadership",
        module_number: moduleNumber,
        module_title: moduleTitle,
        chunk_type: detectChunkType(content),
        title: `${moduleTitle} — Part ${index + 1}`,
        content,
        tags: buildTags(moduleNumber, content),
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
