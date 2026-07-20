"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  { label: "Dashboard", href: "/operations/dashboard", metricKey: null, visible: () => true },
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

const ACTIVE_WORKSPACE_ID_KEY = "virtus_active_workspace_id";
const ACTIVE_WORKSPACE_NAME_KEY = "virtus_active_workspace_name";
const ACTIVE_WORKSPACE_USER_KEY = "virtus_active_workspace_user_id";

function getScopedWorkspaceKey(baseKey, userId) {
  return `${baseKey}:${userId}`;
}

function readStoredWorkspaceId(userId) {
  if (typeof window === "undefined" || !userId) return "";

  return (
    window.localStorage.getItem(
      getScopedWorkspaceKey(ACTIVE_WORKSPACE_ID_KEY, userId)
    ) ||
    window.localStorage.getItem(ACTIVE_WORKSPACE_ID_KEY) ||
    ""
  );
}

function persistStoredWorkspaceSelection(userId, workspace) {
  if (
    typeof window === "undefined" ||
    !userId ||
    !workspace?.id
  ) {
    return;
  }

  const workspaceId = String(workspace.id);
  const workspaceName = String(workspace.name || "");

  window.localStorage.setItem(
    getScopedWorkspaceKey(ACTIVE_WORKSPACE_ID_KEY, userId),
    workspaceId
  );
  window.localStorage.setItem(
    getScopedWorkspaceKey(ACTIVE_WORKSPACE_NAME_KEY, userId),
    workspaceName
  );
  window.localStorage.setItem(ACTIVE_WORKSPACE_ID_KEY, workspaceId);
  window.localStorage.setItem(ACTIVE_WORKSPACE_NAME_KEY, workspaceName);
  window.localStorage.setItem(ACTIVE_WORKSPACE_USER_KEY, userId);
}

