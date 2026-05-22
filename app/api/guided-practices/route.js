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

export async function DELETE(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const practiceId = String(body.practiceId || body.id || "").trim();

    if (!practiceId) {
      return Response.json({ error: "Missing guided practice id." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from("chat_sessions")
      .delete()
      .eq("id", practiceId)
      .eq("user_id", user.id)
      .eq("hidden_from_sidebar", true)
      .ilike("title", "Guided Practice -%");

    if (error) {
      return Response.json({ error: "Guided practice delete failed." }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Guided practice delete failed." }, { status: 500 });
  }
}