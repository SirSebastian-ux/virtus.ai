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
  const { error } = await admin
    .from(tableName)
    .delete()
    .eq("workspace_id", workspaceId);

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

    if (!workspaceId || confirmation !== "DELETE COMPANY") {
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

    const tables = [
      "operations_activity_logs",
      "operations_approval_requests",
      "operations_daily_reports",
      "operations_management_alerts",
      "operations_decision_queue",
      "operations_urgent_issues",
      "operations_tasks",
      "operations_reports",
      "operations_payments",
      "operations_user_permissions",
      "operations_role_assignments",
      "operations_invitations",
      "employees",
      "departments",
      "workspace_billing_profiles",
      "workspace_members",
    ];

    for (const table of tables) {
      await deleteWorkspaceRows(admin, table, workspaceId);
    }

    const { error: workspaceError } = await admin
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);

    if (workspaceError) {
      throw new Error(workspaceError.message);
    }

    return NextResponse.json({
      ok: true,
      message: "Workspace permanently deleted.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
