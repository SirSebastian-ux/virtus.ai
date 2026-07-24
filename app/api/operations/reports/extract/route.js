import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { extractOperationsFromReport } from "@/lib/operations-extraction";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";
import {
  canViewCompanyData,
  canViewDepartmentData,
  canViewTeamData,
} from "@/lib/operations/access";
import {
  hasPermission,
  normalizePermissions,
} from "@/lib/operations/permissions";

function cleanText(value) {
  return String(value || "").trim();
}

async function requireWorkspaceMember(admin, userId, workspaceId) {
  const { data, error } = await admin
    .from("workspace_members")
    .select("role, status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getAccessContext(admin, userId, workspaceId, membershipRole) {
  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("employee_id, role, department_id, reports_to_employee_id, scope_type, status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const role = data?.role || membershipRole || "employee";

  const { data: defaultProfile, error: profileError } = await admin
    .from("operations_permission_profiles")
    .select("permissions")
    .eq("workspace_id", workspaceId)
    .eq("role", role)
    .eq("is_default", true)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: overrides, error: overridesError } = await admin
    .from("operations_user_permissions")
    .select("permission_key, permission_value")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (overridesError) {
    throw new Error(overridesError.message);
  }

  const permissions = normalizePermissions(defaultProfile?.permissions);

  (overrides || []).forEach((item) => {
    permissions[item.permission_key] = Boolean(item.permission_value);
  });

  return {
    role,
    employeeId: data?.employee_id || null,
    departmentId: data?.department_id || null,
    reportsToEmployeeId: data?.reports_to_employee_id || null,
    scopeType: data?.scope_type || "self",
    permissions,
  };
}

async function getTeamEmployeeIds(admin, workspaceId, managerEmployeeId) {
  if (!managerEmployeeId) return [];

  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("employee_id")
    .eq("workspace_id", workspaceId)
    .eq("reports_to_employee_id", managerEmployeeId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item) => item.employee_id).filter(Boolean);
}

function applyReportAccessFilter(query, accessContext, teamEmployeeIds = []) {
  if (canViewCompanyData(accessContext.role)) {
    return query;
  }

  if (canViewDepartmentData(accessContext.role) && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (canViewTeamData(accessContext.role) && accessContext.employeeId) {
    const allowedEmployeeIds = [accessContext.employeeId, ...teamEmployeeIds];

    if (allowedEmployeeIds.length > 0) {
      return query.in("employee_id", allowedEmployeeIds);
    }
  }

  if (accessContext.employeeId) {
    return query.eq("employee_id", accessContext.employeeId);
  }

  return query.eq(
    "employee_id",
    "00000000-0000-0000-0000-000000000000"
  );
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
    const reportId = cleanText(body?.reportId);

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required." }, { status: 400 });
    }

    const { data: report, error: reportError } = await admin
      .from("operations_reports")
      .select("id, workspace_id, employee_id, department_id, raw_report")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, report.workspace_id);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      report.workspace_id,
      membership.role
    );

    if (!hasPermission(accessContext.permissions, "reports.review")) {
      return NextResponse.json(
        { error: "You do not have permission to extract reports." },
        { status: 403 }
      );
    }

    const teamEmployeeIds = await getTeamEmployeeIds(
      admin,
      report.workspace_id,
      accessContext.employeeId
    );

    let reportAccessQuery = admin
      .from("operations_reports")
      .select("id")
      .eq("id", report.id)
      .eq("workspace_id", report.workspace_id);

    reportAccessQuery = applyReportAccessFilter(
      reportAccessQuery,
      accessContext,
      teamEmployeeIds
    );

    const { data: accessibleReport, error: accessError } =
      await reportAccessQuery.maybeSingle();

    if (accessError) {
      return NextResponse.json(
        { error: accessError.message },
        { status: 500 }
      );
    }

    if (!accessibleReport) {
      return NextResponse.json(
        { error: "Report access denied." },
        { status: 403 }
      );
    }

    const wsValidation = await validateWorkspaceMutationAllowed(admin, report.workspace_id);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    const extracted = extractOperationsFromReport(report.raw_report);

    const taskRows = extracted.tasks.map((task) => ({
      workspace_id: report.workspace_id,
      department_id: report.department_id,
      assigned_employee_id: null,
      title: task.title,
      description: task.description,
      status: "open",
      priority: task.priority,
      source_report_id: report.id,
      created_by: user.id,
      assigned_by_user_id: null,
      assigned_at: null,
    }));

    const urgentRows = extracted.urgentIssues.map((issue) => ({
      workspace_id: report.workspace_id,
      department_id: report.department_id,
      employee_id: report.employee_id,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      status: issue.status,
      source_report_id: report.id,
      created_by: user.id,
    }));

    const decisionRows = extracted.decisions.map((decision) => ({
      workspace_id: report.workspace_id,
      department_id: report.department_id,
      requested_by_employee_id: report.employee_id,
      decision_type: decision.decisionType,
      title: decision.title,
      description: decision.description,
      status: decision.status,
      priority: decision.priority,
      source_report_id: report.id,
      created_by: user.id,
    }));

    const { data: existingReportTasks, error: existingTasksError } = await admin
      .from("operations_tasks")
      .select("id, title")
      .eq("source_report_id", report.id);

    if (existingTasksError) {
      return NextResponse.json(
        { error: existingTasksError.message },
        { status: 500 }
      );
    }

    const existingTaskTitles = new Set(
      (existingReportTasks || [])
        .map((task) => cleanText(task.title).toLowerCase())
        .filter(Boolean)
    );

    const newTaskRows = taskRows.filter((task) => {
      const normalizedTitle = cleanText(task.title).toLowerCase();

      if (!normalizedTitle || existingTaskTitles.has(normalizedTitle)) {
        return false;
      }

      existingTaskTitles.add(normalizedTitle);
      return true;
    });

    const cleanupTargets = [
      ["operations_urgent_issues", "source_report_id"],
      ["operations_decision_queue", "source_report_id"],
    ];

    for (const [tableName, columnName] of cleanupTargets) {
      const { error: cleanupError } = await admin
        .from(tableName)
        .delete()
        .eq(columnName, report.id);

      if (cleanupError) {
        return NextResponse.json({ error: cleanupError.message }, { status: 500 });
      }
    }

    if (newTaskRows.length > 0) {
      const { error } = await admin.from("operations_tasks").insert(newTaskRows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (urgentRows.length > 0) {
      const { error } = await admin.from("operations_urgent_issues").insert(urgentRows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (decisionRows.length > 0) {
      const { error } = await admin.from("operations_decision_queue").insert(decisionRows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { error: updateError } = await admin
      .from("operations_reports")
      .update({
        ai_summary: extracted.summary || "No structured items detected.",
        ai_extracted: extracted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      extracted,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

