"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["open", "in_progress", "completed", "blocked"];

export default function OperationsTasksPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [error, setError] = useState("");

  async function loadTasks(workspaceId) {
    if (!workspaceId) return;

    setError("");

    const response = await fetch(
      `/api/operations/tasks?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load tasks.");
      setTasks([]);
      return;
    }

    setTasks(Array.isArray(data.tasks) ? data.tasks : []);
  }

  async function loadWorkspaceContext(workspaceId) {
    setIsLoading(true);
    await loadTasks(workspaceId);
    setIsLoading(false);
  }

  async function handleWorkspaceChange(event) {
    const workspaceId = event.target.value;
    setSelectedWorkspaceId(workspaceId);
    await loadWorkspaceContext(workspaceId);
  }

  async function updateTaskStatus(taskId, status) {
    setUpdatingTaskId(taskId);
    setError("");

    const response = await fetch("/api/operations/tasks", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId, status }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to update task.");
    } else {
      await loadTasks(selectedWorkspaceId);
    }

    setUpdatingTaskId("");
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
        setSelectedWorkspaceId(loadedWorkspaces[0].id);
        await loadWorkspaceContext(loadedWorkspaces[0].id);
      } else {
        setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  return (
    <section className="px-6 py-8">
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
            Accountability System
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-white">Tasks</h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Review tasks extracted from employee reports and update operational status.
          </p>

          <select
            value={selectedWorkspaceId}
            onChange={handleWorkspaceChange}
            className="mt-6 min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
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

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Open Tasks
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {openTasks.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Completed
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {completedTasks.length}
              </p>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        </section>

        <section className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <h2 className="text-lg font-semibold text-sky-100">Task Queue</h2>

          <div className="mt-4 grid gap-4">
            {isLoading ? (
              <p className="text-sm text-zinc-400">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-sm text-zinc-400">
                  No extracted tasks yet.
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-sky-100">
                        {task.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {task.description || "No description"}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {task.departmentName || "No department"} ·{" "}
                        {task.assignedEmployeeName || "Unassigned"}
                      </p>
                    </div>

                    <select
                      value={task.status}
                      onChange={(event) =>
                        updateTaskStatus(task.id, event.target.value)
                      }
                      disabled={updatingTaskId === task.id}
                      className="min-h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-white outline-none focus:border-sky-500 disabled:opacity-60"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
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
