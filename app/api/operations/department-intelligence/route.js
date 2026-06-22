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

function scoreDepartment(metrics) {
  let score = 100;

  score -= Math.min(metrics.criticalIssues * 18, 36);
  score -= Math.min(metrics.urgentIssues * 12, 36);
  score -= Math.min(metrics.overdueTasks * 8, 24);
  score -= Math.min(metrics.pendingDecisions * 6, 18);
  score -= metrics.todayReports === 0 ? 10 : 0;

  return Math.max(score, 0);
}

function riskLevel(score) {
  if (score >= 80) return "stable";
  if (score >= 60) return "watch";
  if (score >= 40) return "risk";
  return "critical";
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

    const { data: departments, error: departmentsError } = await admin
      .from("departments")
      .select("id,name,status")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("name", { ascending: true });

    if (departmentsError) {
      return NextResponse.json({ error: departmentsError.message }, { status: 500 });
    }

    const departmentIntelligence = await Promise.all(
      (departments || []).map(async (department) => {
        const [
          activeEmployees,
          openTasks,
          overdueTasks,
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
              .eq("department_id", department.id)
              .eq("employment_status", "active")
          ),

          countRows(
            admin
              .from("operations_tasks")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspaceId)
              .eq("department_id", department.id)
              .neq("status", "completed")
          ),

          countRows(
            admin
              .from("operations_tasks")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspaceId)
              .eq("department_id", department.id)
              .neq("status", "completed")
              .lt("due_date", today)
          ),

          countRows(
            admin
              .from("operations_urgent_issues")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspaceId)
              .eq("department_id", department.id)
              .neq("status", "resolved")
              .neq("status", "closed")
          ),

          countRows(
            admin
              .from("operations_urgent_issues")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspaceId)
              .eq("department_id", department.id)
              .eq("severity", "critical")
              .neq("status", "resolved")
              .neq("status", "closed")
          ),

          countRows(
            admin
              .from("operations_decision_queue")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspaceId)
              .eq("department_id", department.id)
              .eq("status", "pending")
          ),

          countRows(
            admin
              .from("operations_reports")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspaceId)
              .eq("department_id", department.id)
              .eq("report_date", today)
          ),
        ]);

        const metrics = {
          activeEmployees,
          openTasks,
          overdueTasks,
          urgentIssues,
          criticalIssues,
          pendingDecisions,
          todayReports,
        };

        const healthScore = scoreDepartment(metrics);

        return {
          id: department.id,
          name: department.name,
          healthScore,
          riskLevel: riskLevel(healthScore),
          ...metrics,
        };
      })
    );

    departmentIntelligence.sort((a, b) => a.healthScore - b.healthScore);

    return NextResponse.json({
      workspaceId,
      departments: departmentIntelligence,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
