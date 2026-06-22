import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

function cleanText(value) {
  return String(value || "").trim();
}

async function countRows(query) {
  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}

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
    const workspaceId = cleanText(searchParams.get("workspaceId"));

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    const { data: membership, error: membershipError } = await admin
      .from("workspace_members")
      .select("role,status")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const [
      activeEmployees,
      openTasks,
      urgentIssues,
      criticalIssues,
      pendingDecisions,
      todayReports,
    ] = await Promise.all([
      countRows(
        admin
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("employment_status", "active")
      ),

      countRows(
        admin
          .from("operations_tasks")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .neq("status", "completed")
      ),

      countRows(
        admin
          .from("operations_urgent_issues")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .neq("status", "resolved")
          .neq("status", "closed")
      ),

      countRows(
        admin
          .from("operations_urgent_issues")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("severity", "critical")
          .neq("status", "resolved")
          .neq("status", "closed")
      ),

      countRows(
        admin
          .from("operations_decision_queue")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "pending")
      ),

      countRows(
        admin
          .from("operations_reports")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("report_date", today)
      ),
    ]);

    const healthScore = Math.max(
      0,
      100 -
        criticalIssues * 15 -
        urgentIssues * 8 -
        pendingDecisions * 5 -
        openTasks * 2
    );

    return NextResponse.json({
      briefing: {
        workspaceId,
        healthScore,
        activeEmployees,
        openTasks,
        urgentIssues,
        criticalIssues,
        pendingDecisions,
        todayReports,
        executiveSummary: [
          `${criticalIssues} critical issues require executive visibility.`,
          `${urgentIssues} urgent issues remain active.`,
          `${pendingDecisions} decisions are awaiting approval.`,
          `${openTasks} operational tasks remain open.`,
        ],
        recommendations: [
          "Review all critical issues first.",
          "Resolve pending executive decisions.",
          "Reduce overdue operational workload.",
          "Ensure daily reports are submitted by departments.",
        ],
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
