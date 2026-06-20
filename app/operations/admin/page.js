"use client";

import { useEffect, useState } from "react";

const roles = [
  "owner",
  "director",
  "senior_manager",
  "department_manager",
  "supervisor",
  "employee",
];

const scopeTypes = ["company", "department", "team", "self"];

export default function OperationsAdminPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("employee");
  const [scopeType, setScopeType] = useState("self");
  const [departmentId, setDepartmentId] = useState("");
  const [reportsToEmployeeId, setReportsToEmployeeId] = useState("");

  const [invitedName, setInvitedName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [requestedRole, setRequestedRole] = useState("employee");
  const [requestedScopeType, setRequestedScopeType] = useState("self");
  const [inviteDepartmentId, setInviteDepartmentId] = useState("");
  const [inviteReportsToEmployeeId, setInviteReportsToEmployeeId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");

  async function loadEmployees(workspaceId) {
    const response = await fetch(
      `/api/operations/employees?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load employees.");
      setEmployees([]);
      setDepartments([]);
      return;
    }

    setEmployees(Array.isArray(data.employees) ? data.employees : []);
    setDepartments(Array.isArray(data.departments) ? data.departments : []);
  }

  async function loadRoleAssignments(workspaceId) {
    const response = await fetch(
      `/api/operations/role-assignments?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load role assignments.");
      setRoleAssignments([]);
      return;
    }

    setRoleAssignments(
      Array.isArray(data.roleAssignments) ? data.roleAssignments : []
    );
  }

  async function loadInvitations(workspaceId) {
    const response = await fetch(
      `/api/operations/invitations?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load invitations.");
      setInvitations([]);
      return;
    }

    setInvitations(Array.isArray(data.invitations) ? data.invitations : []);
  }

  async function loadWorkspaceContext(workspaceId) {
    if (!workspaceId) return;

    setIsLoading(true);
    setError("");

    await loadEmployees(workspaceId);
    await loadRoleAssignments(workspaceId);
    await loadInvitations(workspaceId);

    setIsLoading(false);
  }

  async function handleWorkspaceChange(event) {
    const workspaceId = event.target.value;
    setSelectedWorkspaceId(workspaceId);
    setEmployeeId("");
    setDepartmentId("");
    setReportsToEmployeeId("");
    setInvitedName("");
    setInviteEmail("");
    setInviteDepartmentId("");
    setInviteReportsToEmployeeId("");
    await loadWorkspaceContext(workspaceId);
  }

  async function submitRoleAssignment(event) {
    event.preventDefault();

    if (!selectedWorkspaceId || !role || !scopeType) {
      setError("Workspace, role, and scope are required.");
      return;
    }

    setIsSaving(true);
    setError("");

    const response = await fetch("/api/operations/role-assignments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId: selectedWorkspaceId,
        employeeId,
        role,
        scopeType,
        departmentId,
        reportsToEmployeeId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to save role assignment.");
    } else {
      setEmployeeId("");
      setRole("employee");
      setScopeType("self");
      setDepartmentId("");
      setReportsToEmployeeId("");
      await loadRoleAssignments(selectedWorkspaceId);
    }

    setIsSaving(false);
  }

  async function submitInvitation(event) {
    event.preventDefault();

    if (!selectedWorkspaceId || !inviteEmail.trim()) {
      setError("Workspace and invitation email are required.");
      return;
    }

    setIsInviting(true);
    setError("");

    const response = await fetch("/api/operations/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId: selectedWorkspaceId,
        invitedName,
        email: inviteEmail,
        requestedRole,
        requestedScopeType,
        departmentId: inviteDepartmentId,
        reportsToEmployeeId: inviteReportsToEmployeeId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to create invitation request.");
    } else {
      setInvitedName("");
      setInviteEmail("");
      setRequestedRole("employee");
      setRequestedScopeType("self");
      setInviteDepartmentId("");
      setInviteReportsToEmployeeId("");
      await loadInvitations(selectedWorkspaceId);
    }

    setIsInviting(false);
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

  return (
    <section className="px-6 py-8">
      <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
          Operations Administration
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Roles, Hierarchy, Invitations, and Access
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Assign authority, request invitations, control hierarchy, and
              prepare approval-based access for role-filtered dashboards.
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

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
          <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-sky-100">
              Create Role Assignment
            </h2>

            <form onSubmit={submitRoleAssignment} className="mt-5 space-y-4">
              <select
                value={employeeId}
                onChange={(event) => {
                  const nextEmployeeId = event.target.value;
                  setEmployeeId(nextEmployeeId);

                  const employee = employees.find(
                    (item) => item.id === nextEmployeeId
                  );
                  setDepartmentId(employee?.departmentId || "");
                }}
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>

              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </select>

              <select
                value={scopeType}
                onChange={(event) => setScopeType(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                {scopeTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                <option value="">No department scope</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>

              <select
                value={reportsToEmployeeId}
                onChange={(event) => setReportsToEmployeeId(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                <option value="">Reports to nobody</option>
                {employees
                  .filter((employee) => employee.id !== employeeId)
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName}
                    </option>
                  ))}
              </select>

              <button
                type="submit"
                disabled={isSaving || !selectedWorkspaceId}
                className="w-full rounded-2xl border border-sky-800/50 bg-sky-950/40 px-5 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-900/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Role Assignment"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-sky-100">
              Current Role Assignments
            </h2>

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <p className="text-sm text-zinc-400">Loading hierarchy...</p>
              ) : roleAssignments.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                  No role assignments yet.
                </div>
              ) : (
                roleAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {assignment.employeeName || "Unlinked user"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {assignment.employeeEmail || "No email"} ·{" "}
                          {assignment.departmentName || "No department"}
                        </p>
                      </div>

                      <span className="rounded-full border border-sky-900/40 px-3 py-1 text-xs text-sky-100">
                        {assignment.role.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
                      <p>Scope: {assignment.scopeType}</p>
                      <p>Status: {assignment.status}</p>
                      <p>
                        Reports to:{" "}
                        {assignment.reportsToEmployeeName || "No manager"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h2 className="text-lg font-semibold text-amber-100">
              Create Invitation Request
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-100/70">
              Invitation does not grant access automatically. It creates a
              pending approval request first.
            </p>

            <form onSubmit={submitInvitation} className="mt-5 space-y-4">
              <input
                value={invitedName}
                onChange={(event) => setInvitedName(event.target.value)}
                placeholder="Invited person's name"
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-500"
              />

              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="Invited person's email"
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-500"
              />

              <select
                value={requestedRole}
                onChange={(event) => setRequestedRole(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-amber-500"
              >
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </select>

              <select
                value={requestedScopeType}
                onChange={(event) => setRequestedScopeType(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-amber-500"
              >
                {scopeTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={inviteDepartmentId}
                onChange={(event) => setInviteDepartmentId(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-amber-500"
              >
                <option value="">No department scope</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>

              <select
                value={inviteReportsToEmployeeId}
                onChange={(event) =>
                  setInviteReportsToEmployeeId(event.target.value)
                }
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-amber-500"
              >
                <option value="">Reports to nobody</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={isInviting || !selectedWorkspaceId}
                className="w-full rounded-2xl border border-amber-600/50 bg-amber-950/30 px-5 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-900/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isInviting ? "Creating Request..." : "Create Invitation Request"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-amber-100">
              Invitation Requests
            </h2>

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <p className="text-sm text-zinc-400">Loading invitations...</p>
              ) : invitations.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                  No invitation requests yet.
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {invitation.invitedName || invitation.email}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {invitation.email} ·{" "}
                          {invitation.departmentName || "No department"}
                        </p>
                      </div>

                      <span className="rounded-full border border-amber-600/40 px-3 py-1 text-xs text-amber-100">
                        {invitation.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
                      <p>
                        Role:{" "}
                        {invitation.requestedRole?.replaceAll("_", " ")}
                      </p>
                      <p>Scope: {invitation.requestedScopeType}</p>
                      <p>
                        Reports to:{" "}
                        {invitation.reportsToEmployeeName || "No manager"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
