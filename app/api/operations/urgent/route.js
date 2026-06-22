import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  canViewCompanyData,
  canViewDepartmentData,
  canViewTeamData,
} from "@/lib/operations/access";
import { hasPermission } from "@/lib/operations/permissions";

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeSeverity(value) {
  const severity = cleanText(value).toLowerCase();
  if (["low", "medium", "high", "critical"].includes(severity)) return severity;
  return "medium";
}

function normalizeStatus(value) {
  const status = cleanText(value).toLowerCase();
  if (["open", "in_progress", "resolved", "closed"].includes(status)) return status;
  return "open";
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

async function getAccessContext(admin, userId, workspaceId, membershipRole) {
  const { data: roleAssignment, error: roleError } = await admin
    .from("operations_role_assignments")
    .select("employee_id,role,department_id,reports_to_employee_id,scope_type,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (roleError) throw new Error(roleError.message);

  const role = roleAssignment?.role || membershipRole || "employee";

  const { data: profile } = await admin
    .from("operations_permission_profiles")
    .select("permissions")
    .eq("workspace_id", workspaceId)
    .eq("role", role)
    .eq("is_default", true)
    .maybeSingle();

  const { data: overrides } = await admin
    .from("operations_user_permissions")
    .select("permission_key,permission_value")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  const permissions = { ...(profile?.permissions || {}) };

  for (const override of overrides || []) {
    permissions[override.permission_key] = Boolean(override.permission_value);
  }

  return {
    role,
    employeeId: roleAssignment?.employee_id || null,
    departmentId: roleAssignment?.department_id || null,
    reportsToEmployeeId: roleAssignment?.reports_to_employee_id || null,
    scopeType: roleAssignment?.scope_type || "self",
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

  if (error) throw new Error(error.message);
  return (data || []).map((item) => item.employee_id).filter(Boolean);
}

function applyUrgentAccessFilter(query, accessContext, teamEmployeeIds = []) {
  if (canViewCompanyData(accessContext.role)) return query;

  if (canViewDepartmentData(accessContext.role) && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (canViewTeamData(accessContext.role) && accessContext.employeeId) {
    return query.in("employee_id", [accessContext.employeeId, ...teamEmployeeIds]);
  }

  if (accessContext.employeeId) {
    return query.eq("employee_id", accessContext.employeeId);
  }

  return query.eq("employee_id", "00000000-0000-0000-0000-000000000000");
}

function canManageIssue(issue, accessContext, teamEmployeeIds = []) {
  if (canViewCompanyData(accessContext.role)) return true;

  if (
    canViewDepartmentData(accessContext.role) &&
    accessContext.departmentId &&
    issue.department_id === accessContext.departmentId
  ) {
    return true;
  }

  if (
    canViewTeamData(accessContext.role) &&
    issue.employee_id &&
    [accessContext.employeeId, ...teamEmployeeIds].includes(issue.employee_id)
  ) {
    return true;
  }

  return Boolean(accessContext.employeeId && issue.employee_id === accessContext.employeeId);
}

function mapIssue(issue) {
  return {
    id: issue.id,
    workspaceId: issue.workspace_id,
    departmentId: issue.department_id,
    departmentName: issue.departments?.name || null,
    employeeId: issue.employee_id,
    employeeName: issue.employees?.full_name || null,
    title: issue.title,
    description: issue.description,
    severity: issue.severity,
    status: issue.status,
    sourceReportId: issue.source_report_id,
    assignedTo: issue.assigned_to,
    resolvedBy: issue.resolved_by,
    resolvedAt: issue.resolved_at,
    createdBy: issue.created_by,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  };
}

async function maybeCreateDecisionForSevereIssue(admin, issue, userId, accessContext) {
  if (!["high", "critical"].includes(issue.severity)) return;

  const { data: existingDecision } = await admin
    .from("operations_decision_queue")
    .select("id")
    .eq("workspace_id", issue.workspace_id)
    .eq("decision_type", "urgent_issue")
    .eq("title", `Urgent issue decision: ${issue.title}`)
    .maybeSingle();

  if (existingDecision) return;

  const { data: decision } = await admin
    .from("operations_decision_queue")
    .insert({
      workspace_id: issue.workspace_id,
      department_id: issue.department_id,
      requested_by_employee_id: issue.employee_id,
      decision_type: "urgent_issue",
      title: `Urgent issue decision: ${issue.title}`,
      description: issue.description,
      status: "pending",
      priority: issue.severity === "critical" ? "urgent" : "high",
      assigned_to: issue.assigned_to,
      created_by: userId,
    })
    .select("id")
    .single();

  if (decision?.id) {
    await admin.from("operations_activity_logs").insert({
      workspace_id: issue.workspace_id,
      actor_user_id: userId,
      action: "operations_urgent_issue.decision_created",
      entity_table: "operations_decision_queue",
      entity_id: decision.id,
      previous_data: null,
      new_data: {
        sourceIssueId: issue.id,
        severity: issue.severity,
      },
      metadata: {
        source: "operations_urgent_api",
        accessContext,
      },
    });
  }
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
      return NextResponse.json({ urgentIssues: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = cleanText(searchParams.get("workspaceId"));

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getAccessContext(admin, user.id, workspaceId, membership.role);

    if (!hasPermission(accessContext.permissions, "urgent_issues.view")) {
      return NextResponse.json({ error: "Urgent issue view access denied." }, { status: 403 });
    }

    const teamEmployeeIds = await getTeamEmployeeIds(admin, workspaceId, accessContext.employeeId);

    let query = admin
      .from("operations_urgent_issues")
      .select(
        `
        id,
        workspace_id,
        department_id,
        employee_id,
        title,
        description,
        severity,
        status,
        source_report_id,
        assigned_to,
        resolved_by,
        resolved_at,
        created_by,
        created_at,
        updated_at,
        employees (
          id,
          full_name,
          email
        ),
        departments (
          id,
          name
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    query = applyUrgentAccessFilter(query, accessContext, teamEmployeeIds);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      accessContext,
      urgentIssues: (data || []).map(mapIssue),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
    const title = cleanText(body?.title);
    const description = cleanText(body?.description);
    const severity = normalizeSeverity(body?.severity);
    const departmentId = cleanText(body?.departmentId) || null;
    const employeeId = cleanText(body?.employeeId) || null;
    const sourceReportId = cleanText(body?.sourceReportId) || null;
    const assignedTo = cleanText(body?.assignedTo) || null;

    if (!workspaceId || !title) {
      return NextResponse.json(
        { error: "workspaceId and title are required." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getAccessContext(admin, user.id, workspaceId, membership.role);

    if (!hasPermission(accessContext.permissions, "urgent_issues.manage")) {
      return NextResponse.json(
        { error: "Urgent issue management access denied." },
        { status: 403 }
      );
    }

    const insertPayload = {
      workspace_id: workspaceId,
      department_id: departmentId || accessContext.departmentId,
      employee_id: employeeId || accessContext.employeeId,
      title,
      description,
      severity,
      status: "open",
      source_report_id: sourceReportId,
      assigned_to: assignedTo,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data: issue, error: insertError } = await admin
      .from("operations_urgent_issues")
      .insert(insertPayload)
      .select(
        "id,workspace_id,department_id,employee_id,title,description,severity,status,source_report_id,assigned_to,created_by,created_at,updated_at"
      )
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "operations_urgent_issue.created",
      entity_table: "operations_urgent_issues",
      entity_id: issue.id,
      previous_data: null,
      new_data: insertPayload,
      metadata: {
        source: "operations_urgent_api",
        accessContext,
      },
    });

    await maybeCreateDecisionForSevereIssue(admin, issue, user.id, accessContext);

    return NextResponse.json({
      ok: true,
      urgentIssue: {
        id: issue.id,
        workspaceId: issue.workspace_id,
        status: issue.status,
        severity: issue.severity,
        createdAt: issue.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
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
    const issueId = cleanText(body?.issueId);
    const status = normalizeStatus(body?.status);
    const severity = body?.severity ? normalizeSeverity(body.severity) : null;
    const assignedTo = body?.assignedTo !== undefined ? cleanText(body.assignedTo) || null : undefined;

    if (!issueId) {
      return NextResponse.json({ error: "issueId is required." }, { status: 400 });
    }

    const { data: existingIssue, error: existingError } = await admin
      .from("operations_urgent_issues")
      .select(
        "id,workspace_id,department_id,employee_id,title,description,severity,status,assigned_to,resolved_by,resolved_at"
      )
      .eq("id", issueId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existingIssue) {
      return NextResponse.json({ error: "Urgent issue not found." }, { status: 404 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, existingIssue.workspace_id);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      existingIssue.workspace_id,
      membership.role
    );

    if (!hasPermission(accessContext.permissions, "urgent_issues.manage")) {
      return NextResponse.json(
        { error: "Urgent issue management access denied." },
        { status: 403 }
      );
    }

    const teamEmployeeIds = await getTeamEmployeeIds(
      admin,
      existingIssue.workspace_id,
      accessContext.employeeId
    );

    if (!canManageIssue(existingIssue, accessContext, teamEmployeeIds)) {
      return NextResponse.json(
        { error: "Urgent issue update access denied." },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const updatePayload = {
      status,
      updated_at: now,
    };

    if (severity) updatePayload.severity = severity;
    if (assignedTo !== undefined) updatePayload.assigned_to = assignedTo;

    if (["resolved", "closed"].includes(status)) {
      updatePayload.resolved_by = user.id;
      updatePayload.resolved_at = now;
    }

    const { data: updatedIssue, error: updateError } = await admin
      .from("operations_urgent_issues")
      .update(updatePayload)
      .eq("id", issueId)
      .select(
        "id,workspace_id,department_id,employee_id,title,description,severity,status,assigned_to,resolved_by,resolved_at,updated_at"
      )
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: existingIssue.workspace_id,
      actor_user_id: user.id,
      action: "operations_urgent_issue.updated",
      entity_table: "operations_urgent_issues",
      entity_id: issueId,
      previous_data: {
        status: existingIssue.status,
        severity: existingIssue.severity,
        assignedTo: existingIssue.assigned_to,
      },
      new_data: updatePayload,
      metadata: {
        source: "operations_urgent_api",
        accessContext,
      },
    });

    await maybeCreateDecisionForSevereIssue(admin, updatedIssue, user.id, accessContext);

    return NextResponse.json({
      ok: true,
      urgentIssue: {
        id: updatedIssue.id,
        workspaceId: updatedIssue.workspace_id,
        status: updatedIssue.status,
        severity: updatedIssue.severity,
        assignedTo: updatedIssue.assigned_to,
        resolvedBy: updatedIssue.resolved_by,
        resolvedAt: updatedIssue.resolved_at,
        updatedAt: updatedIssue.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
