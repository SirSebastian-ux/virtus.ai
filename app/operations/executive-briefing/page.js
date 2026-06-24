"use client";

import { useEffect, useState } from "react";

const metricCards = [
  { key: "healthScore", label: "Health Score" },
  { key: "riskScore", label: "Risk Score" },
  { key: "activeAlerts", label: "Active Alerts" },
  { key: "criticalAlerts", label: "Critical Alerts" },
  { key: "openAlerts", label: "Open Alerts" },
  { key: "activeEmployees", label: "Active Employees" },
  { key: "openTasks", label: "Open Tasks" },
  { key: "overdueTasks", label: "Overdue Tasks" },
  { key: "urgentIssues", label: "Urgent Issues" },
  { key: "pendingDecisions", label: "Pending Decisions" },
  { key: "todayReports", label: "Reports Today" },
  { key: "executivePrioritiesCount", label: "Executive Priorities" },
];

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function EmptyState({ message }) {
  return <p className="text-sm text-slate-500">{message}</p>;
}

export default function ExecutiveBriefingPage() {
  const [briefing, setBriefing] = useState(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadBriefing() {
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

        const briefingResponse = await fetch(
          `/api/operations/executive-briefing?workspaceId=${encodeURIComponent(
            nextWorkspaceId
          )}`,
          { cache: "no-store" }
        );

        const briefingResult = await briefingResponse.json();

        if (!briefingResponse.ok) {
          throw new Error(
            briefingResult.error || "Failed to load executive briefing."
          );
        }

        if (alive) {
          setWorkspaceId(nextWorkspaceId);
          setBriefing(briefingResult.briefing);
        }
      } catch (loadError) {
        if (alive) setError(loadError.message);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadBriefing();

    return () => {
      alive = false;
    };
  }, []);

  const departmentRiskRanking = briefing?.departmentRiskRanking || [];
  const urgentIssueSummary = briefing?.urgentIssueSummary || [];
  const decisionSummary = briefing?.decisionSummary || [];
  const criticalActivity = briefing?.criticalActivity || [];
  const missingDepartmentReports = briefing?.missingDepartmentReports || [];
  const executivePriorities = briefing?.executivePriorities || [];
  const leadershipInsights = briefing?.leadershipInsights || [];
  const managementAlerts = briefing?.managementAlerts || [];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Executive Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Executive Briefing</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Leadership briefing for operational health, critical risks,
            pending decisions, workload pressure, department risk, and
            recommended executive actions.
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
          {metricCards.map((card) => (
            <div
              key={card.key}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-3 text-4xl font-semibold">
                {loading ? "..." : briefing?.[card.key] ?? 0}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Executive Summary</h2>
            <div className="mt-5 space-y-3">
              {(briefing?.executiveSummary || []).map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Recommendations</h2>
            <div className="mt-5 space-y-3">
              {(briefing?.recommendations || []).map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <h2 className="text-xl font-semibold">Executive Priorities</h2>

            <div className="mt-5 space-y-3">
              {executivePriorities.length === 0 ? (
                <EmptyState message="No executive priorities." />
              ) : (
                executivePriorities.map((item) => (
                  <div
                    key={`${item.source}-${item.id}`}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.type} · {item.severity}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Leadership Insights</h2>

            <div className="mt-5 space-y-3">
              {leadershipInsights.length === 0 ? (
                <EmptyState message="No leadership insights." />
              ) : (
                leadershipInsights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.severity} · {item.value}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Management Alerts</h2>

            <div className="mt-5 space-y-3">
              {managementAlerts.length === 0 ? (
                <EmptyState message="No active alerts." />
              ) : (
                managementAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {alert.severity} · {alert.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Department Risk Ranking</h2>
          <div className="mt-5 space-y-3">
            {departmentRiskRanking.length === 0 ? (
              <EmptyState message="No department risk signals detected." />
            ) : (
              departmentRiskRanking.map((department) => (
                <div
                  key={department.id}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-100">
                        {department.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Risk Score: {department.riskScore}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-5">
                      <span>Critical: {department.criticalIssues}</span>
                      <span>Urgent: {department.urgentIssues}</span>
                      <span>Overdue: {department.overdueTasks}</span>
                      <span>Decisions: {department.pendingDecisions}</span>
                      <span>Reports: {department.todayReports}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Urgent Issue Summary</h2>
            <div className="mt-5 space-y-3">
              {urgentIssueSummary.length === 0 ? (
                <EmptyState message="No active urgent issues." />
              ) : (
                urgentIssueSummary.map((issue) => (
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

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Pending Decision Summary</h2>
            <div className="mt-5 space-y-3">
              {decisionSummary.length === 0 ? (
                <EmptyState message="No pending decisions." />
              ) : (
                decisionSummary.map((decision) => (
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

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Departments Missing Reports</h2>
            <div className="mt-5 space-y-3">
              {missingDepartmentReports.length === 0 ? (
                <EmptyState message="All active departments have submitted reports today." />
              ) : (
                missingDepartmentReports.map((department) => (
                  <div
                    key={department.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300"
                  >
                    {department.name}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Critical Activity</h2>
            <div className="mt-5 space-y-3">
              {criticalActivity.length === 0 ? (
                <EmptyState message="No recent activity found." />
              ) : (
                criticalActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <p className="font-semibold text-slate-100">
                      {activity.action}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {activity.entity_table || "system"} ·{" "}
                      {formatDate(activity.created_at)}
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
