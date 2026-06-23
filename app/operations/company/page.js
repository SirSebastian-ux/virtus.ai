"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const reportingRules = [
  "Payments received",
  "New tasks",
  "Pending tasks",
  "Urgent issues",
  "Appointments and sessions",
  "Workshop needs",
  "End-of-day summary",
  "Items needing owner or manager decision",
];

export default function OperationsCompanyPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");

  async function loadWorkspaces() {
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/operations/workspaces");
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load workspaces.");
      setWorkspaces([]);
    } else {
      setWorkspaces(Array.isArray(data.workspaces) ? data.workspaces : []);
    }

    if (typeof window !== "undefined") {
      setActiveWorkspaceId(localStorage.getItem("virtus_active_workspace_id") || "");
    }

    setIsLoading(false);
  }

  async function createWorkspace(event) {
    event.preventDefault();

    const cleanName = companyName.trim();

    if (!cleanName) {
      setError("Company name is required.");
      return;
    }

    setIsCreating(true);
    setError("");

    const response = await fetch("/api/operations/workspaces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ companyName: cleanName }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to create company workspace.");
    } else {
      setCompanyName("");
      await loadWorkspaces();
    }

    setIsCreating(false);
  }

  function selectWorkspace(workspace) {
    localStorage.setItem("virtus_active_workspace_id", workspace.id);
    localStorage.setItem("virtus_active_workspace_name", workspace.name);
    setActiveWorkspaceId(workspace.id);
    router.push("/operations");
    router.refresh();
  }

  useEffect(() => {
    async function loadInitialWorkspaces() {
      await loadWorkspaces();
    }

    loadInitialWorkspaces();
  }, []);

  return (
    <section className="px-6 py-8">
      <div className="mt-6 rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
          Company Workspace
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-white">
          Company Setup
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Create a real company workspace, prepare owner access, default departments,
          and manual testing billing structure before employee rollout.
        </p>

        <form
          onSubmit={createWorkspace}
          className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5"
        >
          <h2 className="text-lg font-semibold text-sky-100">
            Create Company Workspace
          </h2>

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Company name"
              className="min-h-12 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
            />

            <button
              type="submit"
              disabled={isCreating}
              className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Creating..." : "Create Workspace"}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </form>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5">
            <h2 className="text-lg font-semibold text-sky-100">
              Active Workspaces
            </h2>

            {isLoading ? (
              <p className="mt-3 text-sm text-zinc-400">Loading workspaces...</p>
            ) : workspaces.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-400">
                No company workspace created yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-white">
                      {workspace.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Role: {workspace.role} · Slug: {workspace.slug}
                    </p>

                    <button
                      type="button"
                      onClick={() => selectWorkspace(workspace)}
                      className={`mt-3 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                        activeWorkspaceId === workspace.id
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "bg-sky-500 text-white hover:bg-sky-400"
                      }`}
                    >
                      {activeWorkspaceId === workspace.id
                        ? "Active Company"
                        : "Use This Company"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5">
            <h2 className="text-lg font-semibold text-sky-100">
              Test Mode Billing
            </h2>
            <p className="mt-2 text-sm text-zinc-300">
              New workspaces are created in manual testing mode.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Stripe billing remains inactive until production rollout.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5">
          <h2 className="text-lg font-semibold text-sky-100">
            Employee Reporting Rules
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {reportingRules.map((rule) => (
              <div
                key={rule}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300"
              >
                {rule}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



