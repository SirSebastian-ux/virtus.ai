import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return Response.json({
        isAuthenticated: false,
        sessions: [],
      });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        {
          isAuthenticated: true,
          sessions: [],
        },
        { status: 500 }
      );
    }

    return Response.json({
      isAuthenticated: true,
      sessions: data || [],
    });
  } catch (error) {
    return Response.json(
      {
        isAuthenticated: false,
        sessions: [],
      },
      { status: 500 }
    );
  }
}