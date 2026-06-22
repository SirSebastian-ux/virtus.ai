"use client";

import Link from "next/link";
import { useState } from "react";

const emptyMetrics = {
  criticalAlerts: 0,
  highAlerts: 0,
  pendingDecisions: 0,
  overdueTasks: 0,
  openUrgentIssues: 0,
  executivePriorities: 0,
};

function formatLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function severityClass(severity) {
  if (severity === "critical") return "border-red-500 bg-red-50 text-red-800";
  if (severity === "high") return "border-orange-400 bg-orange-50 text-orange-800";
  if (severity === "medium") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-slate-300 bg-slate-50 text-slate-700";
}

function sourceHref(source) {
  if (source === "management_alerts") return "/operations/management-alerts";
  if (source === "decision_queue") return "/operations/decisions";
  if (source === "tasks") return "/operations/tasks";
  return "/operations/urgent";
}

export default function DecisionCenterPage() {
  const [workspaceId, setWorkspaceId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("virtus_operations_workspace_id") || "";
  });
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [priorities, setPriorities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [urgentIssues, setUrgentIssues] = useState([]);
  const [accessContext, setAccessContext] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDecisionCenter() {
    const cleanWorkspaceId = workspaceId.trim();

    if (!cleanWorkspaceId) {
      setStatusMessage("Enter a workspace ID to load the Decision Center.");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      window.localStorage.setItem("virtus_operations_workspace_id", cleanWorkspaceId);

      const response = await fetch(`/api/operations/decision-center?workspaceId=${encodeURIComponent(cleanWorkspaceId)}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load Decision Center.");
      }

      setMetrics(payload.metrics || emptyMetrics);
      setPriorities(payload.executivePriorities || []);
      setAlerts(payload.alerts || []);
      setDecisions(payload.decisions || []);
      setOverdueTasks(payload.overdueTasks || []);
      setUrgentIssues(payload.urgentIssues || []);
      setAccessContext(payload.accessContext || null);
    } catch (error) {
      setStatusMessage(error.message);
      setMetrics(emptyMetrics);
      setPriorities([]);
      setAlerts([]);
      setDecisions([]);
      setOverdueTasks([]);
      setUrgentIssues([]);
      setAccessContext(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <Link href="/operations" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            ← Back to Operations
          </Link>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
                Decision Center
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
                Executive action command center
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                One leadership screen for the highest-risk alerts, decisions, overdue work, and urgent issues.
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                loadDecisionCenter();
              }}
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
            >
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Workspace ID
              </label>
              <input
                value={workspaceId}
                onChange={(event) => setWorkspaceId(event.target.value)}
                placeholder="Workspace UUID"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-slate-950 outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-3 w-full rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-200 disabled:opacity-60"
              >
                {loading ? "Loading..." : "Load Decision Center"}
              </button>
            </form>
          </div>
        </header>

        {statusMessage ? (
          <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            {statusMessage}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Critical Alerts", metrics.criticalAlerts],
            ["High Alerts", metrics.highAlerts],
            ["Pending Decisions", metrics.pendingDecisions],
            ["Overdue Tasks", metrics.overdueTasks],
            ["Urgent Issues", metrics.openUrgentIssues],
            ["Priorities", metrics.executivePriorities],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Top Executive Priorities</h2>
              <p className="mt-1 text-sm text-slate-400">
                Ranked by operational severity, urgency, and leadership consequence.
              </p>
            </div>

            {accessContext ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                {formatLabel(accessContext.role)} · {formatLabel(accessContext.scopeType)}
              </span>
            ) : null}
          </div>

          <div className="space-y-3">
            {priorities.length ? (
              priorities.map((item, index) => (
                <article key={`${item.source}-${item.id}`} className={`rounded-2xl border p-5 shadow-sm ${severityClass(item.severity)}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold">
                          #{index + 1}
                        </span>
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold">
                          Score {item.score}
                        </span>
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold">
                          {formatLabel(item.type)}
                        </span>
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold">
                          {formatLabel(item.status)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {item.description || "No additional description."}
                      </p>
                    </div>

                    <Link
                      href={sourceHref(item.source)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
                    >
                      Open Source
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                Load a workspace to generate executive priorities.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Critical / High Alerts</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                {alerts.length}
              </span>
            </div>

            <div className="space-y-3">
              {alerts.length ? (
                alerts.map((alert) => (
                  <article key={alert.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm font-bold text-white">{alert.title}</p>
                    <p className="mt-2 text-sm text-slate-400">{alert.message}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      {formatLabel(alert.severity)} · {formatLabel(alert.status)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                  No critical or high management alerts in this scope.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Pending Decisions</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                {decisions.length}
              </span>
            </div>

            <div className="space-y-3">
              {decisions.length ? (
                decisions.map((decision) => (
                  <article key={decision.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm font-bold text-white">{decision.title}</p>
                    <p className="mt-2 text-sm text-slate-400">{decision.description || "No description."}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      {formatLabel(decision.priority)} · {formatLabel(decision.status)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                  No pending decisions in this scope.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Overdue Tasks</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                {overdueTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {overdueTasks.length ? (
                overdueTasks.map((task) => (
                  <article key={task.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm font-bold text-white">{task.title}</p>
                    <p className="mt-2 text-sm text-slate-400">{task.description || "No description."}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      Due {task.due_date || "unknown"} · {formatLabel(task.status)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                  No overdue tasks in this scope.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Open Urgent Issues</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                {urgentIssues.length}
              </span>
            </div>

            <div className="space-y-3">
              {urgentIssues.length ? (
                urgentIssues.map((issue) => (
                  <article key={issue.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm font-bold text-white">{issue.title}</p>
                    <p className="mt-2 text-sm text-slate-400">{issue.description || "No description."}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      {formatLabel(issue.severity)} · {formatLabel(issue.status)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                  No open urgent issues in this scope.
                </p>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
