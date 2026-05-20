import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return Response.json({ practices: [] });
    }

    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from("chat_sessions")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .eq("hidden_from_sidebar", true)
      .ilike("title", "Guided Practice -%")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return Response.json({ practices: [] }, { status: 500 });
    }

    return Response.json({
      practices: data || [],
    });
  } catch (error) {
    return Response.json({ practices: [] }, { status: 500 });
  }
}
