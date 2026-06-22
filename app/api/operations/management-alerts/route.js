import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeStatus(value) {
  const status = cleanText(value).toLowerCase();

  if (["open", "acknowledged", "investigating", "resolved", "closed"].includes(status)) {
    return status;
  }

  return "open";
}

function normalizeSeverity(value) {
  const severity = cleanText(value).toLowerCase();

  if (["low", "medium", "high", "critical"].includes(severity)) {
    return severity;
  }

  return "medium";
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

  let employeeId = roleAssignment?.employee_id || null;

  if (!employeeId) {
    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id,department_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (employeeError) throw new Error(employeeError.message);

    employeeId = employee?.id || null;
  }

  return {
    role: roleAssignment?.role || membershipRole || "employee",
    employeeId,
    departmentId: roleAssignment?.department_id || null,
    reportsToEmployeeId: roleAssignment?.reports_to_employee_id || null,
    scopeType: roleAssignment?.scope_type || "self",
  };
}

function canViewManagementAlerts(role) {
  return ["owner", "director", "senior_manager", "department_manager", "supervisor"].includes(role);
}

function canManageManagementAlerts(role) {
  return ["owner", "director", "senior_manager", "department_manager"].includes(role);
}

function canViewCompany(role) {
  return ["owner", "director"].includes(role);
}

function canViewDepartment(role) {
  return ["senior_manager", "department_manager"].includes(role);
}

