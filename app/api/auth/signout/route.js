import { createClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return Response.json(
        {
          success: false,
          error: error.message || "Failed to sign out.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Unexpected sign-out error.",
      },
      { status: 500 }
    );
  }
}