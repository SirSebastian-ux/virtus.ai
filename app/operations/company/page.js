"use client";

import { useEffect, useState } from "react";

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

const emptyMetrics = {
  activeEmployees: 0,
  openTasks: 0,
  openUrgentIssues: 0,
  pendingDecisions: 0,
  pendingPayments: 0,
  todayReports: 0,
};

export default function OperationsCompanyPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastWorkspaceId, setLastWorkspaceId] = useState("");

  useEffect(() => {
    function handleWorkspaceChange() {
      const nextWorkspaceId = localStorage.getItem("virtus_active_workspace_id") || "";
      setLastWorkspaceId(nextWorkspaceId);
      setRefreshKey((current) => current + 1);
    }

    window.addEventListener("virtus-active-workspace-changed", handleWorkspaceChange);
    window.addEventListener("storage", handleWorkspaceChange);

    return () => {
      window.removeEventListener("virtus-active-workspace-changed", handleWorkspaceChange);
      window.removeEventListener("storage", handleWorkspaceChange);
    };
  }, [refreshKey, lastWorkspaceId]);

  useEffect(() => {
    let alive = true;

    async function loadCompanyOverview() {
      try {
        const selectedWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_id") || ""
            : "";

        const selectedWorkspaceName =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_name") || ""
            : "";

        if (alive) {
          setActiveWorkspaceId(selectedWorkspaceId);
          setActiveWorkspaceName(selectedWorkspaceName);
        }

        const workspacesResponse = await fetch("/api/operations/workspaces", {
          cache: "no-store",
        });

        const workspacesData = await workspacesResponse.json();

        if (!workspacesResponse.ok) {
          throw new Error(workspacesData?.error || "Unable to load company workspaces.");
        }

        const nextWorkspaces = Array.isArray(workspacesData.workspaces)
          ? workspacesData.workspaces
          : [];

        if (alive) {
          setWorkspaces(nextWorkspaces);
        }

        const workspaceId =
          selectedWorkspaceId || nextWorkspaces[0]?.id || "";

        if (!workspaceId) return;

        const metricsResponse = await fetch(
          `/api/operations/metrics?workspaceId=${encodeURIComponent(workspaceId)}`,
          { cache: "no-store" }
        );

        const metricsData = await metricsResponse.json();

        if (!metricsResponse.ok) {
          throw new Error(metricsData?.error || "Unable to load company metrics.");
        }

        const selectedWorkspace = nextWorkspaces.find(
          (workspace) => workspace.id === workspaceId
        );

        if (alive) {
          setActiveWorkspaceId(workspaceId);
          setActiveWorkspaceName(
            selectedWorkspace?.name || selectedWorkspaceName || workspaceId
          );
          setMetrics({ ...emptyMetrics, ...(metricsData.metrics || {}) });
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

    loadCompanyOverview();

    return () => {
      alive = false;
    };
  }, [refreshKey, lastWorkspaceId]);

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;

  return (
    <section className="px-6 py-8">
      <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
          Company Workspace
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-white">
          Company Setup
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Review the selected company workspace, its operational status, employee count,
          reporting rules, and setup structure.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <div className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-300/60">
                Selected Company
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-white">
                {isLoading
                  ? "Loading company..."
                  : activeWorkspaceName || "No company selected"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                This page shows configuration and operating information for the active company only.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">
                Active Workspace
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-100">
                {activeWorkspace?.status || "active"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs text-zinc-500">Role</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {activeWorkspace?.role || "owner"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs text-zinc-500">Employees</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {isLoading ? "..." : metrics.activeEmployees}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs text-zinc-500">Open Tasks</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {isLoading ? "..." : metrics.openTasks}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs text-zinc-500">Urgent Issues</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {isLoading ? "..." : metrics.openUrgentIssues}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs text-zinc-500">Pending Decisions</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {isLoading ? "..." : metrics.pendingDecisions}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs text-zinc-500">Pending Payments</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {isLoading ? "..." : metrics.pendingPayments}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="text-xs text-zinc-500">Workspace Slug</p>
            <p className="mt-2 break-all text-sm font-semibold text-white">
              {activeWorkspace?.slug || "Not available"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
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

          <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5">
            <h2 className="text-lg font-semibold text-sky-100">
              Company Separation
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Every company has separate employees, reports, tasks, decisions,
              urgent issues, permissions, payments, and danger-zone actions.
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
