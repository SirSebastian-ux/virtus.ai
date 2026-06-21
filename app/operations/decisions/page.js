"use client";

import { useEffect, useMemo, useState } from "react";

function formatLabel(value) {
  return String(value || "").replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function ApprovalRequestCard({ request, onDecision, isDeciding }) {
  const invitation = request.invitation || {};

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">
            {request.title || "Approval request"}
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {request.description || "No description"}
          </p>
        </div>

        <span className="rounded-full border border-sky-900/40 px-3 py-1 text-xs text-sky-100">
          {formatLabel(request.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2 xl:grid-cols-4">
        <p>Type: {formatLabel(request.requestType)}</p>
        <p>Name: {invitation.invitedName || "No name"}</p>
        <p>Email: {invitation.email || "No email"}</p>
        <p>Created: {formatDate(request.createdAt)}</p>
        <p>Role: {formatLabel(invitation.requestedRole)}</p>
        <p>Scope: {formatLabel(invitation.requestedScopeType)}</p>
        <p>Department: {invitation.departmentName || "No department"}</p>
        <p>Reports to: {invitation.reportsToEmployeeName || "No manager"}</p>
      </div>

      {request.status === "pending" ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={isDeciding}
            onClick={() => onDecision(request.id, "approve")}
            className="rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Approve
          </button>

          <button
            type="button"
            disabled={isDeciding}
            onClick={() => onDecision(request.id, "reject")}
            className="rounded-xl border border-red-700/50 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ApprovalSection({ title, requests, onDecision, isDeciding }) {
  return (
    <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-sky-100">{title}</h2>
        <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
          {requests.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
            No requests in this section.
          </div>
        ) : (
          requests.map((request) => (
            <ApprovalRequestCard
              key={request.id}
              request={request}
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
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeciding, setIsDeciding] = useState(false);
  const [error, setError] = useState("");

  async function loadApprovalRequests(workspaceId) {
    if (!workspaceId) return;

    setIsLoading(true);
    setError("");

    const response = await fetch(
      `/api/operations/approval-requests?workspaceId=${encodeURIComponent(
        workspaceId
      )}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load approval requests.");
      setApprovalRequests([]);
      setIsLoading(false);
      return;
    }

    setApprovalRequests(
      Array.isArray(data.approvalRequests) ? data.approvalRequests : []
    );
    setIsLoading(false);
  }

  async function handleWorkspaceChange(event) {
    const workspaceId = event.target.value;
    setSelectedWorkspaceId(workspaceId);
    await loadApprovalRequests(workspaceId);
  }

  async function handleDecision(requestId, action) {
    if (!selectedWorkspaceId || !requestId || !action) return;

    setIsDeciding(true);
    setError("");

    const response = await fetch("/api/operations/approval-requests", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId: selectedWorkspaceId,
        requestId,
        action,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to process approval request.");
    } else {
      await loadApprovalRequests(selectedWorkspaceId);
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
        setSelectedWorkspaceId(loadedWorkspaces[0].id);
        await loadApprovalRequests(loadedWorkspaces[0].id);
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
    () => approvalRequests.filter((item) => item.status === "pending"),
    [approvalRequests]
  );

  const approved = useMemo(
    () => approvalRequests.filter((item) => item.status === "approved"),
    [approvalRequests]
  );

  const rejected = useMemo(
    () => approvalRequests.filter((item) => item.status === "rejected"),
    [approvalRequests]
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
              Approval Center
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Review pending access, invitation, and operational approval
              requests before they become active company actions.
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

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-zinc-400">
            Loading approval requests...
          </p>
        ) : (
          <div className="mt-8 grid gap-6">
            <ApprovalSection
              title="Pending Approval Requests"
              requests={pending}
              onDecision={handleDecision}
              isDeciding={isDeciding}
            />

            <ApprovalSection
              title="Approved Requests"
              requests={approved}
              onDecision={handleDecision}
              isDeciding={isDeciding}
            />

            <ApprovalSection
              title="Rejected Requests"
              requests={rejected}
              onDecision={handleDecision}
              isDeciding={isDeciding}
            />
          </div>
        )}
      </div>
    </section>
  );
}
