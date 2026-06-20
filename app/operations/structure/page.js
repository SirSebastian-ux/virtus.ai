"use client";

import { useEffect, useMemo, useState } from "react";

const roleOrder = [
  "owner",
  "director",
  "senior_manager",
  "department_manager",
  "supervisor",
  "employee",
];

function formatRole(role) {
  return String(role || "employee").replaceAll("_", " ");
}

export default function OperationsStructurePage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRoleAssignments(workspaceId) {
    if (!workspaceId) return;

    const response = await fetch(
      `/api/operations/role-assignments?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load structure.");
      setRoleAssignments([]);
      return;
    }

    setRoleAssignments(
      Array.isArray(data.roleAssignments) ? data.roleAssignments : []
    );
  }

  async function loadWorkspaceContext(workspaceId) {
    setIsLoading(true);
    setError("");
    await loadRoleAssignments(workspaceId);
    setIsLoading(false);
  }

  async function handleWorkspaceChange(event) {
    const workspaceId = event.target.value;
    setSelectedWorkspaceId(workspaceId);
    await loadWorkspaceContext(workspaceId);
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
        await loadWorkspaceContext(loadedWorkspaces[0].id);
      } else {
        setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedAssignments = useMemo(() => {
    const groups = {};

    for (const role of roleOrder) {
      groups[role] = [];
    }

    for (const assignment of roleAssignments) {
      const assignmentRole = assignment.role || "employee";

      if (!groups[assignmentRole]) {
        groups[assignmentRole] = [];
      }

      groups[assignmentRole].push(assignment);
    }

    return groups;
  }, [roleAssignments]);

  const reportingLines = useMemo(() => {
    return roleAssignments.filter((assignment) => assignment.reportsToEmployeeName);
  }, [roleAssignments]);

  return (
    <section className="px-6 py-8">
      <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
          Organization Structure
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Company Hierarchy
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Visualize authority, department scope, reporting lines, and role
              assignments before building invitations and approvals.
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

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-sky-100">
              Role Layers
            </h2>

            <div className="mt-5 space-y-4">
              {isLoading ? (
                <p className="text-sm text-zinc-400">Loading structure...</p>
              ) : roleAssignments.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                  No role assignments yet. Add role assignments from Admin
                  Dashboard first.
                </div>
              ) : (
                roleOrder.map((role) => {
                  const assignments = groupedAssignments[role] || [];

                  return (
                    <div
                      key={role}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">
                          {formatRole(role)}
                        </h3>
                        <span className="rounded-full border border-sky-900/40 px-3 py-1 text-xs text-sky-100">
                          {assignments.length}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {assignments.length === 0 ? (
                          <p className="text-sm text-zinc-600">
                            No people assigned.
                          </p>
                        ) : (
                          assignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3"
                            >
                              <p className="text-sm font-semibold text-white">
                                {assignment.employeeName || "Unlinked user"}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {assignment.departmentName || "No department"} ·{" "}
                                {assignment.scopeType}
                              </p>
                              <p className="mt-2 text-xs text-zinc-400">
                                Reports to:{" "}
                                {assignment.reportsToEmployeeName ||
                                  "No manager"}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-sky-100">
              Reporting Lines
            </h2>

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <p className="text-sm text-zinc-400">Loading lines...</p>
              ) : reportingLines.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                  No reporting lines assigned yet.
                </div>
              ) : (
                reportingLines.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4"
                  >
                    <p className="text-sm font-semibold text-white">
                      {assignment.employeeName}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">reports to</p>
                    <p className="mt-2 text-sm font-semibold text-sky-100">
                      {assignment.reportsToEmployeeName}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <h3 className="text-sm font-semibold text-amber-100">
                Next Build Step
              </h3>
              <p className="mt-2 text-sm leading-6 text-amber-100/70">
                After structure is visible, we build invitation requests and
                approval routing according to this hierarchy.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
