"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  canViewAdminModule,
  canViewCompanyModule,
  canViewDecisionQueueModule,
  canViewEmployeesModule,
  canViewPaymentsModule,
  canViewPermissionsModule,
  canViewReportsModule,
  canViewStructureModule,
  canViewTasksModule,
  canViewUrgentIssuesModule,
} from "@/lib/operations/access";

const navigation = [
  { label: "Overview", href: "/operations", metricKey: null, visible: () => true },
  { label: "Company", href: "/operations/company", metricKey: null, visible: canViewCompanyModule },
  { label: "Employees", href: "/operations/employees", metricKey: "activeEmployees", visible: canViewEmployeesModule },
  { label: "Structure", href: "/operations/structure", metricKey: null, visible: canViewStructureModule },
  { label: "Operations Chat", href: "/operations/chat", metricKey: "todayReports", visible: () => true },
  { label: "Tasks", href: "/operations/tasks", metricKey: "openTasks", visible: canViewTasksModule },
  { label: "Payments", href: "/operations/payments", metricKey: "pendingPayments", visible: canViewPaymentsModule },
  { label: "Reports", href: "/operations/reports", metricKey: "todayReports", visible: canViewReportsModule },
  { label: "Daily Report", href: "/operations/daily-report", metricKey: null, visible: () => true },
  { label: "Urgent Issues", href: "/operations/urgent", metricKey: "openUrgentIssues", visible: canViewUrgentIssuesModule },
  { label: "Decision Queue", href: "/operations/decisions", metricKey: "pendingDecisions", visible: canViewDecisionQueueModule },
  { label: "Permissions", href: "/operations/permissions", metricKey: null, visible: canViewPermissionsModule },
  { label: "Admin Dashboard", href: "/operations/admin", metricKey: null, visible: canViewAdminModule },
  { label: "Danger Zone", href: "/operations/danger-zone", metricKey: null, visible: (role) => role === "owner" },
];

