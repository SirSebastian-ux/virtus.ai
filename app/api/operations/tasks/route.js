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
    assignedEmployeeName: task.assigned_employee?.full_name || null,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueAt: task.due_at || null,
    dueDate: task.due_at || task.due_date || null,
    originalDueAt: task.original_due_at || null,
    deadlineExtensionCount: task.deadline_extension_count || 0,
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
        due_at,
        original_due_at,
        deadline_extension_count,
        deadline_last_changed_at,
        deadline_last_changed_by_user_id,
        deadline_last_changed_by_employee_id,
        source_report_id,
        created_at,
        updated_at,
        departments (
          id,
          name
        ),
        assigned_employee:employees!operations_tasks_assigned_employee_id_fkey (
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

const MANAGEMENT_TASK_ROLES = new Set([
  "owner",
  "director",
  "senior_manager",
  "department_manager",
  "supervisor",
]);

const ASSIGNEE_TASK_ACTIONS = new Set([
  "acknowledge",
  "resume",
  "mark_blocked",
  "progress_update",
  "submit_for_review",
]);

const MANAGER_TASK_ACTIONS = new Set([
  "assign",
  "reassign",
  "request_changes",
  "approve",
  "reopen",
  "cancel",
]);

const SUPPORTED_TASK_ACTIONS = new Set([
  ...ASSIGNEE_TASK_ACTIONS,
  ...MANAGER_TASK_ACTIONS,
  "comment",
]);

function canManageTask(existingTask, accessContext, teamEmployeeIds = []) {
  if (!MANAGEMENT_TASK_ROLES.has(accessContext.role)) {
    return false;
  }

  return canUpdateTask(existingTask, accessContext, teamEmployeeIds);
}

function invalidTransition(action, status) {
  return NextResponse.json(
    {
      error: `Action "${action}" is not allowed while the task is "${status}".`,
    },
    { status: 409 }
  );
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
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json();
    const taskId = cleanText(body?.taskId);
    const action = cleanText(body?.action).toLowerCase();
    const assignedEmployeeId = cleanText(body?.assignedEmployeeId);
    const dueAt = cleanText(body?.dueAt);
    const updateText = cleanText(body?.updateText || body?.message);
    const evidence = body?.evidence ?? [];

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required." },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "A controlled task action is required." },
        { status: 400 }
      );
    }

    if (!SUPPORTED_TASK_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: `Unsupported task action: "${action}".` },
        { status: 400 }
      );
    }

    const isAssignmentAction = ["assign", "reassign"].includes(action);

    if (isAssignmentAction && !assignedEmployeeId) {
      return NextResponse.json(
        { error: "assignedEmployeeId is required for task assignment." },
        { status: 400 }
      );
    }

    if (isAssignmentAction && !dueAt) {
      return NextResponse.json(
        { error: "An exact deadline is required for task assignment." },
        { status: 400 }
      );
    }

    const parsedDueAt = isAssignmentAction ? new Date(dueAt) : null;

    if (isAssignmentAction && Number.isNaN(parsedDueAt.getTime())) {
      return NextResponse.json(
        { error: "The task deadline is not a valid date and time." },
        { status: 400 }
      );
    }

    const normalizedDueAt = isAssignmentAction
      ? parsedDueAt.toISOString()
      : null;

    if (updateText.length > 4000) {
      return NextResponse.json(
        { error: "Task updates cannot exceed 4000 characters." },
        { status: 400 }
      );
    }

    if (!Array.isArray(evidence)) {
      return NextResponse.json(
        { error: "evidence must be an array." },
        { status: 400 }
      );
    }

    if (evidence.length > 10) {
      return NextResponse.json(
        { error: "A task update can contain at most 10 evidence items." },
        { status: 400 }
      );
    }

    if (
      evidence.some(
        (item) => !item || typeof item !== "object" || Array.isArray(item)
      )
    ) {
      return NextResponse.json(
        { error: "Every evidence item must be an object." },
        { status: 400 }
      );
    }

    if (JSON.stringify(evidence).length > 20000) {
      return NextResponse.json(
        { error: "The evidence metadata is too large." },
        { status: 400 }
      );
    }

    const actionsRequiringExplanation = new Set([
      "mark_blocked",
      "progress_update",
      "reassign",
      "request_changes",
      "reopen",
      "cancel",
      "comment",
    ]);

    if (actionsRequiringExplanation.has(action) && !updateText) {
      return NextResponse.json(
        { error: `Action "${action}" requires an explanation.` },
        { status: 400 }
      );
    }

    const { data: existingTask, error: taskError } = await admin
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
        due_at,
        original_due_at,
        deadline_extension_count,
        deadline_last_changed_at,
        deadline_last_changed_by_user_id,
        deadline_last_changed_by_employee_id,
        source_report_id,
        source_type,
        created_by,
        assigned_by_user_id,
        assigned_by_employee_id,
        assigned_at,
        submitted_at,
        reviewed_by_user_id,
        reviewed_by_employee_id,
        reviewed_at,
        completed_at,
        created_at,
        updated_at
      `
      )
      .eq("id", taskId)
      .maybeSingle();

    if (taskError) {
      return NextResponse.json({ error: taskError.message }, { status: 500 });
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
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    const wsValidation = await validateWorkspaceMutationAllowed(
      admin,
      existingTask.workspace_id
    );

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

    const isAssignee = Boolean(
      accessContext.employeeId &&
        existingTask.assigned_employee_id === accessContext.employeeId
    );

    const hasManagerAuthority = canManageTask(
      existingTask,
      accessContext,
      teamEmployeeIds
    );

    if (ASSIGNEE_TASK_ACTIONS.has(action) && !isAssignee) {
      return NextResponse.json(
        { error: "Only the assigned employee can perform this action." },
        { status: 403 }
      );
    }

    if (MANAGER_TASK_ACTIONS.has(action) && !hasManagerAuthority) {
      return NextResponse.json(
        { error: "Management authority is required for this action." },
        { status: 403 }
      );
    }

    if (action === "comment" && !isAssignee && !hasManagerAuthority) {
      return NextResponse.json(
        { error: "You do not have permission to comment on this task." },
        { status: 403 }
      );
    }

    if (
      ["request_changes", "approve"].includes(action) &&
      isAssignee
    ) {
      return NextResponse.json(
        { error: "You cannot review or approve your own assigned task." },
        { status: 403 }
      );
    }

    if (isAssignmentAction) {
      const requestedDueAtMs = parsedDueAt.getTime();
      const existingDueAtMs = existingTask.due_at
        ? new Date(existingTask.due_at).getTime()
        : null;

      if (
        action === "reassign" &&
        existingDueAtMs !== null &&
        existingDueAtMs !== requestedDueAtMs
      ) {
        return NextResponse.json(
          {
            error:
              "Reassignment cannot silently change the deadline. Use the controlled deadline-extension workflow.",
          },
          { status: 409 }
        );
      }

      if (
        (action === "assign" || existingDueAtMs === null) &&
        requestedDueAtMs <= Date.now()
      ) {
        return NextResponse.json(
          { error: "The task deadline must be in the future." },
          { status: 400 }
        );
      }
    }

    let assignmentEmployee = null;

    if (isAssignmentAction) {
      const { data: targetEmployee, error: employeeError } = await admin
        .from("employees")
        .select("id, department_id, full_name, email")
        .eq("id", assignedEmployeeId)
        .eq("workspace_id", existingTask.workspace_id)
        .maybeSingle();

      if (employeeError) {
        return NextResponse.json(
          { error: employeeError.message },
          { status: 500 }
        );
      }

      if (!targetEmployee) {
        return NextResponse.json(
          { error: "The selected employee was not found in this company." },
          { status: 404 }
        );
      }

      if (
        existingTask.department_id &&
        targetEmployee.department_id !== existingTask.department_id
      ) {
        return NextResponse.json(
          {
            error:
              "The selected employee does not belong to the task department.",
          },
          { status: 409 }
        );
      }

      const assignmentScopedTask = {
        ...existingTask,
        department_id:
          existingTask.department_id || targetEmployee.department_id || null,
        assigned_employee_id: targetEmployee.id,
      };

      if (
        !canManageTask(
          assignmentScopedTask,
          accessContext,
          teamEmployeeIds
        )
      ) {
        return NextResponse.json(
          {
            error:
              "You do not have authority to assign this task to the selected employee.",
          },
          { status: 403 }
        );
      }

      assignmentEmployee = targetEmployee;
    }

    const now = new Date().toISOString();
    const updatePayload = {
      updated_at: now,
    };

    let newStatus = existingTask.status;
    let eventType = "status_change";
    let defaultUpdateText = "Task status updated.";

    switch (action) {
      case "assign":
      case "reassign": {
        if (
          action === "assign" &&
          (existingTask.status !== "open" ||
            existingTask.assigned_employee_id)
        ) {
          return invalidTransition(action, existingTask.status);
        }

        if (
          action === "reassign" &&
          (!existingTask.assigned_employee_id ||
            ![
              "open",
              "assigned",
              "in_progress",
              "blocked",
              "changes_requested",
            ].includes(existingTask.status))
        ) {
          return invalidTransition(action, existingTask.status);
        }

        if (
          action === "reassign" &&
          existingTask.assigned_employee_id === assignmentEmployee.id
        ) {
          return NextResponse.json(
            { error: "The task is already assigned to this employee." },
            { status: 409 }
          );
        }

        const employeeName =
          assignmentEmployee.full_name ||
          assignmentEmployee.email ||
          "the selected employee";

        newStatus = "assigned";
        eventType = action === "assign" ? "assignment" : "reassignment";
        defaultUpdateText =
          action === "assign"
            ? `Task assigned to ${employeeName}.`
            : `Task reassigned to ${employeeName}.`;

        updatePayload.department_id =
          existingTask.department_id ||
          assignmentEmployee.department_id ||
          null;
        updatePayload.assigned_employee_id = assignmentEmployee.id;
        updatePayload.assigned_by_user_id = user.id;
        updatePayload.assigned_by_employee_id =
          accessContext.employeeId || null;
        updatePayload.assigned_at = now;
        updatePayload.due_at = normalizedDueAt;
        updatePayload.original_due_at =
          existingTask.original_due_at || normalizedDueAt;

        if (!existingTask.due_at) {
          updatePayload.deadline_last_changed_at = now;
          updatePayload.deadline_last_changed_by_user_id = user.id;
          updatePayload.deadline_last_changed_by_employee_id =
            accessContext.employeeId || null;
        }

        updatePayload.submitted_at = null;
        updatePayload.reviewed_by_user_id = null;
        updatePayload.reviewed_by_employee_id = null;
        updatePayload.reviewed_at = null;
        updatePayload.completed_at = null;
        break;
      }

      case "acknowledge":
        if (
          !["open", "assigned", "changes_requested"].includes(
            existingTask.status
          )
        ) {
          return invalidTransition(action, existingTask.status);
        }

        newStatus = "in_progress";
        eventType = "acknowledgement";
        defaultUpdateText =
          existingTask.status === "changes_requested"
            ? "Requested changes acknowledged and work resumed."
            : "Task acknowledged and work started.";

        if (existingTask.status === "changes_requested") {
          updatePayload.submitted_at = null;
          updatePayload.reviewed_by_user_id = null;
          updatePayload.reviewed_by_employee_id = null;
          updatePayload.reviewed_at = null;
          updatePayload.completed_at = null;
        }
        break;

      case "resume":
        if (existingTask.status !== "blocked") {
          return invalidTransition(action, existingTask.status);
        }

        newStatus = "in_progress";
        eventType = "reopened";
        defaultUpdateText = "Task resumed after being blocked.";
        break;

      case "mark_blocked":
        if (
          !["assigned", "in_progress", "changes_requested"].includes(
            existingTask.status
          )
        ) {
          return invalidTransition(action, existingTask.status);
        }

        newStatus = "blocked";
        eventType = "blocked";
        defaultUpdateText = "Task marked as blocked.";
        break;

      case "progress_update":
        if (!["in_progress", "blocked"].includes(existingTask.status)) {
          return invalidTransition(action, existingTask.status);
        }

        eventType = "progress_update";
        defaultUpdateText = "Progress update added.";
        break;

      case "submit_for_review":
        if (existingTask.status !== "in_progress") {
          return invalidTransition(action, existingTask.status);
        }

        newStatus = "submitted_for_review";
        eventType = "submission";
        defaultUpdateText = "Task submitted for management review.";
        updatePayload.submitted_at = now;
        updatePayload.reviewed_by_user_id = null;
        updatePayload.reviewed_by_employee_id = null;
        updatePayload.reviewed_at = null;
        updatePayload.completed_at = null;
        break;

      case "request_changes":
        if (existingTask.status !== "submitted_for_review") {
          return invalidTransition(action, existingTask.status);
        }

        newStatus = "changes_requested";
        eventType = "changes_requested";
        defaultUpdateText = "Management requested changes.";
        updatePayload.reviewed_by_user_id = user.id;
        updatePayload.reviewed_by_employee_id =
          accessContext.employeeId || null;
        updatePayload.reviewed_at = now;
        updatePayload.completed_at = null;
        break;

      case "approve":
        if (existingTask.status !== "submitted_for_review") {
          return invalidTransition(action, existingTask.status);
        }

        newStatus = "completed";
        eventType = "approval";
        defaultUpdateText = "Task approved and completed.";
        updatePayload.reviewed_by_user_id = user.id;
        updatePayload.reviewed_by_employee_id =
          accessContext.employeeId || null;
        updatePayload.reviewed_at = now;
        updatePayload.completed_at = now;
        break;

      case "reopen":
        if (!["completed", "cancelled"].includes(existingTask.status)) {
          return invalidTransition(action, existingTask.status);
        }

        newStatus = existingTask.assigned_employee_id ? "assigned" : "open";
        eventType = "reopened";
        defaultUpdateText = "Task reopened by management.";
        updatePayload.submitted_at = null;
        updatePayload.reviewed_by_user_id = null;
        updatePayload.reviewed_by_employee_id = null;
        updatePayload.reviewed_at = null;
        updatePayload.completed_at = null;
        break;

      case "cancel":
        if (["completed", "cancelled"].includes(existingTask.status)) {
          return invalidTransition(action, existingTask.status);
        }

        newStatus = "cancelled";
        eventType = "cancelled";
        defaultUpdateText = "Task cancelled by management.";
        updatePayload.completed_at = null;
        break;

      case "comment":
        eventType = "comment";
        defaultUpdateText = "Comment added.";
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported task action." },
          { status: 400 }
        );
    }

    updatePayload.status = newStatus;

    const { data: updatedTask, error: updateError } = await admin
      .from("operations_tasks")
      .update(updatePayload)
      .eq("id", existingTask.id)
      .eq("workspace_id", existingTask.workspace_id)
      .eq("status", existingTask.status)
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
        due_at,
        original_due_at,
        deadline_extension_count,
        deadline_last_changed_at,
        deadline_last_changed_by_user_id,
        deadline_last_changed_by_employee_id,
        source_report_id,
        source_type,
        assigned_by_user_id,
        assigned_by_employee_id,
        assigned_at,
        submitted_at,
        reviewed_by_user_id,
        reviewed_by_employee_id,
        reviewed_at,
        completed_at,
        created_at,
        updated_at,
        departments (
          id,
          name
        ),
        assigned_employee:employees!operations_tasks_assigned_employee_id_fkey (
          id,
          full_name,
          email
        )
      `
      )
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updatedTask) {
      return NextResponse.json(
        {
          error:
            "The task changed while this action was being processed. Refresh and try again.",
        },
        { status: 409 }
      );
    }

    const eventText = updateText || defaultUpdateText;

    const { data: taskUpdate, error: historyError } = await admin
      .from("operations_task_updates")
      .insert({
        workspace_id: existingTask.workspace_id,
        task_id: existingTask.id,
        employee_id: accessContext.employeeId || null,
        update_text: eventText,
        status_after: newStatus,
        created_by: user.id,
        event_type: eventType,
        actor_employee_id: accessContext.employeeId || null,
        previous_status: existingTask.status,
        new_status: newStatus,
        evidence,
        metadata: {
          action,
          source: "tasks_api",
          ...(assignmentEmployee
            ? {
                assigned_employee_id: assignmentEmployee.id,
                due_at: normalizedDueAt,
                original_due_at:
                  existingTask.original_due_at || normalizedDueAt,
              }
            : {}),
        },
      })
      .select(
        `
        id,
        workspace_id,
        task_id,
        employee_id,
        update_text,
        status_after,
        created_by,
        created_at,
        event_type,
        actor_employee_id,
        previous_status,
        new_status,
        evidence,
        metadata
      `
      )
      .single();

    if (historyError) {
      const rollbackPayload = {
        department_id: existingTask.department_id,
        assigned_employee_id: existingTask.assigned_employee_id,
        assigned_by_user_id: existingTask.assigned_by_user_id,
        assigned_by_employee_id: existingTask.assigned_by_employee_id,
        assigned_at: existingTask.assigned_at,
        due_date: existingTask.due_date,
        due_at: existingTask.due_at,
        original_due_at: existingTask.original_due_at,
        deadline_extension_count: existingTask.deadline_extension_count,
        deadline_last_changed_at: existingTask.deadline_last_changed_at,
        deadline_last_changed_by_user_id:
          existingTask.deadline_last_changed_by_user_id,
        deadline_last_changed_by_employee_id:
          existingTask.deadline_last_changed_by_employee_id,
        status: existingTask.status,
        submitted_at: existingTask.submitted_at,
        reviewed_by_user_id: existingTask.reviewed_by_user_id,
        reviewed_by_employee_id: existingTask.reviewed_by_employee_id,
        reviewed_at: existingTask.reviewed_at,
        completed_at: existingTask.completed_at,
        updated_at: existingTask.updated_at,
      };

      const { error: rollbackError } = await admin
        .from("operations_tasks")
        .update(rollbackPayload)
        .eq("id", existingTask.id)
        .eq("workspace_id", existingTask.workspace_id)
        .eq("updated_at", now);

      if (rollbackError) {
        return NextResponse.json(
          {
            error:
              "Task history could not be recorded and the task rollback also failed.",
            details: {
              history: historyError.message,
              rollback: rollbackError.message,
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Task history could not be recorded. The task change was rolled back.",
          details: historyError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      task: mapTask(updatedTask),
      taskUpdate,
      action,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}