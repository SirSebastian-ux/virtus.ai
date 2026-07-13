import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  canViewCompanyData,
  canViewDepartmentData,
  canViewTeamData,
} from "@/lib/operations/access";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";

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

  return {
    role,
    employeeId: data?.employee_id || null,
    departmentId: data?.department_id || null,
    reportsToEmployeeId: data?.reports_to_employee_id || null,
    scopeType: data?.scope_type || "self",
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

function mapTask(task) {
  return {
    id: task.id,
    workspaceId: task.workspace_id,
    departmentId: task.department_id,
    departmentName: task.departments?.name || null,
    assignedEmployeeId: task.assigned_employee_id,
    assignedEmployeeName: task.employees?.full_name || null,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date,
    sourceReportId: task.source_report_id,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

function applyTaskAccessFilter(query, accessContext, teamEmployeeIds = []) {
  if (canViewCompanyData(accessContext.role)) {
    return query;
  }

  if (canViewDepartmentData(accessContext.role) && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (canViewTeamData(accessContext.role) && accessContext.employeeId) {
    const allowedEmployeeIds = [accessContext.employeeId, ...teamEmployeeIds];

    if (allowedEmployeeIds.length > 0) {
      return query.in("assigned_employee_id", allowedEmployeeIds);
    }
  }

  if (accessContext.employeeId) {
    return query.eq("assigned_employee_id", accessContext.employeeId);
  }

  return query.eq("assigned_employee_id", "00000000-0000-0000-0000-000000000000");
}

function canUpdateTask(existingTask, accessContext, teamEmployeeIds = []) {
  if (canViewCompanyData(accessContext.role)) return true;

  if (
    canViewDepartmentData(accessContext.role) &&
    accessContext.departmentId &&
    existingTask.department_id === accessContext.departmentId
  ) {
    return true;
  }

  if (
    canViewTeamData(accessContext.role) &&
    existingTask.assigned_employee_id &&
    [accessContext.employeeId, ...teamEmployeeIds].includes(existingTask.assigned_employee_id)
  ) {
    return true;
  }

  return Boolean(
    accessContext.employeeId &&
      existingTask.assigned_employee_id === accessContext.employeeId
  );
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
      return NextResponse.json({ tasks: [] }, { status: 401 });
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
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      workspaceId,
      membership.role
    );
    const teamEmployeeIds = await getTeamEmployeeIds(
      admin,
      workspaceId,
      accessContext.employeeId
    );

    let query = admin
      .from("operations_tasks")
      .select(
        `
        id,
        workspace_id,
        department_id,
        assigned_employee_id,
        title,
        description,
        status,
        priority,
        due_date,
        source_report_id,
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

    query = applyTaskAccessFilter(query, accessContext, teamEmployeeIds);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      accessContext,
      tasks: (data || []).map(mapTask),
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
    const taskId = cleanText(body?.taskId);
    const status = cleanText(body?.status);

    if (!taskId || !status) {
      return NextResponse.json(
        { error: "taskId and status are required." },
        { status: 400 }
      );
    }

    const { data: existingTask, error: existingError } = await admin
      .from("operations_tasks")
      .select("id, workspace_id, department_id, assigned_employee_id, status")
      .eq("id", taskId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const membership = await requireWorkspaceMember(
      admin,
      user.id,
      existingTask.workspace_id
    );

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const wsValidation = await validateWorkspaceMutationAllowed(admin, existingTask.workspace_id);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      existingTask.workspace_id,
      membership.role
    );
    const teamEmployeeIds = await getTeamEmployeeIds(
      admin,
      existingTask.workspace_id,
      accessContext.employeeId
    );

    if (!canUpdateTask(existingTask, accessContext, teamEmployeeIds)) {
      return NextResponse.json({ error: "Task update access denied." }, { status: 403 });
    }

    const { data: updatedTask, error: updateError } = await admin
      .from("operations_tasks")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select("id, workspace_id, status, updated_at")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: existingTask.workspace_id,
      actor_user_id: user.id,
      action: "operations_task.status_updated",
      entity_table: "operations_tasks",
      entity_id: taskId,
      previous_data: {
        status: existingTask.status,
      },
      new_data: {
        status,
      },
      metadata: {
        source: "operations_tasks_api",
        accessContext,
      },
    });

    return NextResponse.json({
      ok: true,
      task: {
        id: updatedTask.id,
        workspaceId: updatedTask.workspace_id,
        status: updatedTask.status,
        updatedAt: updatedTask.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
