import { createAdminClient } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/admin-auth";


function normalizeText(value) {
  return String(value || "").trim();
}

function getTextLength(value) {
  return normalizeText(value).length;
}

async function fetchAllRows(queryFactory, pageSize = 1000) {
  const allRows = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await queryFactory().range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const rows = data || [];
    allRows.push(...rows);

    if (rows.length < pageSize) {
      break;
    }
  }

  return allRows;
}

export async function GET() {
  try {
    const { response: adminAuthResponse } = await requireAdminApi();

    if (adminAuthResponse) {
      return adminAuthResponse;
    }

    const admin = createAdminClient();

    const { data: files, error: filesError } = await admin
      .from("user_files")
      .select("id, user_id, file_name, file_type, storage_path, extracted_text, created_at")
      .order("created_at", { ascending: false });

    if (filesError) {
      return Response.json({ error: filesError.message }, { status: 500 });
    }

    const { data: sources, error: sourcesError } = await admin
      .from("virtus_library_sources")
      .select("id, library_key, title, category, module_number, module_title, created_at")
      .order("created_at", { ascending: false });

    if (sourcesError) {
      return Response.json({ error: sourcesError.message }, { status: 500 });
    }

    const chunks = await fetchAllRows(() =>
      admin.from("virtus_library_chunks").select("id, source_id, category")
    );

    const chunkCountBySourceId = new Map();

    for (const chunk of chunks || []) {
      const current = chunkCountBySourceId.get(chunk.source_id) || 0;
      chunkCountBySourceId.set(chunk.source_id, current + 1);
    }

    const sourceCategoryTotals = {};
    const chunkCategoryTotals = {};

    for (const source of sources || []) {
      const category = source.category || "uncategorized";
      sourceCategoryTotals[category] = (sourceCategoryTotals[category] || 0) + 1;
    }

    for (const chunk of chunks || []) {
      const category = chunk.category || "uncategorized";
      chunkCategoryTotals[category] = (chunkCategoryTotals[category] || 0) + 1;
    }

    const enrichedFiles = (files || []).map((file) => {
      const matchingSource =
        (sources || []).find((source) =>
          String(source.library_key || "").includes(String(file.id))
        ) ||
        (sources || []).find(
          (source) =>
            String(source.title || "").toLowerCase() ===
            String(file.file_name || "").toLowerCase()
        );

      const textLength = getTextLength(file.extracted_text);

      return {
        id: file.id,
        file_name: file.file_name,
        file_type: file.file_type,
        created_at: file.created_at,
        has_extracted_text: textLength > 0,
        extracted_text_chars: textLength,
        already_ingested: Boolean(matchingSource),
        library_key: matchingSource?.library_key || null,
        category: matchingSource?.category || null,
        module_number: matchingSource?.module_number || null,
        module_title: matchingSource?.module_title || null,
        chunks: matchingSource
          ? chunkCountBySourceId.get(matchingSource.id) || 0
          : 0,
      };
    });

    return Response.json({
      success: true,
      summary: {
        files_count: enrichedFiles.length,
        readable_files_count: enrichedFiles.filter((file) => file.has_extracted_text).length,
        ingested_files_count: enrichedFiles.filter((file) => file.already_ingested).length,
        sources_count: (sources || []).length,
        chunks_count: (chunks || []).length,
        source_category_totals: sourceCategoryTotals,
        chunk_category_totals: chunkCategoryTotals,
      },
      files: enrichedFiles,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
