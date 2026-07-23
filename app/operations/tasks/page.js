"use client";

import { useCallback, useEffect, useState } from "react";

const MANAGER_ROLES = new Set([
  "owner",
  "director",
  "senior_manager",
  "department_manager",
  "supervisor",
]);

const EXPLANATION_ACTIONS = new Set([
  "progress_update",
  "mark_blocked",
  "reassign",
  "request_changes",
  "reopen",
  "cancel",
  "comment",
]);

const REASSIGNABLE_STATUSES = new Set([
  "open",
  "assigned",
  "in_progress",
  "blocked",
  "changes_requested",
]);

const STATUS_LABELS = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In progress",
  blocked: "Blocked",
  submitted_for_review: "Awaiting review",
  changes_requested: "Changes requested",
  completed: "Completed",
  cancelled: "Cancelled",
};

const ACTION_LABELS = {
  acknowledge: "Acknowledge and start",
  progress_update: "Record progress",
  mark_blocked: "Mark blocked",
  resume: "Resume task",
  submit_for_review: "Submit for review",
  request_changes: "Request changes",
  approve: "Approve",
  reopen: "Reopen",
  cancel: "Cancel task",
  comment: "Add comment",
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Unknown";
}

function getStatusClasses(status) {
  switch (status) {
    case "completed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "submitted_for_review":
      return "border-sky-500/30 bg-sky-500/10 text-sky-300";
    case "in_progress":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "blocked":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "changes_requested":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "cancelled":
      return "border-zinc-600 bg-zinc-800 text-zinc-400";
    case "assigned":
      return "border-violet-500/30 bg-violet-500/10 text-violet-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

function getPriorityClasses(priority) {
  switch (priority) {
    case "critical":
      return "text-red-300";
    case "high":
      return "text-orange-300";
    case "medium":
      return "text-amber-300";
    default:
      return "text-zinc-400";
   }
}

function getAssigneeActions(status) {
  switch (status) {
    case "assigned":
    case "changes_requested":
      return ["acknowledge"];
    case "in_progress":
      return ["progress_update", "mark_blocked", "submit_for_review"];
    case "blocked":
      return ["progress_update", "resume"];
    default:
      return [];
  }
}

function getManagerActions(status) {
  if (status === "submitted_for_review") {
    return ["request_changes", "approve", "cancel"];
  }

  if (status === "completed" || status === "cancelled") {
    return ["reopen"];
  }

  return ["cancel"];
}

function formatDateTime(value) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toDateTimeLocalValue(value) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) => String(number).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

function formatDeadlineDistance(milliseconds) {
  const totalMinutes = Math.max(
    1,
    Math.ceil(Math.abs(milliseconds) / 60000)
  );
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getDeadlineState(task, nowMs) {
  if (
    !nowMs ||
    ["completed", "cancelled"].includes(task?.status)
  ) {
    return null;
  }

  const deadlineValue = task?.dueAt || task?.dueDate;

  if (!deadlineValue) {
    return null;
  }

  const deadline = new Date(deadlineValue);

  if (Number.isNaN(deadline.getTime())) {
    return null;
  }

  const remainingMs = deadline.getTime() - nowMs;

  if (remainingMs <= 0) {
    return {
      label: `Overdue · ${formatDeadlineDistance(remainingMs)}`,
      classes: "border-red-500/30 bg-red-500/10 text-red-300",
    };
  }

  if (remainingMs <= 24 * 60 * 60 * 1000) {
    return {
      label: `Approaching · ${formatDeadlineDistance(remainingMs)}`,
      classes: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    };
  }

  return {
    label: `Due in ${formatDeadlineDistance(remainingMs)}`,
    classes: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  };
}

function getEmployeeId(employee) {
  return employee?.id || "";
}

function getEmployeeName(employee) {
  return (
    employee?.fullName ||
    employee?.full_name ||
    employee?.name ||
    employee?.email ||
    "Unnamed employee"
  );
}

function getEmployeeDepartmentId(employee) {
  return employee?.departmentId || employee?.department_id || null;
}



export default function OperationsTasksPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accessContext, setAccessContext] = useState(null);
  const [notes, setNotes] = useState({});
  const [assignmentSelections, setAssignmentSelections] = useState({});
  const [assignmentDeadlines, setAssignmentDeadlines] = useState({});
  const [clockNow, setClockNow] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const refreshClock = () => {
      setClockNow(Date.now());
    };

    const initialTimer = window.setTimeout(refreshClock, 0);
    const intervalTimer = window.setInterval(refreshClock, 60000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalTimer);
    };
  }, []);

  const loadWorkspaceContext = useCallback(async (workspaceId) => {
    if (!workspaceId) {
      setTasks([]);
      setEmployees([]);
      setAccessContext(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const encodedWorkspaceId = encodeURIComponent(workspaceId);

      const [taskResponse, employeeResponse] = await Promise.all([
        fetch(`/api/operations/tasks?workspaceId=${encodedWorkspaceId}`, {
          cache: "no-store",
        }),
        fetch(`/api/operations/employees?workspaceId=${encodedWorkspaceId}`, {
          cache: "no-store",
        }),
      ]);

      const taskData = await taskResponse.json().catch(() => ({}));
      const employeeData = await employeeResponse.json().catch(() => ({}));

      if (!taskResponse.ok) {
        throw new Error(taskData?.error || "Unable to load tasks.");
      }

      setTasks(Array.isArray(taskData?.tasks) ? taskData.tasks : []);
      setAccessContext(taskData?.accessContext || null);

      if (employeeResponse.ok && Array.isArray(employeeData?.employees)) {
        setEmployees(employeeData.employees);
      } else {
        setEmployees([]);
      }
    } catch (loadError) {
      setTasks([]);
      setEmployees([]);
      setAccessContext(null);
      setError(loadError.message || "Unable to load the task workspace.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    function synchronizeActiveWorkspace() {
      const workspaceId =
        window.localStorage.getItem("virtus_active_workspace_id") || "";
      const workspaceName =
        window.localStorage.getItem("virtus_active_workspace_name") || "";

      setActiveWorkspaceId(workspaceId);
      setActiveWorkspaceName(workspaceName);
    }

    synchronizeActiveWorkspace();

    window.addEventListener(
      "virtus-active-workspace-changed",
      synchronizeActiveWorkspace
    );

    return () => {
      window.removeEventListener(
        "virtus-active-workspace-changed",
        synchronizeActiveWorkspace
      );
    };
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadWorkspaceContext(activeWorkspaceId);
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [activeWorkspaceId, loadWorkspaceContext]);

  async function handleAction(
    task,
    action,
    assignedEmployeeId = "",
    dueAt = ""
  ) {
    const updateText = (notes[task.id] || "").trim();
    const isAssignmentAction = ["assign", "reassign"].includes(action);

    if (EXPLANATION_ACTIONS.has(action) && !updateText) {
      setError(`A written explanation is required to ${ACTION_LABELS[action].toLowerCase()}.`);
      return;
    }

    if (isAssignmentAction && !assignedEmployeeId) {
      setError("Select an employee before assigning the task.");
      return;
    }

    let normalizedDueAt = "";

    if (isAssignmentAction) {
      if (!dueAt) {
        setError("Select an exact deadline before assigning the task.");
        return;
      }

      const parsedDueAt = new Date(dueAt);

      if (Number.isNaN(parsedDueAt.getTime())) {
        setError("The selected deadline is not a valid date and time.");
        return;
      }

      const taskHasExistingDeadline = Boolean(task?.dueAt || task?.dueDate);

      if (
        clockNow !== null &&
        (action === "assign" || !taskHasExistingDeadline) &&
        parsedDueAt.getTime() <= clockNow
      ) {
        setError("The task deadline must be in the future.");
        return;
      }

      normalizedDueAt = parsedDueAt.toISOString();
    }

    setUpdatingTaskId(task.id);
    setError("");

    try {
      const response = await fetch("/api/operations/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: task.id,
          action,
          updateText,
          ...(isAssignmentAction
            ? {
                assignedEmployeeId,
                dueAt: normalizedDueAt,
              }
            : {}),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update the task.");
      }

      setNotes((current) => ({
        ...current,
        [task.id]: "",
      }));

      await loadWorkspaceContext(activeWorkspaceId);
    } catch (actionError) {
      setError(actionError.message || "Unable to update the task.");
    } finally {
      setUpdatingTaskId("");
    }
  }

  const role = accessContext?.role || "";
  const canManageTasks = MANAGER_ROLES.has(role);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">
            Operations Intelligence
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Tasks
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Assign work, record execution progress, submit evidence for review,
            and preserve a controlled management history.
          </p>

          {activeWorkspaceId ? (
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-200">
                Active company: {activeWorkspaceName || "Selected company"}
              </span>

              {accessContext?.role ? (
                <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-zinc-300">
                  Access: {accessContext.role.replaceAll("_", " ")}
                  {accessContext.scopeType
                    ? ` · ${accessContext.scopeType.replaceAll("_", " ")} scope`
                    : ""}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!activeWorkspaceId ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
            <h2 className="text-lg font-semibold">No active company selected</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Select the company from the Operations company switcher. This
              page will then load only that company&apos;s tasks.
            </p>
          </section>
        ) : isLoading ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-sm text-zinc-400">
            Loading tasks...
          </section>
        ) : tasks.length === 0 ? (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
            <h2 className="text-lg font-semibold">No tasks found</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Tasks extracted from daily reports will appear here for controlled
              assignment and execution.
            </p>
          </section>
        ) : (
          <div className="space-y-5">
            {tasks.map((task) => {
              const assignedEmployeeId = task.assignedEmployeeId || "";
              const isAssignee =
                Boolean(accessContext?.employeeId) &&
                assignedEmployeeId === accessContext.employeeId;
              const assigneeActions = isAssignee
                ? getAssigneeActions(task.status)
                : [];
              const managerActions = canManageTasks
                ? getManagerActions(task.status)
                : [];
              const canAssign =
                canManageTasks &&
                task.status === "open" &&
                !assignedEmployeeId;
              const canReassign =
                canManageTasks &&
                Boolean(assignedEmployeeId) &&
                REASSIGNABLE_STATUSES.has(task.status);
              const assignmentAction = canAssign
                ? "assign"
                : canReassign
                  ? "reassign"
                  : "";
              const eligibleEmployees = employees.filter((employee) => {
                if (!task.departmentId) return true;

                return (
                  getEmployeeDepartmentId(employee) === task.departmentId
                );
              });
              const selectedEmployeeId =
                assignmentSelections[task.id] ??
                assignedEmployeeId ??
                "";
              const existingDeadline = task.dueAt || task.dueDate || "";
              const preservesExistingDeadline =
                assignmentAction === "reassign" &&
                Boolean(existingDeadline);
              const selectedDueAt = preservesExistingDeadline
                ? existingDeadline
                : assignmentDeadlines[task.id] || "";
              const deadlineInputValue = preservesExistingDeadline
                ? toDateTimeLocalValue(existingDeadline)
                : selectedDueAt;
              const deadlineMustBeFuture =
                Boolean(assignmentAction) &&
                (assignmentAction === "assign" ||
                  !preservesExistingDeadline);
              const minimumDeadlineValue = clockNow
                ? toDateTimeLocalValue(new Date(clockNow + 60000))
                : undefined;
              const deadlineState = getDeadlineState(task, clockNow);
              const busy = updatingTaskId === task.id;
              const note = notes[task.id] || "";

              return (
                <article
                  key={task.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-black/10"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(task.status)}`}
                        >
                          {getStatusLabel(task.status)}
                        </span>

                        <span
                          className={`text-xs font-semibold uppercase tracking-wider ${getPriorityClasses(task.priority)}`}
                        >
                          {task.priority || "normal"} priority
                        </span>

                        {deadlineState ? (
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${deadlineState.classes}`}
                          >
                            {deadlineState.label}
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-4 text-xl font-semibold">
                        {task.title || "Untitled task"}
                      </h2>

                      {task.description ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                          {task.description}
                        </p>
                      ) : null}

                      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-xs uppercase tracking-wider text-zinc-500">
                            Assigned to
                          </dt>
                          <dd className="mt-1 text-zinc-200">
                            {task.assignedEmployeeName || "Unassigned"}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs uppercase tracking-wider text-zinc-500">
                            Department
                          </dt>
                          <dd className="mt-1 text-zinc-200">
                            {task.departmentName || "Not specified"}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs uppercase tracking-wider text-zinc-500">
                            Exact deadline
                          </dt>
                          <dd className="mt-1 text-zinc-200">
                            {formatDateTime(task.dueAt || task.dueDate)}
                          </dd>

                          {task.deadlineExtensionCount > 0 ? (
                            <dd className="mt-1 text-xs leading-5 text-amber-300">
                              Original: {formatDateTime(task.originalDueAt)}
                              {" · "}
                              {task.deadlineExtensionCount} approved extension
                              {task.deadlineExtensionCount === 1 ? "" : "s"}
                            </dd>
                          ) : null}
                        </div>
                      </dl>
                    </div>

                    {assignmentAction ? (
                      <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 lg:w-80">
                        <label
                          className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
                          htmlFor={`assignment-${task.id}`}
                        >
                          {assignmentAction === "assign"
                            ? "Assign employee"
                            : "Reassign employee"}
                        </label>

                        <select
                          id={`assignment-${task.id}`}
                          value={selectedEmployeeId}
                          onChange={(event) => {
                            const employeeId = event.target.value;

                            setAssignmentSelections((current) => ({
                              ...current,
                              [task.id]: employeeId,
                            }));
                          }}
                          className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                          disabled={busy}
                        >
                          <option value="">Select employee</option>

                          {eligibleEmployees.map((employee) => (
                            <option
                              key={getEmployeeId(employee)}
                              value={getEmployeeId(employee)}
                            >
                              {getEmployeeName(employee)}
                            </option>
                          ))}
                        </select>

                        <label
                          className="mt-4 block text-xs font-semibold uppercase tracking-wider text-zinc-400"
                          htmlFor={`deadline-${task.id}`}
                        >
                          Exact deadline
                        </label>

                        <input
                          id={`deadline-${task.id}`}
                          type="datetime-local"
                          value={deadlineInputValue}
                          min={
                            deadlineMustBeFuture
                              ? minimumDeadlineValue
                              : undefined
                          }
                          onChange={(event) => {
                            const value = event.target.value;

                            setAssignmentDeadlines((current) => ({
                              ...current,
                              [task.id]: value,
                            }));
                          }}
                          className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={busy || preservesExistingDeadline}
                          required
                        />

                        <p className="mt-2 text-xs leading-5 text-zinc-500">
                          {preservesExistingDeadline
                            ? "Reassignment preserves the existing deadline. A change requires the controlled extension workflow."
                            : "Choose the exact local date and time when this work must be completed."}
                        </p>

                        <button
                          type="button"
                          className="mt-3 w-full rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            busy ||
                            !selectedEmployeeId ||
                            !selectedDueAt ||
                            (assignmentAction === "reassign" &&
                              selectedEmployeeId === assignedEmployeeId) ||
                            (assignmentAction === "reassign" && !note.trim())
                          }
                          onClick={() =>
                            handleAction(
                              task,
                              assignmentAction,
                              selectedEmployeeId,
                              selectedDueAt
                            )
                          }
                        >
                          {busy
                            ? "Updating..."
                            : assignmentAction === "assign"
                              ? "Assign task"
                              : "Reassign task"}
                        </button>

                        {eligibleEmployees.length === 0 ? (
                          <p className="mt-2 text-xs leading-5 text-zinc-500">
                            No eligible employee is available in this task&apos;s
                            department.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 border-t border-zinc-800 pt-5">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
                      htmlFor={`note-${task.id}`}
                    >
                      Update note
                    </label>

                    <textarea
                      id={`note-${task.id}`}
                      rows={3}
                      value={note}
                      onChange={(event) => {
                        const value = event.target.value;

                        setNotes((current) => ({
                          ...current,
                          [task.id]: value,
                        }));
                      }}
                      maxLength={4000}
                      placeholder="Record progress, evidence, a blocker, review feedback, or another important update."
                      className="mt-3 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-500"
                      disabled={busy}
                    />

                    <p className="mt-2 text-xs text-zinc-500">
                      A written explanation is required for progress updates,
                      blockers, reassignment, requested changes, reopening,
                      cancellation, and comments.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {assigneeActions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            busy ||
                            (EXPLANATION_ACTIONS.has(action) && !note.trim())
                          }
                          onClick={() => handleAction(task, action)}
                        >
                          {busy ? "Updating..." : ACTION_LABELS[action]}
                        </button>
                      ))}

                      {managerActions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            busy ||
                            (EXPLANATION_ACTIONS.has(action) && !note.trim())
                          }
                          onClick={() => handleAction(task, action)}
                        >
                          {busy ? "Updating..." : ACTION_LABELS[action]}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={busy || !note.trim()}
                        onClick={() => handleAction(task, "comment")}
                      >
                        {busy ? "Updating..." : ACTION_LABELS.comment}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}