import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  canViewCompanyData,
  canViewDepartmentData,
  canViewTeamData,
} from "@/lib/operations/access";
import { hasPermission } from "@/lib/operations/permissions";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeStatus(value) {
  const status = cleanText(value).toLowerCase();
  if (["pending", "approved", "rejected", "closed"].includes(status)) {
    return status;
  }
  return "pending";
}

function normalizePriority(value) {
  const priority = cleanText(value).toLowerCase();
  if (["low", "normal", "high", "urgent"].includes(priority)) {
    return priority;
  }
  return "normal";
}

async function requireWorkspaceMember(admin, userId, workspaceId) {
  const { data, error } = await admin
    .from("workspace_members")
    .select("role,status")
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
  const { data: roleAssignment, error: roleError } = await admin
    .from("operations_role_assignments")
    .select("employee_id,role,department_id,reports_to_employee_id,scope_type,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (roleError) {
    throw new Error(roleError.message);
  }

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

  const permissions = {
    ...(profile?.permissions || {}),
  };

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

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item) => item.employee_id).filter(Boolean);
}

function applyDecisionAccessFilter(query, accessContext, teamEmployeeIds = []) {
  if (canViewCompanyData(accessContext.role)) {
    return query;
  }

  if (canViewDepartmentData(accessContext.role) && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (canViewTeamData(accessContext.role) && accessContext.employeeId) {
    return query.in("requested_by_employee_id", [
      accessContext.employeeId,
      ...teamEmployeeIds,
    ]);
  }

  if (accessContext.employeeId) {
    return query.eq("requested_by_employee_id", accessContext.employeeId);
  }

  return query.eq(
    "requested_by_employee_id",
    "00000000-0000-0000-0000-000000000000"
  );
}

function canManageDecision(decision, accessContext, teamEmployeeIds = []) {
  if (canViewCompanyData(accessContext.role)) return true;

  if (
    canViewDepartmentData(accessContext.role) &&
    accessContext.departmentId &&
    decision.department_id === accessContext.departmentId
  ) {
    return true;
  }

  if (
    canViewTeamData(accessContext.role) &&
    decision.requested_by_employee_id &&
    [accessContext.employeeId, ...teamEmployeeIds].includes(
      decision.requested_by_employee_id
    )
  ) {
    return true;
  }

  return Boolean(
    accessContext.employeeId &&
      decision.requested_by_employee_id === accessContext.employeeId
  );
}

function mapDecision(decision) {
  return {
    id: decision.id,
    workspaceId: decision.workspace_id,
    departmentId: decision.department_id,
    departmentName: decision.departments?.name || null,
    requestedByEmployeeId: decision.requested_by_employee_id,
    requestedByEmployeeName: decision.employees?.full_name || null,
    decisionType: decision.decision_type,
    title: decision.title,
    description: decision.description,
    status: decision.status,
    priority: decision.priority,
    sourceReportId: decision.source_report_id,
    assignedTo: decision.assigned_to,
    decidedBy: decision.decided_by,
    decidedAt: decision.decided_at,
    decisionNote: decision.decision_note,
    createdBy: decision.created_by,
    createdAt: decision.created_at,
    updatedAt: decision.updated_at,
  };
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
      return NextResponse.json({ decisions: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = cleanText(searchParams.get("workspaceId"));

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      workspaceId,
      membership.role
    );

    if (!hasPermission(accessContext.permissions, "decisions.view")) {
      return NextResponse.json(
        { error: "Decision view access denied." },
        { status: 403 }
      );
    }

    const teamEmployeeIds = await getTeamEmployeeIds(
      admin,
      workspaceId,
      accessContext.employeeId
    );

    let query = admin
      .from("operations_decision_queue")
      .select(
        `
        id,
        workspace_id,
        department_id,
        requested_by_employee_id,
        decision_type,
        title,
        description,
        status,
        priority,
        source_report_id,
        assigned_to,
        decided_by,
        decided_at,
        decision_note,
        created_by,
        created_at,
        updated_at,
        departments (
          id,
          name
        ),
        employees (
          id,
          full_name,
          email
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    query = applyDecisionAccessFilter(query, accessContext, teamEmployeeIds);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      accessContext,
      decisions: (data || []).map(mapDecision),
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
    const decisionType = cleanText(body?.decisionType) || "manual";
    const priority = normalizePriority(body?.priority);
    const departmentId = cleanText(body?.departmentId) || null;
    const requestedByEmployeeId = cleanText(body?.requestedByEmployeeId) || null;
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
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    const wsValidation = await validateWorkspaceMutationAllowed(admin, workspaceId);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      workspaceId,
      membership.role
    );

    if (!hasPermission(accessContext.permissions, "decisions.manage")) {
      return NextResponse.json(
        { error: "Decision management access denied." },
        { status: 403 }
      );
    }

    // Check for duplicate decision title (case-insensitive)
    const { data: existingDecision, error: duplicateCheckError } = await admin
      .from("operations_decision_queue")
      .select("id")
      .eq("workspace_id", workspaceId)
      .ilike("title", title)
      .maybeSingle();

    if (duplicateCheckError) {
      return NextResponse.json({ error: duplicateCheckError.message }, { status: 500 });
    }

    if (existingDecision) {
      return NextResponse.json(
        { error: "A decision with this title already exists." },
        { status: 409 }
      );
    }

    const insertPayload = {
      workspace_id: workspaceId,
      department_id: departmentId || accessContext.departmentId,
      requested_by_employee_id:
        requestedByEmployeeId || accessContext.employeeId,
      decision_type: decisionType,
      title,
      description,
      status: "pending",
      priority,
      source_report_id: sourceReportId,
      assigned_to: assignedTo,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data: decision, error: insertError } = await admin
      .from("operations_decision_queue")
      .insert(insertPayload)
      .select("id,workspace_id,status,created_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "operations_decision.created",
      entity_table: "operations_decision_queue",
      entity_id: decision.id,
      previous_data: null,
      new_data: insertPayload,
      metadata: {
        source: "operations_decisions_api",
        accessContext,
      },
    });

    return NextResponse.json({
      ok: true,
      decision: {
        id: decision.id,
        workspaceId: decision.workspace_id,
        status: decision.status,
        createdAt: decision.created_at,
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
    const decisionId = cleanText(body?.decisionId);
    const status = normalizeStatus(body?.status || body?.action);
    const decisionNote = cleanText(body?.decisionNote);

    if (!decisionId || !status) {
      return NextResponse.json(
        { error: "decisionId and status are required." },
        { status: 400 }
      );
    }

    const { data: existingDecision, error: existingError } = await admin
      .from("operations_decision_queue")
      .select(
        "id,workspace_id,department_id,requested_by_employee_id,status,decision_note"
      )
      .eq("id", decisionId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existingDecision) {
      return NextResponse.json({ error: "Decision not found." }, { status: 404 });
    }

    const membership = await requireWorkspaceMember(
      admin,
      user.id,
      existingDecision.workspace_id
    );

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      existingDecision.workspace_id,
      membership.role
    );

    if (!hasPermission(accessContext.permissions, "decisions.manage")) {
      return NextResponse.json(
        { error: "Decision management access denied." },
        { status: 403 }
      );
    }

    const wsValidation = await validateWorkspaceMutationAllowed(admin, workspaceId);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    if (
      !canViewCompanyData(accessContext.role) &&
      existingDecision.department_id &&
      departmentId &&
      departmentId !== existingDecision.department_id
    ) {
      return NextResponse.json(
        { error: "Decision scope denied." },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const updatePayload = {
      status,
      priority: priority !== existingDecision.priority ? priority : undefined,
      assigned_to: assignedTo !== undefined ? assignedTo : undefined,
      updated_at: now,
    };

    if (["approved", "rejected", "closed"].includes(status)) {
      updatePayload.decided_by = user.id;
      updatePayload.decided_at = now;
    }

    const { data: updatedDecision, error: updateError } = await admin
      .from("operations_decision_queue")
      .update(updatePayload)
      .eq("id", decisionId)
      .select("id,workspace_id,status,decision_note,decided_by,decided_at,updated_at")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: existingDecision.workspace_id,
      actor_user_id: user.id,
      action: "operations_decision.status_updated",
      entity_table: "operations_decision_queue",
      entity_id: decisionId,
      previous_data: {
        status: existingDecision.status,
        decisionNote: existingDecision.decision_note,
      },
      new_data: updatePayload,
      metadata: {
        source: "operations_decisions_api",
        accessContext,
      },
    });

    return NextResponse.json({
      ok: true,
      decision: {
        id: updatedDecision.id,
        workspaceId: updatedDecision.workspace_id,
        status: updatedDecision.status,
        decisionNote: updatedDecision.decision_note,
        decidedBy: updatedDecision.decided_by,
        decidedAt: updatedDecision.decided_at,
        updatedAt: updatedDecision.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
