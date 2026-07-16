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

function formatLabel(value) {
  return String(value || "").replaceAll("_", " ");
}

export default function OperationsEmployeesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [billingProfile, setBillingProfile] = useState(null);

  const [mode, setMode] = useState("invitation");
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState("employee");
  const [scopeType, setScopeType] = useState("self");
  const [reportsToEmployeeId, setReportsToEmployeeId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadEmployees(workspaceId) {
    const response = await fetch(
      `/api/operations/employees?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Unable to load team members.");
    }

    setEmployees(Array.isArray(data.employees) ? data.employees : []);
    setDepartments(Array.isArray(data.departments) ? data.departments : []);
    setBillingProfile(data.billingProfile || null);
  }

  async function loadInvitations(workspaceId) {
    const response = await fetch(
      `/api/operations/invitations?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Unable to load invitations.");
    }

    setInvitations(Array.isArray(data.invitations) ? data.invitations : []);
  }

  async function loadWorkspaceContext(workspaceId) {
    if (!workspaceId) return;

    setIsLoading(true);
    setError("");

    try {
      await Promise.all([
        loadEmployees(workspaceId),
        loadInvitations(workspaceId),
      ]);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleWorkspaceChange(event) {
    const workspaceId = event.target.value;
    setSelectedWorkspaceId(workspaceId);

    if (typeof window !== "undefined") {
      const workspace = workspaces.find((item) => item.id === workspaceId);

      localStorage.setItem("virtus_active_workspace_id", workspaceId);

      if (workspace?.name) {
        localStorage.setItem(
          "virtus_active_workspace_name",
          workspace.name
        );
      }

      window.dispatchEvent(
        new Event("virtus-active-workspace-changed")
      );
    }

    await loadWorkspaceContext(workspaceId);
  }

  function resetForm() {
    setFullName("");
    setEmail("");
    setDepartmentId("");
    setRole("employee");
    setScopeType("self");
    setReportsToEmployeeId("");
    setMode("invitation");
    setStep(1);
  }

  async function submitTeamMember(event) {
    event.preventDefault();

    if (!selectedWorkspaceId || !fullName.trim()) {
      setError("Company and full name are required.");
      return;
    }

    if (mode === "invitation" && !email.trim()) {
      setError("Email is required when inviting a team member.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "employee") {
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
          throw new Error(data?.error || "Unable to create team member.");
        }

        setSuccess("Team member created successfully.");
      } else {
        const response = await fetch("/api/operations/invitations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceId: selectedWorkspaceId,
            invitedName: fullName,
            email,
            requestedRole: role,
            requestedScopeType: scopeType,
            departmentId,
            reportsToEmployeeId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to create invitation request."
          );
        }

        setSuccess("Invitation request created successfully.");
      }

      resetForm();
      await loadWorkspaceContext(selectedWorkspaceId);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    let alive = true;

    async function loadInitialData() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/operations/workspaces");
        const data = await response.json();

        if (!alive) return;

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load companies.");
        }

        const loadedWorkspaces = Array.isArray(data.workspaces)
          ? data.workspaces
          : [];

        setWorkspaces(loadedWorkspaces);

        if (loadedWorkspaces.length === 0) {
          setIsLoading(false);
          return;
        }

        const activeWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_id") || ""
            : "";

        const selectedWorkspace = loadedWorkspaces.find(
          (workspace) => workspace.id === activeWorkspaceId
        );

        if (!selectedWorkspace?.id) {
          throw new Error("No active company selected.");
        }

        setSelectedWorkspaceId(selectedWorkspace.id);
        await loadWorkspaceContext(selectedWorkspace.id);
      } catch (loadError) {
        if (alive) {
          setError(loadError.message);
          setIsLoading(false);
        }
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
      <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
        Organization
      </p>

      <h1 className="mt-3 text-3xl font-semibold text-white">
        Team Members
      </h1>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
        Create internal employee records or invite new members through one
        organizational onboarding workflow.
      </p>

      <div className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Add Team Member
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Complete the organizational onboarding process.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {[1, 2, 3, 4, 5].map((item) => (
              <span
                key={item}
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  step === item
                    ? "border-sky-500 bg-sky-950 text-sky-100"
                    : step > item
                      ? "border-emerald-700 bg-emerald-950/40 text-emerald-200"
                      : "border-zinc-800 bg-zinc-950 text-zinc-500"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={submitTeamMember} className="mt-6">
          {step === 1 ? (
            <div>
              <h3 className="text-sm font-semibold text-sky-100">
                Step 1 - Personal Information
              </h3>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Full name"
                  className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-sky-500"
                />

                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-sky-500"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h3 className="text-sm font-semibold text-sky-100">
                Step 2 - Position
              </h3>

              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-4 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {formatLabel(item)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h3 className="text-sm font-semibold text-sky-100">
                Step 3 - Department
              </h3>

              <select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="mt-4 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                <option value="">No department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h3 className="text-sm font-semibold text-sky-100">
                Step 4 - Reporting Structure
              </h3>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <select
                  value={scopeType}
                  onChange={(event) => setScopeType(event.target.value)}
                  className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
                >
                  {scopeTypes.map((item) => (
                    <option key={item} value={item}>
                      {formatLabel(item)} scope
                    </option>
                  ))}
                </select>

                <select
                  value={reportsToEmployeeId}
                  onChange={(event) =>
                    setReportsToEmployeeId(event.target.value)
                  }
                  className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
                >
                  <option value="">Reports to nobody</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <h3 className="text-sm font-semibold text-sky-100">
                Step 5 - Review and Onboarding
              </h3>

              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                <div className="grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
                  <p>
                    <span className="text-zinc-500">Name:</span>{" "}
                    {fullName || "Not provided"}
                  </p>
                  <p>
                    <span className="text-zinc-500">Email:</span>{" "}
                    {email || "Not provided"}
                  </p>
                  <p>
                    <span className="text-zinc-500">Position:</span>{" "}
                    {formatLabel(role)}
                  </p>
                  <p>
                    <span className="text-zinc-500">Department:</span>{" "}
                    {departments.find((item) => item.id === departmentId)?.name ||
                      "No department"}
                  </p>
                  <p>
                    <span className="text-zinc-500">Scope:</span>{" "}
                    {formatLabel(scopeType)}
                  </p>
                  <p>
                    <span className="text-zinc-500">Reports to:</span>{" "}
                    {employees.find(
                      (item) => item.id === reportsToEmployeeId
                    )?.fullName || "Nobody"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("invitation")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    mode === "invitation"
                      ? "border-sky-500 bg-sky-950/40"
                      : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">
                    Send Invitation
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    Create a pending invitation with role and reporting details.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("employee")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    mode === "employee"
                      ? "border-sky-500 bg-sky-950/40"
                      : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">
                    Create Without Invitation
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    Create the employee record immediately.
                  </p>
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-red-300">{error}</p>
          ) : null}

          {success ? (
            <p className="mt-4 text-sm text-emerald-300">{success}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
              >
                Back
              </button>
            ) : null}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => {
                  setError("");

                  if (step === 1 && !fullName.trim()) {
                    setError("Full name is required.");
                    return;
                  }

                  if (step === 1 && !email.trim()) {
                    setError("Email address is required.");
                    return;
                  }

                  setStep((current) => current + 1);
                }}
                className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving || !selectedWorkspaceId}
                className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : mode === "invitation"
                    ? "Send Invitation"
                    : "Create Team Member"}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5">
          <div>
            <h2 className="text-lg font-semibold text-sky-100">
              Leadership Team
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Build the leadership structure of your organization and assign
              responsibility at every level.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {isLoading ? (
              <p className="text-sm text-zinc-400">
                Loading organization structure...
              </p>
            ) : (
              [
                { role: "owner", title: "Owner", single: true },
                { role: "director", title: "Director", single: true },
                {
                  role: "senior_manager",
                  title: "Senior Managers",
                  single: false,
                },
                {
                  role: "department_manager",
                  title: "Department Managers",
                  single: false,
                },
                {
                  role: "supervisor",
                  title: "Supervisors",
                  single: false,
                },
                {
                  role: "employee",
                  title: "Employees",
                  single: false,
                },
              ].map((group) => {
                const roleMembers = employees.filter(
                  (employee) =>
                    (employee.role || "employee") === group.role
                );

                return (
                  <div
                    key={group.role}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {group.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {roleMembers.length === 0
                            ? "Not assigned"
                            : `${roleMembers.length} assigned`}
                        </p>
                      </div>

                      {(!group.single || roleMembers.length === 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setRole(group.role);
                            setStep(1);
                            window.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            });
                          }}
                          className="rounded-xl border border-sky-700/50 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-500 hover:bg-sky-500/10"
                        >
                          Add {group.single ? group.title : formatLabel(group.role)}
                        </button>
                      )}
                    </div>

                    {roleMembers.length > 0 && (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {roleMembers.map((employee) => (
                          <div
                            key={employee.id}
                            className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
                          >
                            <p className="text-sm font-semibold text-white">
                              {employee.fullName}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {employee.email || "No email assigned"}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                              <span>
                                {employee.departmentName || "No department"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-500/20 bg-zinc-900/60 p-5">
          <h2 className="text-lg font-semibold text-amber-100">
            Invitation Requests
          </h2>

          <div className="mt-5 space-y-3">
            {isLoading ? (
              <p className="text-sm text-zinc-400">
                Loading invitations...
              </p>
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {invitation.invitedName || invitation.email}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {invitation.email}
                      </p>
                    </div>

                    <span className="rounded-full border border-amber-600/40 px-3 py-1 text-xs text-amber-100">
                      {formatLabel(invitation.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-zinc-400">
                    <p>
                      Role: {formatLabel(invitation.requestedRole)}
                    </p>
                    <p>
                      Department:{" "}
                      {invitation.departmentName || "No department"}
                    </p>
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
    </section>
  );
}
