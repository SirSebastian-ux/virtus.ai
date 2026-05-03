import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
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

    const { data: files, error } = await admin
      .from("user_files")
      .select("id, file_name, file_type, storage_path, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      files: files || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}