"use client";

import { useEffect, useState } from "react";

const ROLE_PRESENTATION = {
  owner: {
    title: "Executive Dashboard",
    description:
      "Company-wide operating health, priorities, and leadership signals.",
    alertTitle: "Executive Alerts",
  },
  director: {
    title: "Executive Dashboard",
    description:
      "Company-wide operating health, priorities, and leadership signals.",
    alertTitle: "Executive Alerts",
  },
  senior_manager: {
    title: "Operations Dashboard",
    description:
      "Company-wide delivery, workload, and operational risk signals.",
    alertTitle: "Operational Signals",
  },
  department_manager: {
    title: "Department Dashboard",
    description:
      "Department activity, delivery, and issues requiring management attention.",
    alertTitle: "Department Signals",
  },
  supervisor: {
    title: "Team Dashboard",
    description:
      "Direct-team workload, reporting, and issues requiring supervision.",
    alertTitle: "Team Signals",
  },
  employee: {
    title: "My Dashboard",
    description:
      "Your assigned work, reports, and urgent issues in one personal view.",
    alertTitle: "My Work Signals",
  },
};

const MANAGEMENT_CARDS = [
  { key: "activeEmployees", label: "Active Employees" },
  { key: "openTasks", label: "Open Tasks" },
  { key: "openUrgentIssues", label: "Urgent Issues" },
  { key: "pendingDecisions", label: "Pending Decisions" },
  { key: "todayReports", label: "Reports Today" },
];

const DEPARTMENT_CARDS = [
  { key: "activeEmployees", label: "Department Employees" },
  { key: "openTasks", label: "Department Open Tasks" },
  { key: "openUrgentIssues", label: "Department Urgent Issues" },
  { key: "pendingDecisions", label: "Pending Decisions" },
  { key: "todayReports", label: "Department Reports Today" },
];

const TEAM_CARDS = [
  { key: "activeEmployees", label: "Team Members" },
  { key: "openTasks", label: "Open Team Tasks" },
  { key: "openUrgentIssues", label: "Team Urgent Issues" },
  { key: "todayReports", label: "Team Reports Today" },
];

const EMPLOYEE_CARDS = [
  { key: "openTasks", label: "My Open Tasks" },
  { key: "openUrgentIssues", label: "My Urgent Issues" },
  { key: "todayReports", label: "My Reports Today" },
];

function formatRole(role) {
  return String(role || "employee")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatScope(scopeType) {
  const labels = {
    company: "Company-wide",
    department: "Department",
    team: "Direct team",
    self: "Personal",
  };

  return labels[scopeType] || "Personal";
}

function getPresentation(role) {
  return ROLE_PRESENTATION[role] || ROLE_PRESENTATION.employee;
}

function getCards(role) {
  if (role === "employee") return EMPLOYEE_CARDS;
  if (role === "supervisor") return TEAM_CARDS;
  if (role === "department_manager") return DEPARTMENT_CARDS;
  return MANAGEMENT_CARDS;
}

function getHealthLabel(scopeType) {
  const labels = {
    company: "Company Health",
    department: "Department Health",
    team: "Team Health",
    self: "Personal Health",
  };

  return labels[scopeType] || "Operational Health";
}

export default function OperationsDashboardPage() {
  const [accessContext, setAccessContext] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        const selectedWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_id") || ""
            : "";

        if (!selectedWorkspaceId) {
          throw new Error("No active company selected.");
        }

        const response = await fetch(
          `/api/operations/dashboard?workspaceId=${encodeURIComponent(
            selectedWorkspaceId,
          )}`,
          { cache: "no-store" },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load dashboard.");
        }

        if (alive) {
          setAccessContext(result.accessContext);
          setMetrics(result.metrics);
          setIntelligence(result.intelligence);
        }
      } catch (loadError) {
        if (alive) {
          setError(loadError.message);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      alive = false;
    };
  }, []);

  const role = accessContext?.role || "employee";
  const scopeType = accessContext?.scopeType || "self";
  const presentation = getPresentation(role);
  const cards = getCards(role);
  const showHealthScore = intelligence?.healthScore !== null;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Operations Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            {loading ? "Dashboard" : presentation.title}
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            {loading
              ? "Loading your authorized operating view..."
              : presentation.description}
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            {error}
          </div>
        ) : null}

        <div
          className={`grid gap-4 ${
            showHealthScore ? "md:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
          {showHealthScore ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">
                {getHealthLabel(scopeType)}
              </p>
              <p className="mt-2 text-4xl font-semibold">
                {loading ? "..." : (intelligence?.healthScore ?? 0)}
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Role</p>
            <p className="mt-2 text-2xl font-semibold">
              {loading ? "..." : formatRole(role)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Authorized Scope</p>
            <p className="mt-2 text-2xl font-semibold">
              {loading ? "..." : formatScope(scopeType)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.key}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-3 text-4xl font-semibold">
                {loading ? "..." : (metrics?.[card.key] ?? 0)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">
            {loading ? "Operating Signals" : presentation.alertTitle}
          </h2>

          <div className="mt-5 space-y-3">
            {(intelligence?.alerts || []).map((alert) => (
              <div
                key={`${alert.level}-${alert.title}`}
                className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
              >
                <p className="text-sm font-semibold capitalize text-cyan-200">
                  {alert.level}: {alert.title}
                </p>
                <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
              </div>
            ))}

            {!loading && !intelligence?.alerts?.length ? (
              <p className="text-sm text-slate-400">
                No operating signals are available in your authorized scope.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