function clearStoredWorkspaceSelection(userId = "") {
  if (typeof window === "undefined") return;

  const storedUserId =
    userId ||
    window.localStorage.getItem(ACTIVE_WORKSPACE_USER_KEY) ||
    "";

  window.localStorage.removeItem(ACTIVE_WORKSPACE_ID_KEY);
  window.localStorage.removeItem(ACTIVE_WORKSPACE_NAME_KEY);
  window.localStorage.removeItem(ACTIVE_WORKSPACE_USER_KEY);
  window.localStorage.removeItem("virtus_company_foundation_active");

  if (storedUserId) {
    window.localStorage.removeItem(
      getScopedWorkspaceKey(ACTIVE_WORKSPACE_ID_KEY, storedUserId)
    );
    window.localStorage.removeItem(
      getScopedWorkspaceKey(ACTIVE_WORKSPACE_NAME_KEY, storedUserId)
    );
  }
}
export default function OperationsLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [metrics, setMetrics] = useState(null);
  const [role, setRole] = useState("employee");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const [workspaceRefreshKey, setWorkspaceRefreshKey] = useState(0);
  const [workspaces, setWorkspaces] = useState([]);
  const [authenticatedUserId, setAuthenticatedUserId] = useState("");
  const [archivedWorkspaces, setArchivedWorkspaces] = useState([]);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [restoringWorkspaceId, setRestoringWorkspaceId] = useState("");
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [isArchivedCompaniesOpen, setIsArchivedCompaniesOpen] = useState(false);

  useEffect(() => {
    function handleActiveWorkspaceChange() {
      setWorkspaceRefreshKey((current) => current + 1);
    }

    window.addEventListener("virtus-active-workspace-changed", handleActiveWorkspaceChange);
    window.addEventListener("storage", handleActiveWorkspaceChange);

    function openCompanySwitcher() {
      setIsSwitcherOpen(true);
      setIsCreateCompanyOpen(true);
    }

    window.addEventListener("virtus-open-company-switcher", openCompanySwitcher);

    return () => {
      window.removeEventListener("virtus-active-workspace-changed", handleActiveWorkspaceChange);
      window.removeEventListener("storage", handleActiveWorkspaceChange);
      window.removeEventListener("virtus-open-company-switcher", openCompanySwitcher);
    };
  }, [workspaceRefreshKey]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const workspacesResponse = await fetch("/api/operations/workspaces", {
          cache: "no-store",
        });

        if (workspacesResponse.status === 401) {
          clearStoredWorkspaceSelection();

          if (isMounted) {
            setAuthenticatedUserId("");
            setActiveWorkspaceId("");
            setActiveWorkspaceName("");
            setWorkspaces([]);
            setArchivedWorkspaces([]);
            setMetrics(null);
            setRole("employee");
          }

          router.push("/login");
          return;
        }

        const workspacesData = await workspacesResponse.json();

        if (!workspacesResponse.ok) {
          throw new Error(
            workspacesData?.error || "Unable to load authorized companies."
          );
        }

        const nextUserId = String(
          workspacesData?.authenticatedUserId || ""
        ).trim();

        const nextWorkspaces = Array.isArray(workspacesData.workspaces)
          ? workspacesData.workspaces
          : [];

        const nextArchivedWorkspaces = Array.isArray(
          workspacesData.archivedWorkspaces
        )
          ? workspacesData.archivedWorkspaces
          : [];

        if (!nextUserId) {
          throw new Error("The authenticated user could not be verified.");
        }

        if (isMounted) {
          setAuthenticatedUserId(nextUserId);
          setWorkspaces(nextWorkspaces);
          setArchivedWorkspaces(nextArchivedWorkspaces);
        }

        const storedWorkspaceId = readStoredWorkspaceId(nextUserId);

        const authorizedWorkspace = [
          ...nextWorkspaces,
          ...nextArchivedWorkspaces,
        ].find((workspace) => workspace.id === storedWorkspaceId);

        if (!authorizedWorkspace) {
          clearStoredWorkspaceSelection(nextUserId);

          if (isMounted) {
            setActiveWorkspaceId("");
            setActiveWorkspaceName("");
            setMetrics(null);
            setRole("employee");
          }

          return;
        }

        persistStoredWorkspaceSelection(
          nextUserId,
          authorizedWorkspace
        );

        if (isMounted) {
          setActiveWorkspaceId(authorizedWorkspace.id);
          setActiveWorkspaceName(authorizedWorkspace.name);
        }

        if (authorizedWorkspace.status === "archived") {
          if (isMounted) {
            setMetrics(null);
            setRole(authorizedWorkspace.role || "employee");
          }

          return;
        }

        const metricsResponse = await fetch(
          `/api/operations/metrics?workspaceId=${encodeURIComponent(
            authorizedWorkspace.id
          )}`,
          {
            cache: "no-store",
          }
        );

        if (metricsResponse.status === 401) {
          clearStoredWorkspaceSelection(nextUserId);

          if (isMounted) {
            setActiveWorkspaceId("");
            setActiveWorkspaceName("");
            setMetrics(null);
            setRole("employee");
          }

          router.push("/login");
          return;
        }

        const metricsData = await metricsResponse.json();

        if (!metricsResponse.ok) {
          clearStoredWorkspaceSelection(nextUserId);

          if (isMounted) {
            setActiveWorkspaceId("");
            setActiveWorkspaceName("");
            setMetrics(null);
            setRole("employee");
          }

          return;
        }

        const verifiedWorkspaceId =
          metricsData?.metrics?.workspaceId || "";

        if (verifiedWorkspaceId !== authorizedWorkspace.id) {
          clearStoredWorkspaceSelection(nextUserId);

          if (isMounted) {
            setActiveWorkspaceId("");
            setActiveWorkspaceName("");
            setMetrics(null);
            setRole("employee");
          }

          return;
        }

        if (isMounted) {
          setMetrics(metricsData.metrics || null);
        }

        const accessResponse = await fetch(
          `/api/operations/access-context?workspaceId=${encodeURIComponent(
            verifiedWorkspaceId
          )}`,
          {
            cache: "no-store",
          }
        );

        if (accessResponse.status === 401) {
          clearStoredWorkspaceSelection(nextUserId);

          if (isMounted) {
            setActiveWorkspaceId("");
            setActiveWorkspaceName("");
            setMetrics(null);
            setRole("employee");
          }

          router.push("/login");
          return;
        }

        const accessData = await accessResponse.json();

        if (
          isMounted &&
          accessResponse.ok &&
          accessData?.accessContext?.role
        ) {
          setRole(accessData.accessContext.role);
        } else if (isMounted) {
          setRole("employee");
        }
      } catch (error) {
        console.error("Failed to load authorized company state", error);
        clearStoredWorkspaceSelection();

        if (isMounted) {
          setAuthenticatedUserId("");
          setActiveWorkspaceId("");
          setActiveWorkspaceName("");
          setWorkspaces([]);
          setArchivedWorkspaces([]);
          setMetrics(null);
          setRole("employee");
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [workspaceRefreshKey, router]);
  function applyWorkspaceSelection(workspace) {
    if (!authenticatedUserId || !workspace?.id) return;

    persistStoredWorkspaceSelection(
      authenticatedUserId,
      workspace
    );
    setActiveWorkspaceId(workspace.id);
    setActiveWorkspaceName(workspace.name);
    setIsSwitcherOpen(false);
    window.dispatchEvent(
      new Event("virtus-active-workspace-changed")
    );
  }

  function selectWorkspace(workspace) {
    applyWorkspaceSelection(workspace);
  }

  async function createCompany(event) {
    event.preventDefault();

    const companyName = newCompanyName.trim();

    if (!companyName) return;

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
      const workspaceUserId = String(
        data?.authenticatedUserId || authenticatedUserId || ""
      ).trim();

      if (!workspace?.id || !workspaceUserId) {
        throw new Error(
          "Company was created but its secure ownership state was not returned."
        );
      }

      setAuthenticatedUserId(workspaceUserId);
      persistStoredWorkspaceSelection(
        workspaceUserId,
        workspace
      );
      setNewCompanyName("");
      setIsCreateCompanyOpen(false);
      setActiveWorkspaceId(workspace.id);
      setActiveWorkspaceName(workspace.name);
      setIsSwitcherOpen(false);
      window.dispatchEvent(
        new Event("virtus-active-workspace-changed")
      );
    } catch (error) {
      console.error("Failed to create company", error);
    } finally {
      setIsCreatingCompany(false);
    }
  }

  async function restoreWorkspace(workspace) {
    if (!authenticatedUserId) return;

    setRestoringWorkspaceId(workspace.id);

    try {
      const response = await fetch(
        "/api/operations/danger-zone/restore-workspace",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ workspaceId: workspace.id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to restore company.");
      }

      const restoredWorkspace = data?.workspace || workspace;

      persistStoredWorkspaceSelection(
        authenticatedUserId,
        restoredWorkspace
      );
      setActiveWorkspaceId(restoredWorkspace.id);
      setActiveWorkspaceName(restoredWorkspace.name);
      setIsSwitcherOpen(false);
      window.dispatchEvent(
        new Event("virtus-active-workspace-changed")
      );
    } catch (error) {
      console.error("Failed to restore company", error);
    } finally {
      setRestoringWorkspaceId("");
    }
  }

  function viewArchivedHistory(workspace) {
    applyWorkspaceSelection(workspace);
    router.push("/operations/company");
  }
  const visibleNavigation = useMemo(
    () => navigation.filter((item) => item.visible(role)),
    [role]
  );

  const setupRequired =
    Boolean(activeWorkspaceId) &&
    typeof window !== "undefined" &&
    localStorage.getItem("virtus_company_foundation_active") !== "true";

  const hideNavigationOnLanding = pathname === "/operations";

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

          {activeWorkspaceId ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-sky-900/30 bg-sky-950/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-sky-300/60">
                  Active Company
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {activeWorkspaceName || activeWorkspaceId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSwitcherOpen(true)}
                className="inline-flex rounded-xl border border-sky-800/50 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-500"
              >
                Company Settings
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {!hideNavigationOnLanding && !setupRequired && activeWorkspaceId ? (
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
        ) : null}

        <main className={pathname === "/operations" || setupRequired || !activeWorkspaceId ? "mx-auto w-full max-w-6xl" : "flex-1"}>{children}</main>
      </div>

      {isSwitcherOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button
            type="button"
            aria-label="Close company switcher"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsSwitcherOpen(false)}
          />

          <aside className="relative z-10 h-full w-full max-w-md overflow-y-auto operations-scrollbar border-l border-sky-900/30 bg-zinc-950 p-6 shadow-2xl shadow-black/50">
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
                            Role: {workspace.role}
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            Status: {workspace.status}
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

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsCreateCompanyOpen((current) => !current)}
                className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                {isCreateCompanyOpen ? "Close Create Company" : "Create Company"}
              </button>

              {isCreateCompanyOpen ? (
                <form
                  onSubmit={createCompany}
                  className="mt-3 rounded-2xl border border-sky-900/30 bg-sky-950/10 p-4"
                >
                  <p className="text-xs leading-5 text-zinc-500">
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
                    className="mt-3 w-full rounded-xl border border-sky-700/50 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCreatingCompany ? "Creating..." : "Create"}
                  </button>
                </form>
              ) : null}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsArchivedCompaniesOpen((current) => !current)}
                className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
              >
                {isArchivedCompaniesOpen ? "Hide Archived Companies" : "Archived Companies"}
              </button>

              {isArchivedCompaniesOpen ? (
                <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-xs leading-5 text-zinc-500">
                    View company history or restore archived companies.
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

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => viewArchivedHistory(workspace)}
                              className="rounded-lg border border-sky-700/50 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-500"
                            >
                              History
                            </button>

                            <button
                              type="button"
                              onClick={() => restoreWorkspace(workspace)}
                              disabled={restoringWorkspaceId === workspace.id}
                              className="rounded-lg border border-emerald-700/50 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {restoringWorkspaceId === workspace.id
                                ? "Restoring..."
                                : "Restore"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
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
