"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const positionTypes = [
  { value: "executive", label: "Executive" },
  { value: "director", label: "Director" },
  { value: "manager", label: "Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "custom", label: "Custom" },
];

function formatPositionType(value) {
  return String(value || "custom")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function LeadershipTeamPage() {
  const router = useRouter();

  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [canManage, setCanManage] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [actionPositionId, setActionPositionId] = useState("");
  const [employeeSelections, setEmployeeSelections] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const [newPosition, setNewPosition] = useState({
    title: "",
    positionType: "director",
    departmentId: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    function handleWorkspaceChange() {
      setRefreshKey((current) => current + 1);
    }

    window.addEventListener(
      "virtus-active-workspace-changed",
      handleWorkspaceChange
    );
    window.addEventListener("storage", handleWorkspaceChange);

    return () => {
      window.removeEventListener(
        "virtus-active-workspace-changed",
        handleWorkspaceChange
      );
      window.removeEventListener("storage", handleWorkspaceChange);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadLeadershipTeam() {
      try {
        setIsLoading(true);
        setError("");

        const workspaceId =
          localStorage.getItem("virtus_active_workspace_id") || "";
        const workspaceName =
          localStorage.getItem("virtus_active_workspace_name") || "";

        if (alive) {
          setActiveWorkspaceId(workspaceId);
          setActiveWorkspaceName(workspaceName);
        }

        if (!workspaceId) {
          if (alive) {
            setPositions([]);
            setEmployees([]);
            setDepartments([]);
            setCanManage(false);
          }
          return;
        }

        const response = await fetch(
          `/api/operations/organization-positions?workspaceId=${encodeURIComponent(workspaceId)}&leadershipOnly=true`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load leadership team.");
        }

        if (alive) {
          setActiveWorkspaceName(data?.workspace?.name || workspaceName);
          setPositions(Array.isArray(data?.positions) ? data.positions : []);
          setEmployees(Array.isArray(data?.employees) ? data.employees : []);
          setDepartments(
            Array.isArray(data?.departments) ? data.departments : []
          );
          setCanManage(Boolean(data?.canManage));
        }
      } catch (loadError) {
        if (alive) {
          setError(loadError.message);
        }
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    }

    loadLeadershipTeam();

    return () => {
      alive = false;
    };
  }, [refreshKey, router]);

  async function createPosition(event) {
    event.preventDefault();

    const title = newPosition.title.trim();

    if (!title) {
      setError("Position title is required.");
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/operations/organization-positions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceId: activeWorkspaceId,
            title,
            positionType: newPosition.positionType,
            departmentId: newPosition.departmentId || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create position.");
      }

      setNewPosition({
        title: "",
        positionType: "director",
        departmentId: "",
      });
      setIsCreateOpen(false);
      setSuccess(`${title} was created.`);
      setRefreshKey((current) => current + 1);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsCreating(false);
    }
  }

  async function updatePosition(positionId, action, employeeId = "") {
    try {
      setActionPositionId(positionId);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/operations/organization-positions",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceId: activeWorkspaceId,
            positionId,
            action,
            employeeId: employeeId || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update position.");
      }

      const successMessage =
        action === "assign"
          ? "Person assigned successfully."
          : action === "unassign"
            ? "Person unassigned successfully."
            : "Position archived successfully.";

      setSuccess(successMessage);
      setEmployeeSelections((current) => ({
        ...current,
        [positionId]: "",
      }));
      setRefreshKey((current) => current + 1);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setActionPositionId("");
    }
  }

  function archivePosition(position) {
    const confirmed = window.confirm(
      `Archive the ${position.title} position?`
    );

    if (!confirmed) return;

    updatePosition(position.id, "archive");
  }

  const assignedCount = positions.filter(
    (position) => position.assignmentStatus === "assigned"
  ).length;
  const unassignedCount = positions.length - assignedCount;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
      <header>
        <Link
          href="/operations/organization"
          className="text-sm font-medium text-sky-300 transition hover:text-sky-200"
        >
          ← Back to Organization
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/60">
              {activeWorkspaceName || "Active Company"}
            </p>

            <h1 className="mt-3 text-3xl font-bold text-white">
              Leadership Team
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Define leadership positions first, then assign active team
              members as the organization grows.
            </p>
          </div>

          {canManage && activeWorkspaceId ? (
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen((current) => !current);
                setError("");
                setSuccess("");
              }}
              className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              {isCreateOpen ? "Close Form" : "Create Position"}
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      {!activeWorkspaceId ? (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="text-lg font-semibold text-amber-100">
            Choose an active company
          </h2>
          <p className="mt-2 text-sm text-amber-200/70">
            Select a company from the company switcher before managing its
            leadership team.
          </p>
        </section>
      ) : null}

      {activeWorkspaceId ? (
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Leadership Positions",
              value: positions.length,
            },
            {
              label: "Assigned",
              value: assignedCount,
            },
            {
              label: "Not Assigned",
              value: unassignedCount,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <p className="text-sm text-zinc-400">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {item.value}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      {isCreateOpen && canManage ? (
        <form
          onSubmit={createPosition}
          className="rounded-2xl border border-sky-900/40 bg-sky-950/10 p-6"
        >
          <h2 className="text-xl font-semibold text-white">
            Create Leadership Position
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            Create the role now. A person can be assigned immediately or
            later.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <input
              value={newPosition.title}
              onChange={(event) =>
                setNewPosition((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Position title, e.g. Finance Director"
              maxLength={160}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
            />

            <select
              value={newPosition.positionType}
              onChange={(event) =>
                setNewPosition((current) => ({
                  ...current,
                  positionType: event.target.value,
                }))
              }
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
            >
              {positionTypes.map((positionType) => (
                <option
                  key={positionType.value}
                  value={positionType.value}
                >
                  {positionType.label}
                </option>
              ))}
            </select>

            <select
              value={newPosition.departmentId}
              onChange={(event) =>
                setNewPosition((current) => ({
                  ...current,
                  departmentId: event.target.value,
                }))
              }
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
            >
              <option value="">Company-wide position</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="mt-5 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Creating Position..." : "Create Position"}
          </button>
        </form>
      ) : null}

      {isLoading ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-400">
          Loading leadership team...
        </section>
      ) : null}

      {!isLoading && activeWorkspaceId && positions.length === 0 ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">
            No leadership positions yet
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Create the first leadership position for this company.
          </p>
        </section>
      ) : null}

      {!isLoading && positions.length > 0 ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {positions.map((position) => {
            const selectedEmployeeId =
              employeeSelections[position.id] || "";
            const isActionRunning = actionPositionId === position.id;

            return (
              <article
                key={position.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-white">
                        {position.title}
                      </h2>

                      {position.systemKey ? (
                        <span className="rounded-full border border-sky-800/50 bg-sky-950/30 px-2.5 py-1 text-xs font-medium text-sky-200">
                          Company Setup
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm text-zinc-400">
                      {formatPositionType(position.positionType)}
                      {position.departmentName
                        ? ` · ${position.departmentName}`
                        : " · Company-wide"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      position.assignmentStatus === "assigned"
                        ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-200"
                        : "border-amber-800/50 bg-amber-950/30 text-amber-200"
                    }`}
                  >
                    {position.assignmentStatus === "assigned"
                      ? "Assigned"
                      : "Not Assigned"}
                  </span>
                </div>

                {position.assignedEmployee ? (
                  <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      Assigned Person
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {position.assignedEmployee.fullName}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {position.assignedEmployee.email || "No email recorded"}
                    </p>

                    {canManage ? (
                      <button
                        type="button"
                        disabled={isActionRunning}
                        onClick={() =>
                          updatePosition(position.id, "unassign")
                        }
                        className="mt-4 text-sm font-medium text-amber-300 transition hover:text-amber-200 disabled:opacity-50"
                      >
                        Unassign Person
                      </button>
                    ) : null}
                  </div>
                ) : canManage ? (
                  <div className="mt-6">
                    {employees.length > 0 ? (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                          value={selectedEmployeeId}
                          onChange={(event) =>
                            setEmployeeSelections((current) => ({
                              ...current,
                              [position.id]: event.target.value,
                            }))
                          }
                          className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                        >
                          <option value="">Choose active team member</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.full_name}
                              {employee.position_title
                                ? ` — ${employee.position_title}`
                                : ""}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={!selectedEmployeeId || isActionRunning}
                          onClick={() =>
                            updatePosition(
                              position.id,
                              "assign",
                              selectedEmployeeId
                            )
                          }
                          className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isActionRunning ? "Assigning..." : "Assign Person"}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-4">
                        <p className="text-sm text-amber-100">
                          No active team members are available to assign.
                        </p>
                        <Link
                          href="/operations/employees"
                          className="mt-3 inline-flex text-sm font-semibold text-sky-300 hover:text-sky-200"
                        >
                          Add Team Member
                        </Link>
                      </div>
                    )}
                  </div>
                ) : null}

                {canManage &&
                !position.systemKey &&
                position.assignmentStatus !== "assigned" ? (
                  <button
                    type="button"
                    disabled={isActionRunning}
                    onClick={() => archivePosition(position)}
                    className="mt-5 text-sm font-medium text-red-300 transition hover:text-red-200 disabled:opacity-50"
                  >
                    Archive Position
                  </button>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}