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

function scoreDepartment(department) {
  let score = 0;

  score += department.criticalIssues * 20;
  score += department.urgentIssues * 12;
  score += department.overdueTasks * 8;
  score += department.pendingDecisions * 6;
  score += department.todayReports === 0 ? 10 : 0;

  return score;
}

function buildExecutiveSummary(metrics) {
  return [
    `${metrics.criticalIssues} critical issue(s) require executive visibility.`,
    `${metrics.urgentIssues} urgent issue(s) remain active.`,
    `${metrics.pendingDecisions} decision(s) are awaiting approval.`,
    `${metrics.highPriorityDecisions} high-priority decision(s) require leadership review.`,
    `${metrics.overdueTasks} overdue task(s) are creating execution risk.`,
    `${metrics.todayReports} report(s) were submitted today.`,
  ];
}

function buildRecommendations(metrics) {
  const recommendations = [];

  if (metrics.criticalIssues > 0) {
    recommendations.push("Review all critical issues before normal operational work.");
  }

  if (metrics.overdueTasks > 0) {
    recommendations.push("Assign owners to overdue tasks and force same-day status updates.");
  }

  if (metrics.highPriorityDecisions > 0) {
    recommendations.push("Clear high-priority pending decisions to prevent leadership bottlenecks.");
  }

  if (metrics.departmentsWithoutReports > 0) {
    recommendations.push("Follow up with departments that have not submitted reports today.");
  }

  if (metrics.urgentIssues > 0) {
    recommendations.push("Separate urgent issues by severity and escalate unresolved blockers.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain current operating rhythm and continue monitoring risk signals.");
  }

  return recommendations;
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
      overdueTasks,
      urgentIssues,
      criticalIssues,
      pendingDecisions,
      highPriorityDecisions,
      todayReports,
      activeDepartments,
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
          .from("operations_tasks")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .neq("status", "completed")
          .lt("due_date", today)
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
          .from("operations_decision_queue")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "pending")
          .in("priority", ["high", "urgent"])
      ),

      countRows(
        admin
          .from("operations_reports")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("report_date", today)
      ),

      countRows(
        admin
          .from("departments")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "active")
      ),
    ]);

    const [
      departmentsResult,
      recentUrgentResult,
      pendingDecisionResult,
      recentActivityResult,
      todayDepartmentReportsResult,
    ] = await Promise.all([
      admin
        .from("departments")
        .select("id,name,status")
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .order("name", { ascending: true }),

      admin
        .from("operations_urgent_issues")
        .select("id,title,severity,status,department_id,created_at")
        .eq("workspace_id", workspaceId)
        .neq("status", "resolved")
        .neq("status", "closed")
        .order("created_at", { ascending: false })
        .limit(8),

      admin
        .from("operations_decision_queue")
        .select("id,title,priority,status,department_id,created_at")
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(8),

      admin
        .from("operations_activity_logs")
        .select("id,action,entity_table,entity_id,created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(10),

      admin
        .from("operations_reports")
        .select("department_id")
        .eq("workspace_id", workspaceId)
        .eq("report_date", today),
    ]);

    for (const result of [
      departmentsResult,
      recentUrgentResult,
      pendingDecisionResult,
      recentActivityResult,
      todayDepartmentReportsResult,
    ]) {
      if (result.error) {
        throw new Error(result.error.message);
      }
    }

    const departments = departmentsResult.data || [];
    const todayDepartmentIds = new Set(
      (todayDepartmentReportsResult.data || [])
        .map((report) => report.department_id)
        .filter(Boolean)
    );

    const departmentRiskRanking = await Promise.all(
      departments.map(async (department) => {
        const [
          departmentUrgentIssues,
          departmentCriticalIssues,
          departmentOverdueTasks,
          departmentPendingDecisions,
          departmentTodayReports,
        ] = await Promise.all([
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
              .from("operations_tasks")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", workspaceId)
              .eq("department_id", department.id)
              .neq("status", "completed")
              .lt("due_date", today)
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

        const riskProfile = {
          id: department.id,
          name: department.name,
          urgentIssues: departmentUrgentIssues,
          criticalIssues: departmentCriticalIssues,
          overdueTasks: departmentOverdueTasks,
          pendingDecisions: departmentPendingDecisions,
          todayReports: departmentTodayReports,
        };

        return {
          ...riskProfile,
          riskScore: scoreDepartment(riskProfile),
        };
      })
    );

    departmentRiskRanking.sort((a, b) => b.riskScore - a.riskScore);

    const departmentsWithoutReports = departments.filter(
      (department) => !todayDepartmentIds.has(department.id)
    );

    const healthScore = Math.max(
      0,
      100 -
        criticalIssues * 15 -
        urgentIssues * 8 -
        pendingDecisions * 5 -
        highPriorityDecisions * 6 -
        overdueTasks * 4 -
        departmentsWithoutReports.length * 3
    );

    const metrics = {
      workspaceId,
      healthScore,
      activeEmployees,
      openTasks,
      overdueTasks,
      urgentIssues,
      criticalIssues,
      pendingDecisions,
      highPriorityDecisions,
      todayReports,
      activeDepartments,
      departmentsWithoutReports: departmentsWithoutReports.length,
    };

    return NextResponse.json({
      briefing: {
        ...metrics,
        executiveSummary: buildExecutiveSummary(metrics),
        recommendations: buildRecommendations(metrics),
        urgentIssueSummary: recentUrgentResult.data || [],
        decisionSummary: pendingDecisionResult.data || [],
        criticalActivity: recentActivityResult.data || [],
        departmentRiskRanking: departmentRiskRanking.slice(0, 8),
        missingDepartmentReports: departmentsWithoutReports.map((department) => ({
          id: department.id,
          name: department.name,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
