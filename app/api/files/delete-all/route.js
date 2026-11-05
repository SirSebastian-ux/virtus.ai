import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

// Destructive action: this endpoint only deletes the authenticated owner's library.
function safePath(userId, value) {
  return typeof value === "string" &&
    value.startsWith(`${userId}/`) &&
    !value.includes("..") &&
    !value.includes("\\") &&
    !value.startsWith("/") &&
    !value.includes("//");
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    if (body?.confirmation !== "DELETE ALL FILES") {
      return Response.json({ error: "Explicit deletion confirmation required" }, { status: 400 });
    }

    const admin = createAdminClient();
    // Read owner-scoped records only; no client-provided user or file identifiers.
    const { data: files, error: readError } = await admin.from("user_files")
      .select("id, storage_path").eq("user_id", user.id).limit(10001);
    if (readError) return Response.json({ error: readError.message }, { status: 500 });
    if (!files?.length) return Response.json({ success: true, deleted: 0 });
    if (files.length > 10000) return Response.json({ error: "Library exceeds the bulk deletion limit. Please contact support." }, { status: 413 });

    if (files.some((file) => !safePath(user.id, file.storage_path))) {
      return Response.json({ error: "Library contains an invalid storage path. Nothing was deleted." }, { status: 409 });
    }
    let deleted = 0;
    for (let offset = 0; offset < files.length; offset += 100) {
      const batch = files.slice(offset, offset + 100);
      // Delete storage first; do not drop metadata if storage failed.
      const { error: storageError } = await admin.storage.from("user-files")
        .remove(batch.map((file) => file.storage_path));
      if (storageError) {
        return Response.json({
          error: "Could not finish deleting all documents. Refresh your library to see which files remain.",
          deleted,
        }, { status: 500 });
      }
      const ids = batch.map((file) => file.id);
      const { data: removed, error: deleteError } = await admin.from("user_files")
        .delete().eq("user_id", user.id).in("id", ids).select("id");
      if (deleteError || removed?.length !== ids.length) {
        return Response.json({
          error: "Some library records could not be removed. Refresh the library and contact support if needed.",
          deleted,
        }, { status: 500 });
      }
      deleted += removed.length;
    }
    return Response.json({ success: true, deleted });
  } catch {
    return Response.json({ error: "Unable to delete library documents." }, { status: 500 });
  }
}
