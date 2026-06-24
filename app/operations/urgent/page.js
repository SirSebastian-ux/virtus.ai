"use client";

import { useEffect, useMemo, useState } from "react";

function formatLabel(value) {
  return String(value || "").replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function IssueCard({ issue, onUpdate, isUpdating }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">
            {issue.title || "Urgent issue"}
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {issue.description || "No description"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-red-900/40 px-3 py-1 text-xs text-red-100">
            {formatLabel(issue.severity)}
          </span>
          <span className="rounded-full border border-sky-900/40 px-3 py-1 text-xs text-sky-100">
            {formatLabel(issue.status)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2 xl:grid-cols-4">
        <p>Department: {issue.departmentName || "No department"}</p>
        <p>Employee: {issue.employeeName || "No employee"}</p>
        <p>Created: {formatDate(issue.createdAt)}</p>
        <p>Resolved: {formatDate(issue.resolvedAt)}</p>
        <p>Assigned to: {issue.assignedTo || "Unassigned"}</p>
        <p>Source report: {issue.sourceReportId || "None"}</p>
      </div>

      {!["resolved", "closed"].includes(issue.status) ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdate(issue.id, "in_progress")}
            className="rounded-xl border border-sky-700/50 bg-sky-950/40 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-900/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark in progress
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdate(issue.id, "resolved")}
            className="rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Resolve
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdate(issue.id, "closed")}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

function IssueSection({ title, issues, onUpdate, isUpdating }) {
  return (
    <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-sky-100">{title}</h2>
        <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
          {issues.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {issues.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
            No urgent issues in this section.
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onUpdate={onUpdate}
              isUpdating={isUpdating}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default function OperationsUrgentIssuesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [urgentIssues, setUrgentIssues] = useState([]);
  const [accessContext, setAccessContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "medium",
  });

  const canManageIssues = Boolean(
    accessContext?.permissions?.["urgent_issues.manage"]
  );

  async function loadUrgentIssues(workspaceId) {
    if (!workspaceId) return;

    setIsLoading(true);
    setError("");

    const response = await fetch(
      `/api/operations/urgent?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load urgent issues.");
      setUrgentIssues([]);
      setAccessContext(data?.accessContext || null);
      setIsLoading(false);
      return;
    }

    setUrgentIssues(
      Array.isArray(data.urgentIssues) ? data.urgentIssues : []
    );
    setAccessContext(data.accessContext || null);
    setIsLoading(false);
  }

  async function handleWorkspaceChange(event) {
    const workspaceId = event.target.value;
    setSelectedWorkspaceId(workspaceId);

    if (typeof window !== "undefined") {
      const workspace = workspaces.find((item) => item.id === workspaceId);
      localStorage.setItem("virtus_active_workspace_id", workspaceId);

      if (workspace?.name) {
        localStorage.setItem("virtus_active_workspace_name", workspace.name);
      }

      window.dispatchEvent(new Event("virtus-active-workspace-changed"));
    }
    await loadUrgentIssues(workspaceId);
  }

  async function handleCreateIssue(event) {
    event.preventDefault();

    if (!selectedWorkspaceId || !form.title.trim()) return;

    setIsCreating(true);
    setError("");

    const response = await fetch("/api/operations/urgent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId: selectedWorkspaceId,
        title: form.title,
        description: form.description,
        severity: form.severity,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to create urgent issue.");
    } else {
      setForm({
        title: "",
        description: "",
        severity: "medium",
      });
      await loadUrgentIssues(selectedWorkspaceId);
    }

    setIsCreating(false);
  }

  async function handleUpdateIssue(issueId, status) {
    if (!issueId || !status) return;

    setIsUpdating(true);
    setError("");

    const response = await fetch("/api/operations/urgent", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        issueId,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to update urgent issue.");
    } else {
      await loadUrgentIssues(selectedWorkspaceId);
    }

    setIsUpdating(false);
  }

  useEffect(() => {
    let alive = true;

    async function loadInitialData() {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/operations/workspaces");
      const data = await response.json();

      if (!alive) return;

      if (!response.ok) {
        setError(data?.error || "Unable to load workspaces.");
        setIsLoading(false);
        return;
      }

      const loadedWorkspaces = Array.isArray(data.workspaces)
        ? data.workspaces
        : [];

      setWorkspaces(loadedWorkspaces);

      if (loadedWorkspaces.length > 0) {
        const activeWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_id") || ""
            : "";

        const selectedWorkspace =
          loadedWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) ||
          loadedWorkspaces[0];

        if (!selectedWorkspace?.id) {
          throw new Error("No active company selected.");
        }

        setSelectedWorkspaceId(selectedWorkspace.id);

        if (typeof window !== "undefined") {
          localStorage.setItem("virtus_active_workspace_id", selectedWorkspace.id);

          if (selectedWorkspace.name) {
            localStorage.setItem("virtus_active_workspace_name", selectedWorkspace.name);
          }
        }

        await loadUrgentIssues(selectedWorkspace.id);
      } else {
        setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      alive = false;
    };
  }, []);

  const openIssues = useMemo(
    () => urgentIssues.filter((issue) => issue.status === "open"),
    [urgentIssues]
  );

  const inProgressIssues = useMemo(
    () => urgentIssues.filter((issue) => issue.status === "in_progress"),
    [urgentIssues]
  );

  const resolvedIssues = useMemo(
    () =>
      urgentIssues.filter((issue) =>
        ["resolved", "closed"].includes(issue.status)
      ),
    [urgentIssues]
  );

  const highPriorityIssues = useMemo(
    () =>
      urgentIssues.filter((issue) =>
        ["high", "critical"].includes(issue.severity)
      ),
    [urgentIssues]
  );

  return (
    <section className="px-6 py-8">
      <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
          Operational Risk
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Urgent Issues
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Track high-priority operational risks, blocked work,
              escalations, and urgent employee reports that require manager
              visibility or immediate action.
            </p>
          </div>

          <select
            value={selectedWorkspaceId}
            onChange={handleWorkspaceChange}
            className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
          >
            {workspaces.length === 0 ? (
              <option value="">No workspace available</option>
            ) : (
              workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))
            )}
          </select>
        </div>

        {error ? <p className="mt-5 text-sm text-red-300">{error}</p> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Open Issues
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {openIssues.length}
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Currently unresolved
            </p>
          </div>

          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              High Priority
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {highPriorityIssues.length}
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              High or critical severity
            </p>
          </div>

          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              In Progress
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {inProgressIssues.length}
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Being handled by leadership
            </p>
          </div>

          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Resolved / Closed
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {resolvedIssues.length}
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Completed urgent items
            </p>
          </div>
        </div>

        {canManageIssues ? (
          <form
            onSubmit={handleCreateIssue}
            className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
          >
            <h2 className="text-lg font-semibold text-sky-100">
              Create Urgent Issue
            </h2>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Issue title"
                className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              />

              <select
                value={form.severity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    severity: event.target.value,
                  }))
                }
                className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe the issue, impact, and required response"
                className="min-h-28 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-500 lg:col-span-2"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !form.title.trim()}
              className="mt-5 rounded-xl border border-sky-700/60 bg-sky-950/60 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-900/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Creating..." : "Create urgent issue"}
            </button>
          </form>
        ) : null}

        {isLoading ? (
          <p className="mt-8 text-sm text-zinc-400">
            Loading urgent issues...
          </p>
        ) : (
          <div className="mt-8 grid gap-6">
            <IssueSection
              title="Open Issues"
              issues={openIssues}
              onUpdate={handleUpdateIssue}
              isUpdating={isUpdating}
            />

            <IssueSection
              title="In Progress"
              issues={inProgressIssues}
              onUpdate={handleUpdateIssue}
              isUpdating={isUpdating}
            />

            <IssueSection
              title="Resolved / Closed"
              issues={resolvedIssues}
              onUpdate={handleUpdateIssue}
              isUpdating={isUpdating}
            />
          </div>
        )}
      </div>
    </section>
  );
}
