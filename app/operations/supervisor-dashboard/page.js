"use client";

import { useEffect, useState } from "react";

const metricCards = [
  ["teamMembers", "Team Members"],
  ["openTasks", "Open Tasks"],
  ["overdueTasks", "Overdue Tasks"],
  ["urgentIssues", "Urgent Issues"],
  ["criticalIssues", "Critical Issues"],
  ["todayReports", "Reports Today"],
  ["pendingDecisions", "Pending Decisions"],
];

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function EmptyState({ message }) {
  return <p className="text-sm text-slate-500">{message}</p>;
}

export default function SupervisorDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [workspaceId, setWorkspaceId] = useState("");
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

        const metricsResponse = await fetch(
          `/api/operations/metrics?workspaceId=${encodeURIComponent(
            selectedWorkspaceId
          )}`,
          {
            cache: "no-store",
          }
        );

        const metricsResult = await metricsResponse.json();

        if (!metricsResponse.ok) {
          throw new Error(metricsResult.error || "Failed to load workspace.");
        }

        const nextWorkspaceId = metricsResult.metrics?.workspaceId || "";

        if (!nextWorkspaceId) {
          if (alive) setWorkspaceId("");
          return;
        }

        const response = await fetch(
          `/api/operations/supervisor-dashboard?workspaceId=${encodeURIComponent(
            nextWorkspaceId
          )}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load supervisor dashboard.");
        }

        if (alive) {
          setWorkspaceId(nextWorkspaceId);
          setDashboard(result);
        }
      } catch (loadError) {
        if (alive) setError(loadError.message);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      alive = false;
    };
  }, []);

  const metrics = dashboard?.metrics || {};
  const teamMembers = dashboard?.teamMembers || [];
  const tasks = dashboard?.tasks || [];
  const urgentIssues = dashboard?.urgentIssues || [];
  const reports = dashboard?.reports || [];
  const pendingDecisions = dashboard?.pendingDecisions || [];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Supervisor Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Team Execution View</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Supervisor-level visibility into direct team members, assigned
            tasks, urgent blockers, daily reports, overdue work, and decisions
            waiting for action.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Workspace</p>
          <p className="mt-2 truncate text-sm text-slate-300">
            {loading ? "Loading..." : workspaceId || "No active workspace"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map(([key, label]) => (
            <div
              key={key}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-4xl font-semibold">
                {loading ? "..." : metrics[key] ?? 0}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Team Members</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {teamMembers.length === 0 ? (
              <EmptyState message="No team members found." />
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <p className="font-semibold text-slate-100">
                    {member.full_name}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {member.position_title || "No position"} ·{" "}
                    {member.email || "No email"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Open Team Tasks</h2>
            <div className="mt-5 space-y-3">
              {tasks.length === 0 ? (
                <EmptyState message="No open team tasks." />
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <p className="font-semibold text-slate-100">
                      {task.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {task.priority} · {task.status} · Due:{" "}
                      {task.due_date || "No due date"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Urgent Team Issues</h2>
            <div className="mt-5 space-y-3">
              {urgentIssues.length === 0 ? (
                <EmptyState message="No urgent team issues." />
              ) : (
                urgentIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <p className="font-semibold text-slate-100">
                      {issue.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {issue.severity} · {issue.status} ·{" "}
                      {formatDate(issue.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Today&apos;s Reports</h2>
            <div className="mt-5 space-y-3">
              {reports.length === 0 ? (
                <EmptyState message="No reports submitted by this team today." />
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <p className="font-semibold text-slate-100">
                      Report submitted
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {report.ai_summary || "No AI summary yet."}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Pending Team Decisions</h2>
            <div className="mt-5 space-y-3">
              {pendingDecisions.length === 0 ? (
                <EmptyState message="No pending team decisions." />
              ) : (
                pendingDecisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <p className="font-semibold text-slate-100">
                      {decision.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {decision.priority} · {decision.status} ·{" "}
                      {formatDate(decision.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
