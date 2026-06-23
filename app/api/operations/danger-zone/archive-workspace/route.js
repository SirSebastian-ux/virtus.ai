import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

function cleanText(value) {
  return String(value || "").trim();
}

async function requireOwner(admin, userId, workspaceId) {
  const { data, error } = await admin
    .from("workspace_members")
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data?.role === "owner";
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    const workspaceId = cleanText(body?.workspaceId);
    const confirmation = cleanText(body?.confirmation);

    if (!workspaceId || confirmation !== "ARCHIVE COMPANY") {
      return NextResponse.json(
        { error: "Invalid confirmation." },
        { status: 400 }
      );
    }

    const isOwner = await requireOwner(admin, user.id, workspaceId);

    if (!isOwner) {
      return NextResponse.json(
        { error: "Owner access required." },
        { status: 403 }
      );
    }

    const { error } = await admin
      .from("workspaces")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspaceId);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      message: "Workspace archived successfully.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
