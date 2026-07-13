"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const emptyMetrics = {
  activeEmployees: 0,
  todayReports: 0,
  openTasks: 0,
  openUrgentIssues: 0,
  pendingDecisions: 0,
  pendingPayments: 0,
};

const dashboardCopy = {
  owner: {
    label: "Owner Dashboard",
    title: "Company Operations Command",
    description:
      "Company-wide control center for reports, employees, tasks, urgent issues, payments, decisions, approvals, permissions, and management follow-up.",
    focus:
      "Review the entire company first: unreviewed reports, urgent issues, open tasks, pending approvals, payments, and structure gaps.",
  },
  director: {
    label: "Director Dashboard",
    title: "Executive Operations View",
    description:
      "High-level operational view across the company with emphasis on leadership decisions, approvals, risks, and department performance.",
    focus:
      "Focus on department-level performance, unresolved risks, approval flow, and whether senior managers are moving work forward.",
  },
  senior_manager: {
    label: "Senior Manager Dashboard",
    title: "Assigned Departments View",
    description:
      "Management view for the departments under your responsibility, including reports, tasks, issues, and decisions requiring escalation.",
    focus:
      "Focus on assigned departments, blocked work, unresolved reports, team execution, and escalations that need leadership discipline.",
  },
  department_manager: {
    label: "Department Manager Dashboard",
    title: "Department Operations View",
    description:
      "Department-level control center for reports, tasks, urgent issues, employee follow-up, and daily execution.",
    focus:
      "Focus on the department: today's reports, open tasks, blocked employees, urgent issues, and decisions waiting for action.",
  },
  supervisor: {
    label: "Supervisor Dashboard",
    title: "Team Execution View",
    description:
      "Team-level view for supervising direct reports, assigned tasks, urgent blockers, and operational follow-up.",
    focus:
      "Focus on your team: assigned tasks, employee blockers, urgent issues, and follow-up that must happen today.",
  },
  employee: {
    label: "Employee Dashboard",
    title: "My Work View",
    description:
      "Personal workspace for your reports, assigned tasks, urgent issues, requests, and follow-up actions.",
    focus:
      "Focus on your own work: submit accurate reports, complete assigned tasks, raise blockers early, and communicate clearly.",
  },
};

function normalizeRole(role) {
  return dashboardCopy[role] ? role : "employee";
}

