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

function detectIntent(question) {
  const text = question.toLowerCase();

  if (text.includes("risk") || text.includes("danger") || text.includes("problem")) return "risks";
  if (text.includes("decision") || text.includes("approve") || text.includes("approval")) return "decisions";
  if (text.includes("task") || text.includes("overdue") || text.includes("work")) return "tasks";
  if (text.includes("alert") || text.includes("critical")) return "alerts";
  if (text.includes("report") || text.includes("daily")) return "reports";

  return "overview";
}

function buildAnswer(intent, data) {
  if (intent === "risks") {
    return `Current risk view: ${data.criticalAlerts} critical alerts, ${data.openUrgentIssues} open urgent issues, ${data.overdueTasks} overdue tasks, and ${data.pendingDecisions} pending decisions. Focus first on critical alerts and unresolved urgent issues.`;
  }

  if (intent === "decisions") {
    return `There are ${data.pendingDecisions} pending decisions. ${data.urgentDecisions} are high or urgent priority. Leadership should clear the highest-priority decisions first to reduce execution bottlenecks.`;
  }

  if (intent === "tasks") {
    return `There are ${data.openTasks} open tasks and ${data.overdueTasks} overdue tasks. Overdue tasks should be reviewed, reassigned, completed, or formally closed.`;
  }

  if (intent === "alerts") {
    return `There are ${data.activeAlerts} active management alerts, including ${data.criticalAlerts} critical alerts. Critical alerts should be assigned and moved into resolution immediately.`;
  }

  if (intent === "reports") {
    return `There are ${data.reportCount} daily reports submitted today. Reporting visibility should be checked against expected department reporting coverage.`;
  }

  return `Operations overview: ${data.reportCount} reports today, ${data.openTasks} open tasks, ${data.overdueTasks} overdue tasks, ${data.openUrgentIssues} urgent issues, ${data.pendingDecisions} pending decisions, and ${data.activeAlerts} active alerts.`;
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
    const question = cleanText(body?.question);
    const today = new Date().toISOString().slice(0, 10);

    if (!workspaceId || !question) {
      return NextResponse.json(
        { error: "workspaceId and question are required." },
        { status: 400 }
      );
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
      .select("id,department_id")
      .eq("workspace_id", workspaceId)
      .eq("report_date", today);

    reportsQuery = applyDepartmentScope(reportsQuery, accessContext);

    const { data: reports, error: reportsError } = await reportsQuery;

    if (reportsError) throw new Error(reportsError.message);

    let tasksQuery = admin
      .from("operations_tasks")
      .select("id,department_id,status,due_date")
      .eq("workspace_id", workspaceId);

    tasksQuery = applyDepartmentScope(tasksQuery, accessContext);

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) throw new Error(tasksError.message);

    let urgentIssuesQuery = admin
      .from("operations_urgent_issues")
      .select("id,department_id,status,severity")
      .eq("workspace_id", workspaceId);

    urgentIssuesQuery = applyDepartmentScope(urgentIssuesQuery, accessContext);

    const { data: urgentIssues, error: urgentError } = await urgentIssuesQuery;

    if (urgentError) throw new Error(urgentError.message);

    let decisionsQuery = admin
      .from("operations_decision_queue")
      .select("id,department_id,status,priority")
      .eq("workspace_id", workspaceId);

    decisionsQuery = applyDepartmentScope(decisionsQuery, accessContext);

    const { data: decisions, error: decisionsError } = await decisionsQuery;

    if (decisionsError) throw new Error(decisionsError.message);

    let alertsQuery = admin
      .from("operations_management_alerts")
      .select("id,department_id,status,severity")
      .eq("workspace_id", workspaceId);

    alertsQuery = applyDepartmentScope(alertsQuery, accessContext);

    const { data: alerts, error: alertsError } = await alertsQuery;

    if (alertsError) throw new Error(alertsError.message);

    const openTasks = (tasks || []).filter((task) => !["completed", "done", "closed"].includes(task.status));
    const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < today);
    const openUrgentIssues = (urgentIssues || []).filter((issue) => !["resolved", "closed"].includes(issue.status));
    const pendingDecisions = (decisions || []).filter((decision) => decision.status === "pending");
    const urgentDecisions = pendingDecisions.filter((decision) => ["urgent", "high"].includes(decision.priority));
    const activeAlerts = (alerts || []).filter((alert) => ["open", "acknowledged", "investigating"].includes(alert.status));
    const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "critical");

    const data = {
      reportCount: reports?.length || 0,
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      openUrgentIssues: openUrgentIssues.length,
      pendingDecisions: pendingDecisions.length,
      urgentDecisions: urgentDecisions.length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
    };

    const intent = detectIntent(question);
    const answer = buildAnswer(intent, data);

    return NextResponse.json({
      answer,
      intent,
      metrics: data,
      sources: [
        "operations_daily_reports",
        "operations_tasks",
        "operations_urgent_issues",
        "operations_decision_queue",
        "operations_management_alerts",
      ],
      recommendations: [
        criticalAlerts.length ? "Resolve critical alerts first." : null,
        overdueTasks.length ? "Review overdue tasks and assign clear ownership." : null,
        urgentDecisions.length ? "Clear urgent pending decisions." : null,
      ].filter(Boolean),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

