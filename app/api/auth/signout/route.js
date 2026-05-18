import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to sign out.",
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set("virtus_trial_device_id", "", {
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected sign-out error.",
      },
      { status: 500 }
    );
  }
}
