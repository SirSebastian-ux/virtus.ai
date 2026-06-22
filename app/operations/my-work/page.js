"use client";

import { useEffect, useState } from "react";

const metricCards = [
  ["openTasks", "Open Tasks"],
  ["overdueTasks", "Overdue Tasks"],
  ["urgentIssues", "Urgent Issues"],
  ["criticalIssues", "Critical Issues"],
  ["todayReports", "Reports Today"],
  ["pendingDecisions", "Pending Decisions"],
  ["recentActivity", "Activity Items"],
];

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function EmptyState({ message }) {
  return <p className="text-sm text-slate-500">{message}</p>;
}

export default function MyWorkPage() {
  const [dashboard, setDashboard] = useState(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadMyWork() {
      try {
        const metricsResponse = await fetch("/api/operations/metrics", {
          cache: "no-store",
        });

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
          `/api/operations/my-work?workspaceId=${encodeURIComponent(
            nextWorkspaceId
          )}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load my work.");
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

    loadMyWork();

    return () => {
      alive = false;
    };
  }, []);

  const metrics = dashboard?.metrics || {};
  const employee = dashboard?.employee;
  const tasks = dashboard?.tasks || [];
  const reports = dashboard?.reports || [];
  const urgentIssues = dashboard?.urgentIssues || [];
  const pendingDecisions = dashboard?.pendingDecisions || [];
  const activity = dashboard?.activity || [];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            My Work
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Employee Personal Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Personal operational view for assigned tasks, daily reports, urgent
            issues, pending decisions, activity, and execution responsibility.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Workspace</p>
            <p className="mt-2 truncate text-sm text-slate-300">
              {loading ? "Loading..." : workspaceId || "No active workspace"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Employee</p>
            <p className="mt-2 text-sm text-slate-300">
              {employee?.full_name || "No employee profile connected"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {employee?.position_title || "No position"} ·{" "}
              {employee?.email || "No email"}
            </p>
          </div>
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

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">My Open Tasks</h2>
            <div className="mt-5 space-y-3">
              {tasks.length === 0 ? (
                <EmptyState message="No open tasks assigned to you." />
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
            <h2 className="text-xl font-semibold">My Urgent Issues</h2>
            <div className="mt-5 space-y-3">
              {urgentIssues.length === 0 ? (
                <EmptyState message="No active urgent issues assigned to you." />
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
            <h2 className="text-xl font-semibold">My Reports</h2>
            <div className="mt-5 space-y-3">
              {reports.length === 0 ? (
                <EmptyState message="No reports submitted yet." />
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <p className="font-semibold text-slate-100">
                      {report.report_date}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {report.ai_summary || report.raw_report || "No summary."}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">My Pending Decisions</h2>
            <div className="mt-5 space-y-3">
              {pendingDecisions.length === 0 ? (
                <EmptyState message="No decisions waiting on you." />
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

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">My Recent Activity</h2>
          <div className="mt-5 space-y-3">
            {activity.length === 0 ? (
              <EmptyState message="No recent activity found." />
            ) : (
              activity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <p className="font-semibold text-slate-100">{item.action}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.entity_table || "system"} ·{" "}
                    {formatDate(item.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
