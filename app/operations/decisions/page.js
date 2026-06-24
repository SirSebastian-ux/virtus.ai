"use client";

import { useEffect, useMemo, useState } from "react";

function formatLabel(value) {
  return String(value || "").replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function DecisionCard({ decision, onDecision, isDeciding }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">
            {decision.title || "Decision request"}
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {decision.description || "No description"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-sky-900/40 px-3 py-1 text-xs text-sky-100">
            {formatLabel(decision.status)}
          </span>
          <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-300">
            {formatLabel(decision.priority)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2 xl:grid-cols-4">
        <p>Type: {formatLabel(decision.decisionType)}</p>
        <p>Department: {decision.departmentName || "No department"}</p>
        <p>Requested by: {decision.requestedByEmployeeName || "No employee"}</p>
        <p>Created: {formatDate(decision.createdAt)}</p>
        <p>Decided: {formatDate(decision.decidedAt)}</p>
        <p>Decision note: {decision.decisionNote || "No note"}</p>
        <p>Source report: {decision.sourceReportId || "None"}</p>
        <p>Assigned to: {decision.assignedTo || "Unassigned"}</p>
      </div>

      {decision.status === "pending" ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={isDeciding}
            onClick={() => onDecision(decision.id, "approved")}
            className="rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Approve
          </button>

          <button
            type="button"
            disabled={isDeciding}
            onClick={() => onDecision(decision.id, "rejected")}
            className="rounded-xl border border-red-700/50 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>

          <button
            type="button"
            disabled={isDeciding}
            onClick={() => onDecision(decision.id, "closed")}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DecisionSection({ title, decisions, onDecision, isDeciding }) {
  return (
    <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-sky-100">{title}</h2>
        <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
          {decisions.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {decisions.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
            No decisions in this section.
          </div>
        ) : (
          decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onDecision={onDecision}
              isDeciding={isDeciding}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default function OperationsDecisionQueuePage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [decisions, setDecisions] = useState([]);
  const [accessContext, setAccessContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    decisionType: "manual",
    priority: "normal",
  });

  const canManageDecisions = Boolean(
    accessContext?.permissions?.["decisions.manage"]
  );

  async function loadDecisions(workspaceId) {
    if (!workspaceId) return;

    setIsLoading(true);
    setError("");

    const response = await fetch(
      `/api/operations/decisions?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load decisions.");
      setDecisions([]);
      setAccessContext(data?.accessContext || null);
      setIsLoading(false);
      return;
    }

    setDecisions(Array.isArray(data.decisions) ? data.decisions : []);
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
    await loadDecisions(workspaceId);
  }

  async function handleCreateDecision(event) {
    event.preventDefault();

    if (!selectedWorkspaceId || !form.title.trim()) return;

    setIsCreating(true);
    setError("");

    const response = await fetch("/api/operations/decisions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId: selectedWorkspaceId,
        title: form.title,
        description: form.description,
        decisionType: form.decisionType,
        priority: form.priority,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to create decision.");
    } else {
      setForm({
        title: "",
        description: "",
        decisionType: "manual",
        priority: "normal",
      });
      await loadDecisions(selectedWorkspaceId);
    }

    setIsCreating(false);
  }

  async function handleDecision(decisionId, status) {
    if (!decisionId || !status) return;

    setIsDeciding(true);
    setError("");

    const response = await fetch("/api/operations/decisions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        decisionId,
        status,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to update decision.");
    } else {
      await loadDecisions(selectedWorkspaceId);
    }

    setIsDeciding(false);
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

        await loadDecisions(selectedWorkspace.id);
      } else {
        setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      alive = false;
    };
  }, []);

  const pending = useMemo(
    () => decisions.filter((item) => item.status === "pending"),
    [decisions]
  );

  const approved = useMemo(
    () => decisions.filter((item) => item.status === "approved"),
    [decisions]
  );

  const rejected = useMemo(
    () => decisions.filter((item) => item.status === "rejected"),
    [decisions]
  );

  const closed = useMemo(
    () => decisions.filter((item) => item.status === "closed"),
    [decisions]
  );

  return (
    <section className="px-6 py-8">
      <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
          Management Action
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Decision Queue
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Review operational decisions created from reports, urgent issues,
              payments, tasks, or manual management requests.
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

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Pending
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {pending.length}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Approved
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {approved.length}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Rejected
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {rejected.length}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Closed
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {closed.length}
            </p>
          </div>
        </div>

        {canManageDecisions ? (
          <form
            onSubmit={handleCreateDecision}
            className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
          >
            <h2 className="text-lg font-semibold text-sky-100">
              Create Manual Decision
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
                placeholder="Decision title"
                className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  value={form.decisionType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      decisionType: event.target.value,
                    }))
                  }
                  className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
                >
                  <option value="manual">Manual</option>
                  <option value="report">Report</option>
                  <option value="urgent_issue">Urgent issue</option>
                  <option value="payment">Payment</option>
                  <option value="task">Task</option>
                </select>

                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                  className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Decision description"
                className="min-h-28 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-sky-500 lg:col-span-2"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !form.title.trim()}
              className="mt-5 rounded-xl border border-sky-700/60 bg-sky-950/60 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-900/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Creating..." : "Create decision"}
            </button>
          </form>
        ) : null}

        {isLoading ? (
          <p className="mt-8 text-sm text-zinc-400">Loading decisions...</p>
        ) : (
          <div className="mt-8 grid gap-6">
            <DecisionSection
              title="Pending Decisions"
              decisions={pending}
              onDecision={handleDecision}
              isDeciding={isDeciding}
            />

            <DecisionSection
              title="Approved Decisions"
              decisions={approved}
              onDecision={handleDecision}
              isDeciding={isDeciding}
            />

            <DecisionSection
              title="Rejected Decisions"
              decisions={rejected}
              onDecision={handleDecision}
              isDeciding={isDeciding}
            />

            <DecisionSection
              title="Closed Decisions"
              decisions={closed}
              onDecision={handleDecision}
              isDeciding={isDeciding}
            />
          </div>
        )}
      </div>
    </section>
  );
}
