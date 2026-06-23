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
      "Focus on the department: today’s reports, open tasks, blocked employees, urgent issues, and decisions waiting for action.",
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

const cardsByRole = {
  owner: [
    ["Executive Dashboard", "Real-time operational metrics and executive visibility.", "/operations/dashboard"],
    ["Executive Briefing", "Leadership health score, executive summary, risks, and recommendations.", "/operations/executive-briefing"],
    ["Management Alerts", "Critical alerts, overdue work, missing reports, unresolved risks, and escalations.", "/operations/management-alerts"],
    ["Decision Center", "Executive priorities, critical alerts, pending decisions, overdue work, and urgent issues.", "/operations/decision-center"],
    ["AI Intelligence", "Executive summaries, operational risk, recommendations, and leadership insights.", "/operations/ai-intelligence"],
    ["Operations Copilot", "Ask questions about risks, decisions, reports, tasks, alerts, and urgent issues.", "/operations/copilot"],
    ["Daily Reporting", "Employee submissions, reviews, approvals, compliance, and missing reports.", "/operations/daily-reporting"],
    ["Department Intelligence", "Department health, workload, risk ranking, reporting compliance, and operational visibility.", "/operations/department-intelligence"],
    ["Company Setup", "Workspace, departments, roles, and company structure.", "/operations/company"],
    ["Employees", "Manage employees, roles, departments, and active seats.", "/operations/employees"],
    ["Structure", "Review hierarchy and reporting lines.", "/operations/structure"],
    ["Permissions", "Create permission profiles and prepare access control.", "/operations/permissions"],
    ["Operations Chat", "Collect daily reports and extract operational intelligence.", "/operations/chat"],
    ["Reports", "Review employee reports, summaries, and extracted items.", "/operations/reports"],
    ["Tasks", "Track open work, completed work, blockers, and follow-ups.", "/operations/tasks"],
    ["Urgent Issues", "Monitor risks, escalations, blocked work, and serious issues.", "/operations/urgent"],
    ["Decision Queue", "Review decisions, approvals, and management escalations.", "/operations/decisions"],
    ["Payments", "Review payment records, confirmations, and pending money.", "/operations/payments"],
  ],
  director: [
    ["Daily Reporting", "Review reporting compliance, approvals, and missing department reports.", "/operations/daily-reporting"],
    ["Structure", "Review hierarchy and reporting lines.", "/operations/structure"],
    ["Operations Chat", "Review submitted operational reports.", "/operations/chat"],
    ["Reports", "Review summaries and extracted items.", "/operations/reports"],
    ["Tasks", "Track work execution across assigned leadership scope.", "/operations/tasks"],
    ["Urgent Issues", "Monitor escalations and serious issues.", "/operations/urgent"],
    ["Decision Queue", "Review approvals and management decisions.", "/operations/decisions"],
    ["Payments", "Review payment records and pending confirmations.", "/operations/payments"],
  ],
  senior_manager: [
    ["Daily Reporting", "Review department reporting activity and approvals.", "/operations/daily-reporting"],
    ["Operations Chat", "Review department reports.", "/operations/chat"],
    ["Reports", "Review reports and extracted intelligence.", "/operations/reports"],
    ["Tasks", "Track open work and follow-ups.", "/operations/tasks"],
    ["Urgent Issues", "Monitor escalations and blockers.", "/operations/urgent"],
    ["Decision Queue", "Review decisions requiring senior input.", "/operations/decisions"],
  ],
  department_manager: [
    ["Daily Reporting", "Manage department reports, reviews, and compliance.", "/operations/daily-reporting"],
    ["Operations Chat", "Review department reports.", "/operations/chat"],
    ["Reports", "Review department reports and summaries.", "/operations/reports"],
    ["Tasks", "Track department execution.", "/operations/tasks"],
    ["Urgent Issues", "Manage department blockers and risks.", "/operations/urgent"],
    ["Decision Queue", "Handle department approvals and decisions.", "/operations/decisions"],
  ],
  supervisor: [
    ["Supervisor Dashboard", "Team members, execution visibility, blockers, reports, and decisions.", "/operations/supervisor-dashboard"],
["Operations Chat", "Review team reports.", "/operations/chat"],
    ["Tasks", "Track team tasks and follow-ups.", "/operations/tasks"],
    ["Urgent Issues", "Escalate team blockers and risks.", "/operations/urgent"],
    ["Daily Reporting", "Review team reports and approve submissions.", "/operations/daily-reporting"],
  ],
  employee: [
    ["My Work", "Personal dashboard for tasks, reports, activity, decisions, and performance.", "/operations/my-work"],
["Operations Chat", "Submit your daily report.", "/operations/chat"],
    ["Tasks", "View and update your assigned tasks.", "/operations/tasks"],
    ["Urgent Issues", "Raise or review urgent work blockers.", "/operations/urgent"],
    ["Daily Reporting", "Submit and review your daily reports.", "/operations/daily-reporting"],
  ],
};

function normalizeRole(role) {
  return dashboardCopy[role] ? role : "employee";
}

export default function OperationsPage() {
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [accessContext, setAccessContext] = useState(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        const metricsResponse = await fetch("/api/operations/metrics", {
          cache: "no-store",
        });
        const metricsData = await metricsResponse.json();

        if (!alive) return;

        if (metricsData?.metrics) {
          setMetrics({ ...emptyMetrics, ...metricsData.metrics });
          setWorkspaceId(metricsData.metrics.workspaceId || "");
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
  const actionCards = hasOperationsAccess ? cardsByRole[role] || cardsByRole.employee : [];

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

  if (!loading && !hasOperationsAccess) {
    return (
      <section className="px-6 py-8">
        <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-300/60">
            Business Access
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-white">
            Business is not active
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            You need to sign in before using the Business workspace.
          </p>

          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Sign in to Business
            </Link>
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
              Role: {accessContext.role.replaceAll("_", " ")} · Scope:{" "}
              {accessContext.scopeType} · Workspace: {workspaceId || "active"}
            </p>
          ) : null}
        </div>

        <Link
          href="/operations/chat"
          className="inline-flex rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          {role === "employee" ? "Submit Report" : "Submit or Review Report"}
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-sky-900/25 bg-zinc-900/70 p-5"
          >
            <p className="text-sm text-zinc-400">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">
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
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white">Operational Areas</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Areas available for your current role and operating scope.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actionCards.map(([title, description, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5 transition hover:border-sky-700/50 hover:bg-zinc-900"
            >
              <h3 className="text-lg font-semibold text-sky-100">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
