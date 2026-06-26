"use client";

import { useEffect, useState } from "react";

export default function OperationsEmployeesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [billingProfile, setBillingProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState("employee");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadWorkspaces() {
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/operations/workspaces");
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load workspaces.");
      setWorkspaces([]);
      setIsLoading(false);
      return;
    }

    const loadedWorkspaces = Array.isArray(data.workspaces) ? data.workspaces : [];
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

        await loadEmployees(selectedWorkspace.id);
      } else {
      setIsLoading(false);
    }
  }

  async function loadEmployees(workspaceId) {
    if (!workspaceId) return;

    setError("");

    const response = await fetch(
      `/api/operations/employees?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load employees.");
      setEmployees([]);
      setDepartments([]);
      setBillingProfile(null);
    } else {
      setEmployees(Array.isArray(data.employees) ? data.employees : []);
      setDepartments(Array.isArray(data.departments) ? data.departments : []);
      setBillingProfile(data.billingProfile || null);
    }

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
    setIsLoading(true);
    await loadEmployees(workspaceId);
  }

  async function createEmployee(event) {
    event.preventDefault();

    if (!selectedWorkspaceId || !fullName.trim()) {
      setError("Workspace and full name are required.");
      return;
    }

    setIsSaving(true);
    setError("");

    const response = await fetch("/api/operations/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId: selectedWorkspaceId,
        fullName,
        email,
        departmentId,
        role,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to create employee.");
    } else {
      setFullName("");
      setEmail("");
      setDepartmentId("");
      setRole("employee");
      await loadEmployees(selectedWorkspaceId);
    }

    setIsSaving(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/operations/workspaces");
      const data = await response.json();

      if (!isMounted) return;

      if (!response.ok) {
        setError(data?.error || "Unable to load workspaces.");
        setWorkspaces([]);
        setIsLoading(false);
        return;
      }

      const loadedWorkspaces = Array.isArray(data.workspaces) ? data.workspaces : [];
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

        await loadEmployees(selectedWorkspace.id);
      } else {
        setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="px-6 py-8">
      <h1 className="mt-6 text-3xl font-semibold text-white">Employees</h1>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
        Create employee records, assign departments, define operational roles,
        and prepare billing seat counts for future SaaS activation.
      </p>

      <div className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5">
        <h2 className="text-lg font-semibold text-sky-100">Workspace</h2>

        <select
          value={selectedWorkspaceId}
          onChange={handleWorkspaceChange}
          className="mt-4 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
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

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Active Employees
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {employees.length}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Billable Seats
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {billingProfile?.billable_employee_count ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Billing Mode
            </p>
            <p className="mt-2 text-sm font-semibold text-sky-100">
              {billingProfile?.billing_mode || "manual_testing"}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={createEmployee}
        className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5"
      >
        <h2 className="text-lg font-semibold text-sky-100">Add Employee</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
          />

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
          />
<select
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
          >
            <option value="">No department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>

          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
          >
            <option value="owner">Owner</option>
            <option value="director">Director</option>
            <option value="senior_manager">Senior Manager</option>
            <option value="department_manager">Department Manager</option>
            <option value="supervisor">Supervisor</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={isSaving || !selectedWorkspaceId}
          className="mt-5 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Add Employee"}
        </button>
      </form>

      <div className="mt-8 grid gap-4">
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading employees...</p>
        ) : employees.length === 0 ? (
          <div className="rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5">
            <p className="text-sm text-zinc-400">
              No employees created yet.
            </p>
          </div>
        ) : (
          employees.map((employee) => (
            <div
              key={employee.id}
              className="rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-sky-100">
                    {employee.fullName}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    {employee.role?.replaceAll("_", " ") || "employee"} |{" "}
                    {employee.departmentName || "No Department"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {employee.email || "No email assigned"}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-sm text-zinc-300">
                    {employee.employmentStatus}
                  </p>
                  <p className="mt-1 text-xs text-sky-300/70">
                    Active billing seat
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}