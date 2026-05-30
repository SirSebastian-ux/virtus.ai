import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in to manage your plan.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedPlan = String(body?.plan || "").trim().toLowerCase();

    return NextResponse.json(
      {
        success: false,
        error:
          "Direct plan changes are disabled. Paid plans activate only through Stripe checkout and verified Stripe webhook events. To upgrade, use the upgrade page. To cancel or manage billing, use the billing portal.",
        requestedPlan: requestedPlan || null,
      },
      { status: 403 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected billing access error.",
      },
      { status: 500 }
    );
  }
}
