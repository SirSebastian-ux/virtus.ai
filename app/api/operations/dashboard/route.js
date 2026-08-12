import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  getOperationsAccessContext,
  getTeamEmployeeIds,
} from "@/lib/operations/scope";

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

const ROLE_SCOPE_LIMIT = {
  owner: "company",
  director: "company",
  senior_manager: "company",
  department_manager: "department",
  supervisor: "team",
  employee: "self",
};

const SCOPE_LEVEL = {
  self: 0,
  team: 1,
  department: 2,
  company: 3,
};

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

function getEffectiveScope(role, requestedScope) {
  const maximumScope = ROLE_SCOPE_LIMIT[role] || "self";
  const normalizedScope = Object.hasOwn(SCOPE_LEVEL, requestedScope)
    ? requestedScope
    : maximumScope;

  if (SCOPE_LEVEL[normalizedScope] > SCOPE_LEVEL[maximumScope]) {
    return maximumScope;
  }

  return normalizedScope;
}

function applyMetricScope(
  query,
  accessContext,
  teamEmployeeIds,
  departmentColumn,
  employeeColumn,
) {
  if (accessContext.scopeType === "company") {
    return query;
  }

  if (accessContext.scopeType === "department") {
    if (accessContext.departmentId) {
      return query.eq(departmentColumn, accessContext.departmentId);
    }

    return query.eq(departmentColumn, EMPTY_UUID);
  }

  if (accessContext.scopeType === "team") {
    const allowedEmployeeIds = Array.from(
      new Set([accessContext.employeeId, ...teamEmployeeIds].filter(Boolean)),
    );

    if (allowedEmployeeIds.length > 0) {
      return query.in(employeeColumn, allowedEmployeeIds);
    }

    return query.eq(employeeColumn, EMPTY_UUID);
  }

  if (accessContext.employeeId) {
    return query.eq(employeeColumn, accessContext.employeeId);
  }

  return query.eq(employeeColumn, EMPTY_UUID);
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

function getScopeLanguage(role) {
  if (role === "employee") {
    return {
      subject: "You",
      possessive: "your",
      attention: "your attention",
      stableTitle: "Your work is stable",
      stableMessage: "No urgent personal operating signals were detected.",
    };
  }

  if (role === "supervisor") {
    return {
      subject: "Your team",
      possessive: "your team",
      attention: "supervisor attention",
      stableTitle: "Team operations are stable",
      stableMessage: "No urgent team operating signals were detected.",
    };
  }

  if (role === "department_manager") {
    return {
      subject: "Your department",
      possessive: "your department",
      attention: "department management attention",
      stableTitle: "Department operations are stable",
      stableMessage: "No urgent department operating signals were detected.",
    };
  }

  return {
    subject: "The company",
    possessive: "the company",
    attention: "leadership attention",
    stableTitle: "Operations are stable",
    stableMessage: "No urgent company-wide operating signals were detected.",
  };
}

function buildAlerts(metrics, role) {
  const alerts = [];
  const language = getScopeLanguage(role);

  if (metrics.criticalIssues > 0) {
    alerts.push({
      level: "critical",
      title: "Critical issues detected",
      message: `${metrics.criticalIssues} critical issue(s) in ${language.possessive} authorized scope require ${language.attention}.`,
    });
  } else if (metrics.openUrgentIssues > 0) {
    alerts.push({
      level: "warning",
      title: "Urgent issues remain open",
      message: `${metrics.openUrgentIssues} urgent issue(s) in ${language.possessive} authorized scope remain unresolved.`,
    });
  }

  if (metrics.openTasks > 10) {
    alerts.push({
      level: "warning",
      title: "Open task load is increasing",
      message: `${language.subject} currently ${
        role === "employee" ? "have" : "has"
      } ${metrics.openTasks} open task(s).`,
    });
  }

  if (role !== "employee" && metrics.pendingDecisions > 0) {
    alerts.push({
      level: "warning",
      title: "Pending decisions are waiting",
      message: `${metrics.pendingDecisions} decision(s) in this authorized scope require action.`,
    });
  }

  if (metrics.todayReports === 0) {
    alerts.push({
      level: "notice",
      title:
        role === "employee" ? "No report submitted today" : "No reports today",
      message:
        role === "employee"
          ? "Your daily report has not yet been recorded for today."
          : `No daily reports have been recorded in ${language.possessive} authorized scope today.`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: "stable",
      title: language.stableTitle,
      message: language.stableMessage,
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
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = cleanText(searchParams.get("workspaceId"));

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 },
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
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 },
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 },
      );
    }

    const rawAccessContext = await getOperationsAccessContext(
      admin,
      user.id,
      workspaceId,
      membership.role,
    );

    const accessContext = {
      ...rawAccessContext,
      scopeType: getEffectiveScope(
        rawAccessContext.role,
        rawAccessContext.scopeType,
      ),
    };

    const teamEmployeeIds =
      accessContext.scopeType === "team"
        ? await getTeamEmployeeIds(admin, workspaceId, accessContext.employeeId)
        : [];

    const today = new Date().toISOString().slice(0, 10);

    const employeesQuery = applyMetricScope(
      admin
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("employment_status", "active"),
      accessContext,
      teamEmployeeIds,
      "department_id",
      "id",
    );

    const tasksQuery = applyMetricScope(
      admin
        .from("operations_tasks")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .neq("status", "completed"),
      accessContext,
      teamEmployeeIds,
      "department_id",
      "assigned_employee_id",
    );

    const urgentIssuesQuery = applyMetricScope(
      admin
        .from("operations_urgent_issues")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .neq("status", "resolved")
        .neq("status", "closed"),
      accessContext,
      teamEmployeeIds,
      "department_id",
      "employee_id",
    );

    const criticalIssuesQuery = applyMetricScope(
      admin
        .from("operations_urgent_issues")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("severity", "critical")
        .neq("status", "resolved")
        .neq("status", "closed"),
      accessContext,
      teamEmployeeIds,
      "department_id",
      "employee_id",
    );

    const decisionsQuery = applyMetricScope(
      admin
        .from("operations_decision_queue")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "pending"),
      accessContext,
      teamEmployeeIds,
      "department_id",
      "requested_by_employee_id",
    );

    const reportsQuery = applyMetricScope(
      admin
        .from("operations_reports")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("report_date", today),
      accessContext,
      teamEmployeeIds,
      "department_id",
      "employee_id",
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
      activeEmployees,
      openTasks,
      openUrgentIssues,
      criticalIssues,
      pendingDecisions,
      todayReports,
    };

    return NextResponse.json({
      accessContext: {
        role: accessContext.role,
        scopeType: accessContext.scopeType,
      },
      metrics,
      intelligence: {
        healthScore:
          accessContext.role === "employee" ? null : scoreOperations(metrics),
        alerts: buildAlerts(metrics, accessContext.role),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