export default function OperationsLayout({ children }) {
  const [metrics, setMetrics] = useState(null);
  const [role, setRole] = useState("employee");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const [workspaceRefreshKey, setWorkspaceRefreshKey] = useState(0);
  const [workspaces, setWorkspaces] = useState([]);
  const [archivedWorkspaces, setArchivedWorkspaces] = useState([]);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [restoringWorkspaceId, setRestoringWorkspaceId] = useState("");

  useEffect(() => {
    function handleActiveWorkspaceChange() {
      setWorkspaceRefreshKey((current) => current + 1);
    }

    window.addEventListener("virtus-active-workspace-changed", handleActiveWorkspaceChange);
    window.addEventListener("storage", handleActiveWorkspaceChange);

    return () => {
      window.removeEventListener("virtus-active-workspace-changed", handleActiveWorkspaceChange);
      window.removeEventListener("storage", handleActiveWorkspaceChange);
    };
  }, [workspaceRefreshKey]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const selectedWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_id") || ""
            : "";

        const selectedWorkspaceName =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_name") || ""
            : "";

        if (isMounted) {
          setActiveWorkspaceId(selectedWorkspaceId);
          setActiveWorkspaceName(selectedWorkspaceName);
        }

        const workspacesResponse = await fetch("/api/operations/workspaces", {
          cache: "no-store",
        });

        const workspacesData = await workspacesResponse.json();

        if (isMounted && workspacesResponse.ok) {
          const nextWorkspaces = Array.isArray(workspacesData.workspaces)
            ? workspacesData.workspaces
            : [];

          setWorkspaces(nextWorkspaces);
          setArchivedWorkspaces(
            Array.isArray(workspacesData.archivedWorkspaces)
              ? workspacesData.archivedWorkspaces
              : []
          );

          if (!selectedWorkspaceName && selectedWorkspaceId) {
            const selectedWorkspace = nextWorkspaces.find(
              (workspace) => workspace.id === selectedWorkspaceId
            );

            if (selectedWorkspace?.name) {
              setActiveWorkspaceName(selectedWorkspace.name);
              localStorage.setItem("virtus_active_workspace_name", selectedWorkspace.name);
            }
          }
        }

        if (!selectedWorkspaceId) {
          throw new Error("No active company selected.");
        }

        const metricsUrl = `/api/operations/metrics?workspaceId=${encodeURIComponent(
          selectedWorkspaceId
        )}`;

        const metricsResponse = await fetch(metricsUrl, {
          cache: "no-store",
        });

        const metricsData = await metricsResponse.json();

        if (!isMounted || !metricsResponse.ok) return;

        setMetrics(metricsData.metrics || null);

        const workspaceId = metricsData?.metrics?.workspaceId;

        if (workspaceId && isMounted) {
          setActiveWorkspaceId(workspaceId);
        }

        if (!workspaceId) return;

        const accessResponse = await fetch(
          `/api/operations/access-context?workspaceId=${encodeURIComponent(
            workspaceId
          )}`,
          { cache: "no-store" }
        );

        const accessData = await accessResponse.json();

        if (
          isMounted &&
          accessResponse.ok &&
          accessData?.accessContext?.role
        ) {
          setRole(accessData.accessContext.role);
        }
      } catch {}
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [workspaceRefreshKey]);

  function selectWorkspace(workspace) {
    localStorage.setItem("virtus_active_workspace_id", workspace.id);
    localStorage.setItem("virtus_active_workspace_name", workspace.name);
    setActiveWorkspaceId(workspace.id);
    setActiveWorkspaceName(workspace.name);
    setIsSwitcherOpen(false);
    window.dispatchEvent(new Event("virtus-active-workspace-changed"));
  }

  async function createCompany(event) {
    event.preventDefault();

    const companyName = newCompanyName.trim();

    if (!companyName) {
      return;
    }

    setIsCreatingCompany(true);

    try {
      const response = await fetch("/api/operations/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create company.");
      }

      const workspace = data?.workspace;

      if (!workspace?.id) {
        throw new Error("Company was created but no workspace was returned.");
      }

      localStorage.setItem("virtus_active_workspace_id", workspace.id);
      localStorage.setItem("virtus_active_workspace_name", workspace.name);
      setNewCompanyName("");
      setActiveWorkspaceId(workspace.id);
      setActiveWorkspaceName(workspace.name);
      setIsSwitcherOpen(false);
      window.dispatchEvent(new Event("virtus-active-workspace-changed"));
    } catch (error) {
      console.error("Failed to create company", error);
    } finally {
      setIsCreatingCompany(false);
    }
  }

  async function restoreWorkspace(workspace) {
    setRestoringWorkspaceId(workspace.id);

    try {
      const response = await fetch("/api/operations/danger-zone/restore-workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId: workspace.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to restore company.");
      }

      const restoredWorkspace = data?.workspace || workspace;

      localStorage.setItem("virtus_active_workspace_id", restoredWorkspace.id);
      localStorage.setItem("virtus_active_workspace_name", restoredWorkspace.name);
      setActiveWorkspaceId(restoredWorkspace.id);
      setActiveWorkspaceName(restoredWorkspace.name);
      setIsSwitcherOpen(false);
      window.dispatchEvent(new Event("virtus-active-workspace-changed"));
    } catch (error) {
      console.error("Failed to restore company", error);
    } finally {
      setRestoringWorkspaceId("");
    }
  }
  const visibleNavigation = useMemo(
    () => navigation.filter((item) => item.visible(role)),
    [role]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-300/60">
            Virtus AI
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-white">
            Operations Intelligence
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Operational visibility, reporting, approvals, risks, payments, and AI management intelligence.
          </p>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-sky-900/30 bg-sky-950/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-300/60">
                Active Company
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {activeWorkspaceName || activeWorkspaceId || "No company selected"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSwitcherOpen(true)}
              className="inline-flex rounded-xl border border-sky-800/50 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-500"
            >
              Change Company
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-72 shrink-0 border-r border-zinc-800 xl:block">
          <nav className="p-4">
            <div className="space-y-1">
              {visibleNavigation.map((item) => {
                const metricValue =
                  item.metricKey && metrics ? metrics[item.metricKey] : null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                  >
                    <span>{item.label}</span>

                    {typeof metricValue === "number" && metricValue > 0 ? (
                      <span className="ml-3 rounded-full border border-sky-800/50 bg-sky-950/50 px-2 py-0.5 text-xs font-semibold text-sky-100">
                        {metricValue}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
      </div>

      {isSwitcherOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button
            type="button"
            aria-label="Close company switcher"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsSwitcherOpen(false)}
          />

          <aside className="relative z-10 h-full w-full max-w-md border-l border-sky-900/30 bg-zinc-950 p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-sky-300/60">
                  Company Switcher
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Choose Company
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Select the company workspace you want to operate inside.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSwitcherOpen(false)}
                className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {workspaces.length === 0 ? (
                <p className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
                  No active company workspaces found.
                </p>
              ) : (
                workspaces.map((workspace) => {
                  const isActive = workspace.id === activeWorkspaceId;

                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => selectWorkspace(workspace)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        isActive
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-zinc-800 bg-zinc-900/70 hover:border-sky-700/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {workspace.name}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Role: {workspace.role} · Status: {workspace.status}
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            Slug: {workspace.slug}
                          </p>
                        </div>

                        {isActive ? (
                          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                            Active
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <form
              onSubmit={createCompany}
              className="mt-6 rounded-2xl border border-sky-900/30 bg-sky-950/10 p-4"
            >
              <h3 className="text-sm font-semibold text-sky-100">
                Create Company
              </h3>

              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Add a new active company workspace and select it automatically.
              </p>

              <input
                value={newCompanyName}
                onChange={(event) => setNewCompanyName(event.target.value)}
                placeholder="Company name"
                className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500/60"
              />

              <button
                type="submit"
                disabled={isCreatingCompany || !newCompanyName.trim()}
                className="mt-3 w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingCompany ? "Creating..." : "Create Company"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">
                Archived Companies
              </h3>

              <p className="mt-2 text-xs leading-5 text-zinc-500">
                View company history and restore archived workspaces when needed.
              </p>

              <div className="mt-4 space-y-3">
                {archivedWorkspaces.length === 0 ? (
                  <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-500">
                    No archived companies found.
                  </p>
                ) : (
                  archivedWorkspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"
                    >
                      <p className="text-sm font-semibold text-white">
                        {workspace.name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Status: {workspace.status}
                      </p>
                      <p className="mt-1 break-all text-xs text-zinc-600">
                        Slug: {workspace.slug}
                      </p>

                      <button
                        type="button"
                        onClick={() => restoreWorkspace(workspace)}
                        disabled={restoringWorkspaceId === workspace.id}
                        className="mt-3 w-full rounded-lg border border-emerald-700/50 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {restoringWorkspaceId === workspace.id
                          ? "Restoring..."
                          : "Restore Company"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/operations/company"
              onClick={() => setIsSwitcherOpen(false)}
              className="mt-6 inline-flex w-full justify-center rounded-xl border border-sky-800/50 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-500"
            >
              Manage Companies
            </Link>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
