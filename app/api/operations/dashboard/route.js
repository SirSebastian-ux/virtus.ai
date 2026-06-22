import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const workspaceId = String(
      searchParams.get("workspaceId") || ""
    ).trim();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    const { data: roleAssignment } = await admin
      .from("operations_role_assignments")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const role = roleAssignment?.role || "employee";

    const [
      employeesResult,
      tasksResult,
      issuesResult,
      decisionsResult,
      reportsResult,
    ] = await Promise.all([
      admin
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),

      admin
        .from("operations_tasks")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),

      admin
        .from("operations_urgent_issues")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),

      admin
        .from("operations_decision_queue")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),

      admin
        .from("operations_reports")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
    ]);

    return NextResponse.json({
      role,
      metrics: {
        employees: employeesResult.count || 0,
        tasks: tasksResult.count || 0,
        urgentIssues: issuesResult.count || 0,
        decisions: decisionsResult.count || 0,
        reports: reportsResult.count || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}