import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  canViewCompanyData,
  canViewDepartmentData,
  canViewTeamData,
} from "@/lib/operations/access";
import {
  applyTaskScope,
  getOperationsAccessContext,
  getTeamEmployeeIds,
} from "@/lib/operations/scope";
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

const REVIEW_ROLE_LEVELS = {
  employee: 0,
  supervisor: 1,
  department_manager: 2,
  senior_manager: 3,
  director: 4,
  owner: 5,
};

async function getPrimaryRoleAssignment(admin, workspaceId, employeeId) {
  if (!employeeId) return null;

  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("employee_id, role, reports_to_employee_id, created_at")
    .eq("workspace_id", workspaceId)
    .eq("employee_id", employeeId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).sort((left, right) => {
    const roleDifference =
      (REVIEW_ROLE_LEVELS[right.role] ?? -1) -
      (REVIEW_ROLE_LEVELS[left.role] ?? -1);

    if (roleDifference !== 0) return roleDifference;

    return String(right.created_at || "").localeCompare(
      String(left.created_at || "")
    );
  })[0] || null;
}

async function getOwnerEmployeeId(admin, workspaceId) {
  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("employee_id, created_at")
    .eq("workspace_id", workspaceId)
    .eq("role", "owner")
    .eq("status", "active")
    .not("employee_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.employee_id || null;
}

async function getReviewRoute(admin, workspaceId, employeeId) {
  const sourceAssignment = await getPrimaryRoleAssignment(
    admin,
    workspaceId,
    employeeId
  );

  if (!sourceAssignment) {
    return {
      sourceRole: null,
      reviewerEmployeeId: null,
      reviewerName: null,
    };
  }

  if (sourceAssignment.role === "owner") {
    return {
      sourceRole: "owner",
      reviewerEmployeeId: null,
      reviewerName: null,
    };
  }

  let reviewerEmployeeId = sourceAssignment.reports_to_employee_id || null;

  if (!reviewerEmployeeId) {
    reviewerEmployeeId = await getOwnerEmployeeId(admin, workspaceId);
  }

  if (!reviewerEmployeeId || reviewerEmployeeId === employeeId) {
    return {
      sourceRole: sourceAssignment.role,
      reviewerEmployeeId: null,
      reviewerName: null,
    };
  }

  const { data: reviewer, error: reviewerError } = await admin
    .from("employees")
    .select("id, full_name, email")
    .eq("workspace_id", workspaceId)
    .eq("id", reviewerEmployeeId)
    .maybeSingle();

  if (reviewerError) {
    throw new Error(reviewerError.message);
  }

  return {
    sourceRole: sourceAssignment.role,
    reviewerEmployeeId: reviewer?.id || null,
    reviewerName:
      reviewer?.full_name || reviewer?.email || "the next reviewer",
  };
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
    currentReviewerEmployeeId: task.current_reviewer_employee_id || null,
    currentReviewerName:
      task.current_reviewer?.full_name ||
      task.current_reviewer?.email ||
      null,
    reviewStepCount: task.review_step_count || 0,
    finalVerifiedAt: task.final_verified_at || null,
    completedAt: task.completed_at || null,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
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

    const accessContext = await getOperationsAccessContext(
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
        current_reviewer_employee_id,
        review_step_count,
        final_verified_by_user_id,
        final_verified_by_employee_id,
        final_verified_at,
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
        ),
        current_reviewer:employees!operations_tasks_current_reviewer_employee_id_fkey (
          id,
          full_name,
          email
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    query = applyTaskScope(query, accessContext, teamEmployeeIds);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const taskRows = data || [];
    const taskIds = taskRows.map((task) => task.id).filter(Boolean);
    const taskUpdatesByTaskId = new Map();

    if (taskIds.length > 0) {
      const { data: updateRows, error: taskUpdatesError } = await admin
        .from("operations_task_updates")
        .select(
          `
          id,
          task_id,
          employee_id,
          update_text,
          status_after,
          created_at,
          event_type,
          actor_employee_id,
          previous_status,
          new_status,
          evidence,
          metadata
        `
        )
        .eq("workspace_id", workspaceId)
        .in("task_id", taskIds)
        .order("created_at", { ascending: true });

      if (taskUpdatesError) {
        return NextResponse.json(
          { error: taskUpdatesError.message },
          { status: 500 }
        );
      }

      const actorEmployeeIds = [
        ...new Set(
          (updateRows || [])
            .map(
              (update) =>
                update.actor_employee_id || update.employee_id || null
            )
            .filter(Boolean)
        ),
      ];
      const actorNamesByEmployeeId = new Map();

      if (actorEmployeeIds.length > 0) {
        const { data: actorEmployees, error: actorEmployeesError } = await admin
          .from("employees")
          .select("id, full_name, email")
          .eq("workspace_id", workspaceId)
          .in("id", actorEmployeeIds);

        if (actorEmployeesError) {
          return NextResponse.json(
            { error: actorEmployeesError.message },
            { status: 500 }
          );
        }

        for (const employee of actorEmployees || []) {
          actorNamesByEmployeeId.set(
            employee.id,
            employee.full_name || employee.email || "Unnamed employee"
          );
        }
      }

      for (const update of updateRows || []) {
        const actorEmployeeId =
          update.actor_employee_id || update.employee_id || null;
        const taskUpdate = {
          id: update.id,
          taskId: update.task_id,
          employeeId: update.employee_id || null,
          actorEmployeeId,
          actorName:
            actorNamesByEmployeeId.get(actorEmployeeId) || "System record",
          updateText: update.update_text,
          statusAfter: update.status_after || null,
          eventType: update.event_type || "comment",
          previousStatus: update.previous_status || null,
          newStatus: update.new_status || null,
          evidence: Array.isArray(update.evidence) ? update.evidence : [],
          metadata:
            update.metadata && typeof update.metadata === "object"
              ? update.metadata
              : {},
          createdAt: update.created_at,
        };
        const currentUpdates = taskUpdatesByTaskId.get(update.task_id) || [];

        currentUpdates.push(taskUpdate);
        taskUpdatesByTaskId.set(update.task_id, currentUpdates);
      }
    }

    return NextResponse.json({
      accessContext,
      tasks: taskRows.map((task) => ({
        ...mapTask(task),
        updates: taskUpdatesByTaskId.get(task.id) || [],
      })),
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

export async function POST(req) {
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
        { status: 401 }
      );
    }

    const body = await req.json();
    const workspaceId = cleanText(body?.workspaceId);
    const title = cleanText(body?.title);
    const description = cleanText(body?.description);
    const assignedEmployeeId = cleanText(body?.assignedEmployeeId);
    const dueAt = cleanText(body?.dueAt);
    const priority = cleanText(body?.priority || "normal").toLowerCase();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    if (title.length < 3 || title.length > 200) {
      return NextResponse.json(
        { error: "The task title must contain between 3 and 200 characters." },
        { status: 400 }
      );
    }

    if (description.length < 5 || description.length > 4000) {
      return NextResponse.json(
        {
          error:
            "The task instructions must contain between 5 and 4000 characters.",
        },
        { status: 400 }
      );
    }

    if (!assignedEmployeeId) {
      return NextResponse.json(
        { error: "Select an employee for this task." },
        { status: 400 }
      );
    }

    if (!dueAt) {
      return NextResponse.json(
        { error: "An exact deadline is required." },
        { status: 400 }
      );
    }

    const parsedDueAt = new Date(dueAt);

    if (Number.isNaN(parsedDueAt.getTime())) {
      return NextResponse.json(
        { error: "The task deadline is not a valid date and time." },
        { status: 400 }
      );
    }

    if (parsedDueAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "The task deadline must be in the future." },
        { status: 400 }
      );
    }

    const allowedPriorities = new Set([
      "normal",
      "medium",
      "high",
      "critical",
    ]);

    if (!allowedPriorities.has(priority)) {
      return NextResponse.json(
        { error: "The selected task priority is not supported." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(
      admin,
      user.id,
      workspaceId
    );

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    const workspaceValidation = await validateWorkspaceMutationAllowed(
      admin,
      workspaceId
    );

    if (!workspaceValidation.allowed) {
      return NextResponse.json(
        { error: workspaceValidation.message },
        { status: workspaceValidation.status }
      );
    }

    const accessContext = await getOperationsAccessContext(
      admin,
      user.id,
      workspaceId,
      membership.role
    );

    if (!MANAGEMENT_TASK_ROLES.has(accessContext.role)) {
      return NextResponse.json(
        { error: "Management authority is required to create tasks." },
        { status: 403 }
      );
    }

    const teamEmployeeIds = await getTeamEmployeeIds(
      admin,
      workspaceId,
      accessContext.employeeId
    );

    const { data: targetEmployee, error: employeeError } = await admin
      .from("employees")
      .select(
        "id, workspace_id, department_id, full_name, email, employment_status"
      )
      .eq("id", assignedEmployeeId)
      .eq("workspace_id", workspaceId)
      .eq("employment_status", "active")
      .maybeSingle();

    if (employeeError) {
      return NextResponse.json(
        { error: employeeError.message },
        { status: 500 }
      );
    }

    if (!targetEmployee) {
      return NextResponse.json(
        {
          error:
            "The selected employee was not found or is not active in this company.",
        },
        { status: 404 }
      );
    }

    const assignmentScopedTask = {
      department_id: targetEmployee.department_id || null,
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
            "You do not have authority to assign a task to this employee.",
        },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const normalizedDueAt = parsedDueAt.toISOString();

    const insertPayload = {
      workspace_id: workspaceId,
      department_id: targetEmployee.department_id || null,
      assigned_employee_id: targetEmployee.id,
      title,
      description,
      status: "assigned",
      priority,
      source_type: "manual",
      source_report_id: null,
      created_by: user.id,
      assigned_by_user_id: user.id,
      assigned_by_employee_id: accessContext.employeeId || null,
      assigned_at: now,
      due_at: normalizedDueAt,
      original_due_at: normalizedDueAt,
      deadline_extension_count: 0,
      deadline_last_changed_at: now,
      deadline_last_changed_by_user_id: user.id,
      deadline_last_changed_by_employee_id:
        accessContext.employeeId || null,
      updated_at: now,
    };

    const { data: createdTask, error: createError } = await admin
      .from("operations_tasks")
      .insert(insertPayload)
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
        source_report_id,
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
      .single();

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    const employeeName =
      targetEmployee.full_name ||
      targetEmployee.email ||
      "the selected employee";

    const { data: taskUpdate, error: historyError } = await admin
      .from("operations_task_updates")
      .insert({
        workspace_id: workspaceId,
        task_id: createdTask.id,
        employee_id: accessContext.employeeId || null,
        update_text: `Task created and assigned to ${employeeName}.`,
        status_after: "assigned",
        created_by: user.id,
        event_type: "assignment",
        actor_employee_id: accessContext.employeeId || null,
        previous_status: "open",
        new_status: "assigned",
        evidence: [],
        metadata: {
          action: "create_and_assign",
          source: "tasks_api",
          source_type: "manual",
          assigned_employee_id: targetEmployee.id,
          due_at: normalizedDueAt,
          original_due_at: normalizedDueAt,
          priority,
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
      const { error: cleanupError } = await admin
        .from("operations_tasks")
        .delete()
        .eq("id", createdTask.id)
        .eq("workspace_id", workspaceId);

      if (cleanupError) {
        return NextResponse.json(
          {
            error:
              "Task history creation failed and the incomplete task could not be removed.",
            details: {
              history: historyError.message,
              cleanup: cleanupError.message,
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Task history creation failed. The incomplete task was removed.",
          details: historyError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        task: mapTask(createdTask),
        taskUpdate,
        accessContext,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
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
        current_reviewer_employee_id,
        review_step_count,
        final_verified_by_user_id,
        final_verified_by_employee_id,
        final_verified_at,
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

    const accessContext = await getOperationsAccessContext(
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
    const isCurrentReviewer = Boolean(
      accessContext.employeeId &&
        existingTask.current_reviewer_employee_id === accessContext.employeeId
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
      !isCurrentReviewer
    ) {
      return NextResponse.json(
        { error: "This review step is assigned to another manager." },
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
    let eventMetadata = {};

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
        updatePayload.current_reviewer_employee_id = null;
        updatePayload.review_step_count = 0;
        updatePayload.final_verified_by_user_id = null;
        updatePayload.final_verified_by_employee_id = null;
        updatePayload.final_verified_at = null;
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
          updatePayload.current_reviewer_employee_id = null;
          updatePayload.review_step_count = 0;
          updatePayload.final_verified_by_user_id = null;
          updatePayload.final_verified_by_employee_id = null;
          updatePayload.final_verified_at = null;
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

      case "submit_for_review": {
        if (existingTask.status !== "in_progress") {
          return invalidTransition(action, existingTask.status);
        }

        const reviewRoute = await getReviewRoute(
          admin,
          existingTask.workspace_id,
          existingTask.assigned_employee_id
        );

        if (!reviewRoute.reviewerEmployeeId) {
          return NextResponse.json(
            {
              error:
                "No management reviewer is configured for the assigned employee. Update the reporting hierarchy before submitting this task.",
            },
            { status: 409 }
          );
        }

        newStatus = "submitted_for_review";
        eventType = "submission";
        defaultUpdateText = `Task submitted to ${reviewRoute.reviewerName} for management review.`;
        eventMetadata = {
          current_reviewer_employee_id: reviewRoute.reviewerEmployeeId,
          current_reviewer_name: reviewRoute.reviewerName,
          review_step_count: 0,
        };
        updatePayload.submitted_at = now;
        updatePayload.reviewed_by_user_id = null;
        updatePayload.reviewed_by_employee_id = null;
        updatePayload.reviewed_at = null;
        updatePayload.current_reviewer_employee_id =
          reviewRoute.reviewerEmployeeId;
        updatePayload.review_step_count = 0;
        updatePayload.final_verified_by_user_id = null;
        updatePayload.final_verified_by_employee_id = null;
        updatePayload.final_verified_at = null;
        updatePayload.completed_at = null;
        break;
      }

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
        updatePayload.current_reviewer_employee_id = null;
        updatePayload.completed_at = null;
        break;

      case "approve": {
        if (existingTask.status !== "submitted_for_review") {
          return invalidTransition(action, existingTask.status);
        }

        const reviewRoute = await getReviewRoute(
          admin,
          existingTask.workspace_id,
          accessContext.employeeId
        );

        updatePayload.reviewed_by_user_id = user.id;
        updatePayload.reviewed_by_employee_id =
          accessContext.employeeId || null;
        updatePayload.reviewed_at = now;

        if (reviewRoute.sourceRole === "owner") {
          newStatus = "completed";
          eventType = "final_verification";
          defaultUpdateText = "Owner verified and completed the task.";
          eventMetadata = {
            final_verification: true,
            final_verifier_employee_id: accessContext.employeeId || null,
            review_step_count: existingTask.review_step_count || 0,
          };
          updatePayload.current_reviewer_employee_id = null;
          updatePayload.final_verified_by_user_id = user.id;
          updatePayload.final_verified_by_employee_id =
            accessContext.employeeId || null;
          updatePayload.final_verified_at = now;
          updatePayload.completed_at = now;
        } else {
          if (!reviewRoute.reviewerEmployeeId) {
            return NextResponse.json(
              {
                error:
                  "The next reviewer could not be resolved from the reporting hierarchy.",
              },
              { status: 409 }
            );
          }

          const nextReviewStep = (existingTask.review_step_count || 0) + 1;

          newStatus = "submitted_for_review";
          eventType = "review_approved";
          defaultUpdateText = `Review approved and forwarded to ${reviewRoute.reviewerName}.`;
          eventMetadata = {
            final_verification: false,
            approved_by_employee_id: accessContext.employeeId || null,
            next_reviewer_employee_id: reviewRoute.reviewerEmployeeId,
            next_reviewer_name: reviewRoute.reviewerName,
            review_step_count: nextReviewStep,
          };
          updatePayload.current_reviewer_employee_id =
            reviewRoute.reviewerEmployeeId;
          updatePayload.review_step_count = nextReviewStep;
          updatePayload.final_verified_by_user_id = null;
          updatePayload.final_verified_by_employee_id = null;
          updatePayload.final_verified_at = null;
          updatePayload.completed_at = null;
        }
        break;
      }

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
        updatePayload.current_reviewer_employee_id = null;
        updatePayload.review_step_count = 0;
        updatePayload.final_verified_by_user_id = null;
        updatePayload.final_verified_by_employee_id = null;
        updatePayload.final_verified_at = null;
        updatePayload.completed_at = null;
        break;

      case "cancel":
        if (["completed", "cancelled"].includes(existingTask.status)) {
          return invalidTransition(action, existingTask.status);
        }

        newStatus = "cancelled";
        eventType = "cancelled";
        defaultUpdateText = "Task cancelled by management.";
        updatePayload.current_reviewer_employee_id = null;
        updatePayload.final_verified_by_user_id = null;
        updatePayload.final_verified_by_employee_id = null;
        updatePayload.final_verified_at = null;
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

    let taskUpdateQuery = admin
      .from("operations_tasks")
      .update(updatePayload)
      .eq("id", existingTask.id)
      .eq("workspace_id", existingTask.workspace_id)
      .eq("status", existingTask.status);

    if (
      existingTask.status === "submitted_for_review" &&
      existingTask.current_reviewer_employee_id
    ) {
      taskUpdateQuery = taskUpdateQuery.eq(
        "current_reviewer_employee_id",
        existingTask.current_reviewer_employee_id
      );
    }

    const { data: updatedTask, error: updateError } = await taskUpdateQuery
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
        current_reviewer_employee_id,
        review_step_count,
        final_verified_by_user_id,
        final_verified_by_employee_id,
        final_verified_at,
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
        ),
        current_reviewer:employees!operations_tasks_current_reviewer_employee_id_fkey (
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
          ...eventMetadata,
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
        current_reviewer_employee_id:
          existingTask.current_reviewer_employee_id,
        review_step_count: existingTask.review_step_count,
        final_verified_by_user_id:
          existingTask.final_verified_by_user_id,
        final_verified_by_employee_id:
          existingTask.final_verified_by_employee_id,
        final_verified_at: existingTask.final_verified_at,
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