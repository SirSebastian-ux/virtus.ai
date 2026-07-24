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

function applyScope(
  query,
  accessContext,
  departmentColumn = "department_id",
  employeeColumn = "employee_id"
) {
  if (accessContext.scopeType === "company") return query;

  if (accessContext.scopeType === "department" && accessContext.departmentId) {
    return query.eq(departmentColumn, accessContext.departmentId);
  }

  if (accessContext.scopeType === "self" && accessContext.employeeId) {
    return query.eq(employeeColumn, accessContext.employeeId);
  }

  return query;
}

function scoreOperations(metrics) {
  let score = 100;

  score -= Math.min(metrics.openUrgentIssues * 12, 36);
  score -= Math.min(metrics.criticalIssues * 16, 32);
  score -= Math.min(metrics.pendingDecisions * 8, 24);
  score -= Math.min(metrics.openTasks * 3, 18);
  score -= Math.min(metrics.todayReports === 0 ? 8 : 0, 8);

  return Math.max(score, 0);
}

function buildAlerts(metrics) {
  const alerts = [];

  if (metrics.criticalIssues > 0) {
    alerts.push({
      level: "critical",
      title: "Critical issues detected",
      message: `${metrics.criticalIssues} critical issue(s) require immediate executive attention.`,
    });
  }

  if (metrics.openUrgentIssues > 0) {
    alerts.push({
      level: "critical",
      title: "Urgent issues require attention",
      message: `${metrics.openUrgentIssues} urgent issue(s) are still unresolved.`,
    });
  }

  if (metrics.pendingDecisions > 0) {
    alerts.push({
      level: "warning",
      title: "Pending decisions are waiting",
      message: `${metrics.pendingDecisions} decision(s) require leadership action.`,
    });
  }

  if (metrics.openTasks > 10) {
    alerts.push({
      level: "warning",
      title: "Task load is increasing",
      message: `${metrics.openTasks} open task(s) are active in this scope.`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: "stable",
      title: "Operations are stable",
      message: "No critical operating signals detected in this scope.",
    });
  }

  return alerts;
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
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const { data: roleAssignment, error: roleError } = await admin
      .from("operations_role_assignments")
      .select("role, department_id, employee_id, scope_type")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    const accessContext = {
      role: roleAssignment?.role || membership.role || "employee",
      scopeType: roleAssignment?.scope_type || "self",
      departmentId: roleAssignment?.department_id || null,
      employeeId: roleAssignment?.employee_id || null,
    };

    const today = new Date().toISOString().slice(0, 10);

    const employeesQuery = applyScope(
      admin
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("employment_status", "active"),
      accessContext,
      "department_id",
      "id"
    );

    const tasksQuery = applyScope(
      admin
        .from("operations_tasks")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .neq("status", "completed"),
      accessContext,
      "department_id",
      "assigned_employee_id"
    );

    const urgentIssuesQuery = applyScope(
      admin
        .from("operations_urgent_issues")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .neq("status", "resolved")
        .neq("status", "closed"),
      accessContext
    );

    const criticalIssuesQuery = applyScope(
      admin
        .from("operations_urgent_issues")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("severity", "critical")
        .neq("status", "resolved")
        .neq("status", "closed"),
      accessContext
    );

    const decisionsQuery = applyScope(
      admin
        .from("operations_decision_queue")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "pending"),
      accessContext,
      "department_id",
      "requested_by_employee_id"
    );

    const reportsQuery = applyScope(
      admin
        .from("operations_reports")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("report_date", today),
      accessContext
    );

    const [
      activeEmployees,
      openTasks,
      openUrgentIssues,
      criticalIssues,
      pendingDecisions,
      todayReports,
    ] = await Promise.all([
      countRows(employeesQuery),
      countRows(tasksQuery),
      countRows(urgentIssuesQuery),
      countRows(criticalIssuesQuery),
      countRows(decisionsQuery),
      countRows(reportsQuery),
    ]);

    const metrics = {
      workspaceId,
      activeEmployees,
      openTasks,
      openUrgentIssues,
      criticalIssues,
      pendingDecisions,
      todayReports,
    };

    return NextResponse.json({
      accessContext,
      metrics,
      intelligence: {
        healthScore: scoreOperations(metrics),
        alerts: buildAlerts(metrics),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
