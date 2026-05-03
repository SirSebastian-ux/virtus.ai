import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

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

    const body = await req.json();
    const fileId = body?.fileId;

    if (!fileId) {
      return Response.json({ error: "Missing fileId" }, { status: 400 });
    }

    const { data: file, error: fileError } = await admin
      .from("user_files")
      .select("id, user_id, storage_path")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single();

    if (fileError || !file) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    const { error: storageError } = await admin.storage
      .from("user-files")
      .remove([file.storage_path]);

    if (storageError) {
      return Response.json({ error: storageError.message }, { status: 500 });
    }

    const { error: deleteError } = await admin
      .from("user_files")
      .delete()
      .eq("id", fileId)
      .eq("user_id", user.id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}