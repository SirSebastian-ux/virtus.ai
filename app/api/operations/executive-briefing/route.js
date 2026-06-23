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

function priorityScore(item) {
  if (item.type === "critical_alert") return 100;
  if (item.type === "urgent_decision") return 90;
  if (item.type === "high_decision") return 80;
  if (item.type === "overdue_task") return 70;
  if (item.type === "urgent_issue") return 65;
  return 40;
}

function buildExecutiveSummary(metrics) {
  return [
    `Today the workspace has ${metrics.todayReports} report(s), ${metrics.openTasks} open task(s), ${metrics.overdueTasks} overdue task(s), ${metrics.urgentIssues} urgent issue(s), ${metrics.pendingDecisions} pending decision(s), and ${metrics.activeAlerts} active management alert(s).`,
    `Current operational health score is ${metrics.healthScore}/100.`,
    `Current operational risk score is ${metrics.riskScore}/100 based on alerts, urgent issues, overdue tasks, and pending decisions.`,
    `${metrics.criticalIssues} critical issue(s) require executive visibility.`,
    `${metrics.criticalAlerts} critical alert(s) require leadership attention.`,
  ];
}

function buildRecommendations(metrics) {
  const recommendations = [];

  if (metrics.criticalAlerts > 0) {
    recommendations.push("Resolve or assign all critical management alerts before the next operating cycle.");
  }

  if (metrics.criticalIssues > 0) {
    recommendations.push("Review all critical urgent issues and move them into a clear owner-action-resolution workflow.");
  }

  if (metrics.overdueTasks > 0) {
    recommendations.push("Reassign, close, or re-prioritize overdue tasks to prevent execution drift.");
  }

  if (metrics.highPriorityDecisions > 0) {
    recommendations.push("Clear high-priority pending decisions to remove leadership bottlenecks.");
  }

  if (metrics.departmentsWithoutReports > 0) {
    recommendations.push("Follow up with departments that have not submitted reports today.");
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
      managementAlertsResult,
      priorityAlertsResult,
      priorityTasksResult,
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
        .select("id,title,description,priority,status,department_id,created_at")
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

      admin
        .from("operations_management_alerts")
        .select("id,title,message,severity,status,department_id,alert_type,created_at")
        .eq("workspace_id", workspaceId)
        .in("status", ["open", "acknowledged", "investigating"])
        .order("created_at", { ascending: false })
        .limit(20),

      admin
        .from("operations_management_alerts")
        .select("id,title,message,severity,status,department_id,alert_type,created_at")
        .eq("workspace_id", workspaceId)
        .in("status", ["open", "acknowledged", "investigating"])
        .in("severity", ["critical", "high"])
        .order("created_at", { ascending: false })
        .limit(10),

      admin
        .from("operations_tasks")
        .select("id,title,description,status,priority,due_date,department_id,created_at")
        .eq("workspace_id", workspaceId)
        .lt("due_date", today)
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(10),
    ]);

    for (const result of [
      departmentsResult,
      recentUrgentResult,
      pendingDecisionResult,
      recentActivityResult,
      todayDepartmentReportsResult,
      managementAlertsResult,
      priorityAlertsResult,
      priorityTasksResult,
    ]) {
      if (result.error) {
        throw new Error(result.error.message);
      }
    }

    const departments = departmentsResult.data || [];
    const managementAlerts = managementAlertsResult.data || [];
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

    const activeAlerts = managementAlerts.length;
    const criticalAlerts = managementAlerts.filter(
      (alert) => alert.severity === "critical"
    ).length;
    const highAlerts = managementAlerts.filter(
      (alert) => alert.severity === "high"
    ).length;
    const openAlerts = managementAlerts.filter(
      (alert) => alert.status === "open"
    ).length;

    const riskScore = Math.min(
      100,
      criticalAlerts * 20 +
        criticalIssues * 20 +
        highPriorityDecisions * 12 +
        overdueTasks * 8 +
        urgentIssues * 6
    );

    const healthScore = Math.max(
      0,
      100 -
        criticalIssues * 15 -
        urgentIssues * 8 -
        pendingDecisions * 5 -
        highPriorityDecisions * 6 -
        overdueTasks * 4 -
        departmentsWithoutReports.length * 3 -
        criticalAlerts * 10 -
        highAlerts * 5
    );

    const executivePriorities = [
      ...(priorityAlertsResult.data || []).map((alert) => ({
        id: alert.id,
        type: alert.severity === "critical" ? "critical_alert" : "high_alert",
        title: alert.title,
        description: alert.message,
        severity: alert.severity,
        status: alert.status,
        source: "management_alerts",
        createdAt: alert.created_at,
        score: priorityScore({
          type: alert.severity === "critical" ? "critical_alert" : "high_alert",
        }),
      })),
      ...(pendingDecisionResult.data || []).map((decision) => ({
        id: decision.id,
        type: decision.priority === "urgent" ? "urgent_decision" : "high_decision",
        title: decision.title,
        description: decision.description,
        severity: decision.priority === "urgent" ? "critical" : "high",
        status: decision.status,
        source: "decision_queue",
        createdAt: decision.created_at,
        score: priorityScore({
          type: decision.priority === "urgent" ? "urgent_decision" : "high_decision",
        }),
      })),
      ...(priorityTasksResult.data || []).map((task) => ({
        id: task.id,
        type: "overdue_task",
        title: task.title,
        description: task.description || `Task was due on ${task.due_date}.`,
        severity: task.priority === "urgent" || task.priority === "high" ? "high" : "medium",
        status: task.status,
        source: "tasks",
        createdAt: task.created_at,
        score: priorityScore({ type: "overdue_task" }),
      })),
      ...(recentUrgentResult.data || []).map((issue) => ({
        id: issue.id,
        type: "urgent_issue",
        title: issue.title,
        description: null,
        severity: issue.severity,
        status: issue.status,
        source: "urgent_issues",
        createdAt: issue.created_at,
        score: priorityScore({ type: "urgent_issue" }),
      })),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const leadershipInsights = [];

    if (pendingDecisions > 0) {
      leadershipInsights.push({
        title: "Decision Bottleneck",
        value: pendingDecisions,
        severity: highPriorityDecisions > 0 ? "high" : "medium",
      });
    }

    if (criticalAlerts > 0) {
      leadershipInsights.push({
        title: "Critical Alert Exposure",
        value: criticalAlerts,
        severity: "critical",
      });
    }

    if (departmentsWithoutReports.length > 0) {
      leadershipInsights.push({
        title: "Reporting Visibility Gap",
        value: departmentsWithoutReports.length,
        severity: "medium",
      });
    }

    const metrics = {
      workspaceId,
      healthScore,
      riskScore,
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
      activeAlerts,
      openAlerts,
      criticalAlerts,
      highAlerts,
      executivePrioritiesCount: executivePriorities.length,
    };

    const executiveSummary = buildExecutiveSummary(metrics);
    const recommendations = buildRecommendations(metrics);

    return NextResponse.json({
      briefing: {
        ...metrics,
        executiveSummary,
        recommendations,
        aiExecutiveSummary: executiveSummary,
        aiRecommendations: recommendations,
        leadershipInsights,
        executivePriorities,
        managementAlerts: managementAlerts.slice(0, 10),
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
