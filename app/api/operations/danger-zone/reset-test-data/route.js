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

async function deleteWorkspaceRows(admin, tableName, workspaceId) {
  const { error } = await admin.from(tableName).delete().eq("workspace_id", workspaceId);

  if (error) throw new Error(`${tableName}: ${error.message}`);
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

    if (!workspaceId || confirmation !== "RESET TEST DATA") {
      return NextResponse.json(
        { error: "workspaceId and confirmation are required." },
        { status: 400 }
      );
    }

    const isOwner = await requireOwner(admin, user.id, workspaceId);

    if (!isOwner) {
      return NextResponse.json({ error: "Owner access required." }, { status: 403 });
    }

    const tables = [
      "operations_activity_logs",
      "operations_management_alerts",
      "operations_decision_queue",
      "operations_urgent_issues",
      "operations_tasks",
      "operations_daily_reports",
      "operations_reports",
      "operations_payments",
      "operations_approval_requests",
    ];

    for (const table of tables) {
      await deleteWorkspaceRows(admin, table, workspaceId);
    }

    return NextResponse.json({
      ok: true,
      message: "Operational test data has been reset.",
      deletedTables: tables,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