function applyAlertAccessFilter(query, accessContext) {
  if (canViewCompany(accessContext.role)) return query;

  if (canViewDepartment(accessContext.role) && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  return query.eq("department_id", "00000000-0000-0000-0000-000000000000");
}

function mapAlert(alert) {
  return {
    id: alert.id,
    workspaceId: alert.workspace_id,
    departmentId: alert.department_id,
    departmentName: alert.departments?.name || null,
    alertType: alert.alert_type,
    title: alert.title,
    message: alert.message,
    severity: alert.severity,
    status: alert.status,
    sourceTable: alert.source_table,
    sourceId: alert.source_id,
    assignedTo: alert.assigned_to,
    resolvedBy: alert.resolved_by,
    resolvedAt: alert.resolved_at,
    createdAt: alert.created_at,
    updatedAt: alert.updated_at,
  };
}

async function getCounts(admin, workspaceId, accessContext) {
  const unresolvedStatuses = ["open", "acknowledged", "investigating"];

  let alertsQuery = admin
    .from("operations_management_alerts")
    .select("id,severity,status", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .in("status", unresolvedStatuses);

  alertsQuery = applyAlertAccessFilter(alertsQuery, accessContext);

  const { data: activeAlerts, count: activeCount, error: activeError } = await alertsQuery;

  if (activeError) throw new Error(activeError.message);

  return {
    activeAlerts: activeCount || 0,
    criticalAlerts: (activeAlerts || []).filter((alert) => alert.severity === "critical").length,
    highAlerts: (activeAlerts || []).filter((alert) => alert.severity === "high").length,
    openAlerts: (activeAlerts || []).filter((alert) => alert.status === "open").length,
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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

    if (!canViewManagementAlerts(accessContext.role)) {
      return NextResponse.json({ error: "Management alerts access denied." }, { status: 403 });
    }

    let query = admin
      .from("operations_management_alerts")
      .select(
        `
        id,
        workspace_id,
        department_id,
        alert_type,
        title,
        message,
        severity,
        status,
        source_table,
        source_id,
        assigned_to,
        resolved_by,
        resolved_at,
        created_at,
        updated_at,
        departments (
          id,
          name
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    query = applyAlertAccessFilter(query, accessContext);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts = await getCounts(admin, workspaceId, accessContext);

    return NextResponse.json({
      accessContext,
      metrics: counts,
      alerts: (data || []).map(mapAlert),
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
    const alertType = cleanText(body?.alertType) || "manual_alert";
    const title = cleanText(body?.title);
    const message = cleanText(body?.message);
    const severity = normalizeSeverity(body?.severity);
    const departmentId = cleanText(body?.departmentId) || null;
    const assignedTo = cleanText(body?.assignedTo) || null;

    if (!workspaceId || !title || !message) {
      return NextResponse.json(
        { error: "workspaceId, title, and message are required." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getAccessContext(admin, user.id, workspaceId, membership.role);

    if (!canManageManagementAlerts(accessContext.role)) {
      return NextResponse.json({ error: "Management alert creation denied." }, { status: 403 });
    }

    const insertPayload = {
      workspace_id: workspaceId,
      department_id: departmentId || accessContext.departmentId,
      alert_type: alertType,
      title,
      message,
      severity,
      status: "open",
      assigned_to: assignedTo,
      updated_at: new Date().toISOString(),
    };

    const { data: alert, error: insertError } = await admin
      .from("operations_management_alerts")
      .insert(insertPayload)
      .select("id,workspace_id,department_id,alert_type,title,message,severity,status,created_at,updated_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "operations_management_alert.created",
      entity_table: "operations_management_alerts",
      entity_id: alert.id,
      previous_data: null,
      new_data: insertPayload,
      metadata: {
        source: "operations_management_alerts_api",
        accessContext,
      },
    });

    return NextResponse.json({
      ok: true,
      alert: {
        id: alert.id,
        workspaceId: alert.workspace_id,
        status: alert.status,
        severity: alert.severity,
        createdAt: alert.created_at,
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
    const alertId = cleanText(body?.alertId);
    const status = normalizeStatus(body?.status);
    const severity = body?.severity ? normalizeSeverity(body.severity) : null;
    const assignedTo = body?.assignedTo !== undefined ? cleanText(body.assignedTo) || null : undefined;

    if (!alertId) {
      return NextResponse.json({ error: "alertId is required." }, { status: 400 });
    }

    const { data: existingAlert, error: existingError } = await admin
      .from("operations_management_alerts")
      .select("id,workspace_id,department_id,title,severity,status,assigned_to,resolved_by,resolved_at")
      .eq("id", alertId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existingAlert) {
      return NextResponse.json({ error: "Management alert not found." }, { status: 404 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, existingAlert.workspace_id);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      existingAlert.workspace_id,
      membership.role
    );

    if (!canManageManagementAlerts(accessContext.role)) {
      return NextResponse.json({ error: "Management alert update denied." }, { status: 403 });
    }

    if (
      !canViewCompany(accessContext.role) &&
      accessContext.departmentId &&
      existingAlert.department_id !== accessContext.departmentId
    ) {
      return NextResponse.json({ error: "Management alert scope denied." }, { status: 403 });
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

    const { data: updatedAlert, error: updateError } = await admin
      .from("operations_management_alerts")
      .update(updatePayload)
      .eq("id", alertId)
      .select("id,workspace_id,department_id,severity,status,assigned_to,resolved_by,resolved_at,updated_at")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: existingAlert.workspace_id,
      actor_user_id: user.id,
      action: "operations_management_alert.updated",
      entity_table: "operations_management_alerts",
      entity_id: alertId,
      previous_data: {
        status: existingAlert.status,
        severity: existingAlert.severity,
        assignedTo: existingAlert.assigned_to,
      },
      new_data: updatePayload,
      metadata: {
        source: "operations_management_alerts_api",
        accessContext,
      },
    });

    return NextResponse.json({
      ok: true,
      alert: {
        id: updatedAlert.id,
        workspaceId: updatedAlert.workspace_id,
        status: updatedAlert.status,
        severity: updatedAlert.severity,
        assignedTo: updatedAlert.assigned_to,
        resolvedBy: updatedAlert.resolved_by,
        resolvedAt: updatedAlert.resolved_at,
        updatedAt: updatedAlert.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
