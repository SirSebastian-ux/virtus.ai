import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  applyDepartmentScope,
  getOperationsAccessContext,
} from "@/lib/operations/scope";

function cleanText(value) {
  return String(value || "").trim();
}

async function requireWorkspaceMember(admin, userId, workspaceId) {
  const { data, error } = await admin
    .from("workspace_members")
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

function buildRecommendation(condition, text) {
  return condition ? text : null;
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
    const today = new Date().toISOString().slice(0, 10);

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getOperationsAccessContext(
      admin,
      user.id,
      workspaceId,
      membership.role
    );

    let reportsQuery = admin
      .from("operations_daily_reports")
      .select("id,department_id,report_date,summary")
      .eq("workspace_id", workspaceId)
      .eq("report_date", today);

    reportsQuery = applyDepartmentScope(reportsQuery, accessContext);

    const { data: reports, error: reportsError } = await reportsQuery;

    if (reportsError) throw new Error(reportsError.message);

    let tasksQuery = admin
      .from("operations_tasks")
      .select("id,department_id,title,status,priority,due_date")
      .eq("workspace_id", workspaceId);

    tasksQuery = applyDepartmentScope(tasksQuery, accessContext);

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) throw new Error(tasksError.message);

    let urgentIssuesQuery = admin
      .from("operations_urgent_issues")
      .select("id,department_id,title,severity,status")
      .eq("workspace_id", workspaceId);

    urgentIssuesQuery = applyDepartmentScope(urgentIssuesQuery, accessContext);

    const { data: urgentIssues, error: urgentError } = await urgentIssuesQuery;

    if (urgentError) throw new Error(urgentError.message);

    let decisionsQuery = admin
      .from("operations_decision_queue")
      .select("id,department_id,title,status,priority")
      .eq("workspace_id", workspaceId);

    decisionsQuery = applyDepartmentScope(decisionsQuery, accessContext);

    const { data: decisions, error: decisionsError } = await decisionsQuery;

    if (decisionsError) throw new Error(decisionsError.message);

    let alertsQuery = admin
      .from("operations_management_alerts")
      .select("id,department_id,title,severity,status,alert_type")
      .eq("workspace_id", workspaceId);

    alertsQuery = applyDepartmentScope(alertsQuery, accessContext);

    const { data: alerts, error: alertsError } = await alertsQuery;

    if (alertsError) throw new Error(alertsError.message);

    const openTasks = (tasks || []).filter((task) => !["completed", "done", "closed"].includes(task.status));
    const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < today);
    const openUrgentIssues = (urgentIssues || []).filter((issue) => !["resolved", "closed"].includes(issue.status));
    const criticalIssues = openUrgentIssues.filter((issue) => issue.severity === "critical");
    const pendingDecisions = (decisions || []).filter((decision) => decision.status === "pending");
    const urgentDecisions = pendingDecisions.filter((decision) => ["urgent", "high"].includes(decision.priority));
    const activeAlerts = (alerts || []).filter((alert) => ["open", "acknowledged", "investigating"].includes(alert.status));
    const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "critical");

    const riskScore = Math.min(
      100,
      criticalAlerts.length * 20 +
        criticalIssues.length * 20 +
        urgentDecisions.length * 12 +
        overdueTasks.length * 8 +
        openUrgentIssues.length * 6
    );

    const executiveSummary = [
      `Today the workspace has ${reports?.length || 0} daily reports, ${openTasks.length} open tasks, ${overdueTasks.length} overdue tasks, ${openUrgentIssues.length} open urgent issues, ${pendingDecisions.length} pending decisions, and ${activeAlerts.length} active management alerts.`,
      `Current operational risk score is ${riskScore}/100 based on unresolved alerts, urgent issues, overdue tasks, and pending decisions.`,
    ];

    const risks = [
      ...criticalAlerts.map((alert) => ({
        severity: "critical",
        title: alert.title,
        source: "management_alerts",
      })),
      ...criticalIssues.map((issue) => ({
        severity: "critical",
        title: issue.title,
        source: "urgent_issues",
      })),
      ...overdueTasks.slice(0, 10).map((task) => ({
        severity: task.priority === "urgent" || task.priority === "high" ? "high" : "medium",
        title: task.title,
        source: "tasks",
      })),
    ];

    const recommendations = [
      buildRecommendation(criticalAlerts.length > 0, "Resolve or assign all critical management alerts before the next operating cycle."),
      buildRecommendation(criticalIssues.length > 0, "Review all critical urgent issues and move them into a clear owner-action-resolution workflow."),
      buildRecommendation(overdueTasks.length > 0, "Reassign, close, or re-prioritize overdue tasks to prevent execution drift."),
      buildRecommendation(urgentDecisions.length > 0, "Clear high-priority pending decisions to remove leadership bottlenecks."),
      buildRecommendation((reports?.length || 0) === 0, "Require daily reports before end of day to restore executive visibility."),
    ].filter(Boolean);

    return NextResponse.json({
      executiveSummary,
      risks,
      recommendations,
      departmentInsights: [],
      workforceInsights: [],
      leadershipInsights: [
        {
          title: "Decision bottleneck",
          value: pendingDecisions.length,
          severity: urgentDecisions.length ? "high" : "medium",
        },
      ],
      trends: [],
      metrics: {
        reportCount: reports?.length || 0,
        openTasks: openTasks.length,
        overdueTasks: overdueTasks.length,
        openUrgentIssues: openUrgentIssues.length,
        criticalIssues: criticalIssues.length,
        pendingDecisions: pendingDecisions.length,
        urgentDecisions: urgentDecisions.length,
        activeAlerts: activeAlerts.length,
        criticalAlerts: criticalAlerts.length,
        riskScore,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