export default function OperationsPage() {
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [accessContext, setAccessContext] = useState(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const [dashboardStatus, setDashboardStatus] = useState("loading");
  const [hasActiveWorkspace, setHasActiveWorkspace] = useState(() =>
    typeof window !== "undefined" && Boolean(localStorage.getItem("virtus_active_workspace_id"))
  );

  useEffect(() => {
    function syncActiveWorkspaceState() {
      setHasActiveWorkspace(Boolean(localStorage.getItem("virtus_active_workspace_id")));
    }

    syncActiveWorkspaceState();

    window.addEventListener("virtus-active-workspace-changed", syncActiveWorkspaceState);
    window.addEventListener("storage", syncActiveWorkspaceState);

    return () => {
      window.removeEventListener("virtus-active-workspace-changed", syncActiveWorkspaceState);
      window.removeEventListener("storage", syncActiveWorkspaceState);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        if (typeof window !== "undefined") {
          setHasActiveWorkspace(Boolean(localStorage.getItem("virtus_active_workspace_id")));
        }
        const selectedWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_id") || ""
            : "";

        if (!selectedWorkspaceId) {
          const workspacesResponse = await fetch("/api/operations/workspaces", {
            cache: "no-store",
          });

          if (!alive) return;

          if (workspacesResponse.status === 401) {
            setDashboardStatus("signed_out");
          } else {
            setDashboardStatus(
            Boolean(localStorage.getItem("virtus_active_workspace_id")) ? "setup_required" : "no_company"
          );
          }

          setLoading(false);
          return;
        }

        const metricsUrl = `/api/operations/metrics?workspaceId=${encodeURIComponent(
          selectedWorkspaceId
        )}`;

        const metricsResponse = await fetch(metricsUrl, {
          cache: "no-store",
        });
        const metricsData = await metricsResponse.json();

        if (!alive) return;

        if (metricsData?.metrics) {
          setDashboardStatus("ready");
          setMetrics({ ...emptyMetrics, ...metricsData.metrics });
          setWorkspaceId(metricsData.metrics.workspaceId || "");

          if (typeof window !== "undefined" && metricsData.metrics.workspaceId) {
            localStorage.setItem("virtus_active_workspace_id", metricsData.metrics.workspaceId);
            setActiveWorkspaceName(localStorage.getItem("virtus_active_workspace_name") || "");
          }
        }

        const nextWorkspaceId = metricsData?.metrics?.workspaceId;

        if (nextWorkspaceId) {
          const accessResponse = await fetch(
            `/api/operations/access-context?workspaceId=${encodeURIComponent(
              nextWorkspaceId
            )}`,
            { cache: "no-store" }
          );
          const accessData = await accessResponse.json();

          if (alive && accessData?.accessContext) {
            setAccessContext(accessData.accessContext);
          }
        }
      } catch (error) {
        console.error("Failed to load Operations dashboard", error);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      alive = false;
    };
  }, []);

  const hasOperationsAccess = Boolean(accessContext?.role && workspaceId);
  const role = normalizeRole(accessContext?.role || "employee");
  const copy = dashboardCopy[role];

  const summaryCards = useMemo(
    () => [
      {
        label: role === "employee" ? "My Workspace" : "Active Employees",
        value: role === "employee" ? 1 : metrics.activeEmployees,
        description:
          role === "employee"
            ? "Your personal operational area."
            : "People currently active in this workspace.",
      },
      {
        label: "Unreviewed Reports Today",
        value: metrics.todayReports,
        description: "Reports requiring review or follow-up today.",
      },
      {
        label: "Open Tasks",
        value: metrics.openTasks,
        description: "Tasks not yet completed in your visible scope.",
      },
      {
        label: "Urgent Issues",
        value: metrics.openUrgentIssues,
        description: "Operational issues not yet resolved in your scope.",
      },
      {
        label: "Pending Decisions",
        value: metrics.pendingDecisions,
        description: "Items waiting for action or approval.",
      },
      {
        label: "Pending Payments",
        value: metrics.pendingPayments,
        description: "Payments not yet confirmed.",
      },
    ],
    [metrics, role]
  );

  if (loading) {
    return (
      <section className="px-6 py-8">
        <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-300/60">
            Loading Operations Intelligence
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-white">
            Preparing Dashboard
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Loading your company workspace, access level, and operational data.
          </p>
        </div>
      </section>
    );
  }

  if (!hasOperationsAccess) {
    const isSignedOut = dashboardStatus === "signed_out";

    return (
      <section className="px-6 py-8">
        <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-300/60">
            {isSignedOut ? "Authentication Required" : "Company Required"}
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-white">
            {isSignedOut ? "Login to Continue" : "No Company Selected"}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            {isSignedOut
              ? "Sign in to access Operations Intelligence and manage your company workspace."
              : "Select or create a company workspace to access dashboards, employees, reports, tasks, and AI intelligence."}
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                if (isSignedOut) {
                  window.location.href = "/login";
                  return;
                }

                window.dispatchEvent(new Event("virtus-open-company-switcher"));
              }}
              className="inline-flex rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              {isSignedOut ? "Login" : "Choose Company"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-300/60">
        {copy.label}
      </p>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">{copy.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            {copy.description}
          </p>

          {accessContext ? (
            <p className="mt-3 text-xs text-zinc-500">
              Role: {accessContext.role.replaceAll("_", " ")}{" | "}Scope: {accessContext.scopeType}{" | "}Company:{" "}
              {activeWorkspaceName || workspaceId || "active"}
            </p>
          ) : null}
        </div>

        <Link
          href="/operations/daily-reporting"
          className="inline-flex rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          {role === "employee" ? "Submit Report" : "Submit or Review Report"}
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-sky-900/25 bg-zinc-900/70 p-4"
          >
            <p className="text-sm text-zinc-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {loading ? "..." : card.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h2 className="text-lg font-semibold text-amber-100">
          Management Focus
        </h2>
        <p className="mt-2 text-sm leading-6 text-amber-100/70">{copy.focus}</p>
      </div></section>
  );
}
