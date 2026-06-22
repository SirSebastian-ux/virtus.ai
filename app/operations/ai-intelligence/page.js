"use client";

import Link from "next/link";
import { useState } from "react";

const emptyMetrics = {
  reportCount: 0,
  openTasks: 0,
  overdueTasks: 0,
  openUrgentIssues: 0,
  criticalIssues: 0,
  pendingDecisions: 0,
  urgentDecisions: 0,
  activeAlerts: 0,
  criticalAlerts: 0,
  riskScore: 0,
};

function severityClass(severity) {
  if (severity === "critical") return "border-red-500 bg-red-50 text-red-800";
  if (severity === "high") return "border-orange-400 bg-orange-50 text-orange-800";
  if (severity === "medium") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-slate-300 bg-slate-50 text-slate-700";
}

function formatLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AIIntelligencePage() {
  const [workspaceId, setWorkspaceId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("virtus_operations_workspace_id") || "";
  });
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [executiveSummary, setExecutiveSummary] = useState([]);
  const [risks, setRisks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [leadershipInsights, setLeadershipInsights] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAIIntelligence() {
    const cleanWorkspaceId = workspaceId.trim();

    if (!cleanWorkspaceId) {
      setStatusMessage("Enter a workspace ID to load AI Operations Intelligence.");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      window.localStorage.setItem("virtus_operations_workspace_id", cleanWorkspaceId);

      const response = await fetch(`/api/operations/ai-intelligence?workspaceId=${encodeURIComponent(cleanWorkspaceId)}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load AI Operations Intelligence.");
      }

      setMetrics(payload.metrics || emptyMetrics);
      setExecutiveSummary(payload.executiveSummary || []);
      setRisks(payload.risks || []);
      setRecommendations(payload.recommendations || []);
      setLeadershipInsights(payload.leadershipInsights || []);
    } catch (error) {
      setStatusMessage(error.message);
      setMetrics(emptyMetrics);
      setExecutiveSummary([]);
      setRisks([]);
      setRecommendations([]);
      setLeadershipInsights([]);
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
                AI Operations Intelligence
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
                Executive intelligence synthesis
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                Converts reports, tasks, urgent issues, decisions, and management alerts into executive summaries,
                risk signals, recommendations, and leadership intelligence.
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                loadAIIntelligence();
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
                {loading ? "Analyzing..." : "Load AI Intelligence"}
              </button>
            </form>
          </div>
        </header>

        {statusMessage ? (
          <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            {statusMessage}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {[
            ["Risk Score", `${metrics.riskScore}/100`],
            ["Reports", metrics.reportCount],
            ["Overdue Tasks", metrics.overdueTasks],
            ["Urgent Issues", metrics.openUrgentIssues],
            ["Critical Alerts", metrics.criticalAlerts],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <h2 className="text-xl font-bold text-white">Executive Summary</h2>
            <div className="mt-4 space-y-3">
              {executiveSummary.length ? (
                executiveSummary.map((summary, index) => (
                  <p key={index} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
                    {summary}
                  </p>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                  Load a workspace to generate the executive summary.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <h2 className="text-xl font-bold text-white">Leadership Insights</h2>
            <div className="mt-4 space-y-3">
              {leadershipInsights.length ? (
                leadershipInsights.map((insight, index) => (
                  <article key={index} className={`rounded-2xl border p-4 ${severityClass(insight.severity)}`}>
                    <p className="text-sm font-bold">{insight.title}</p>
                    <p className="mt-2 text-2xl font-bold">{insight.value}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                  No leadership insights loaded.
                </p>
              )}
            </div>
          </section>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <h2 className="text-xl font-bold text-white">Detected Risks</h2>
            <div className="mt-4 space-y-3">
              {risks.length ? (
                risks.map((risk, index) => (
                  <article key={index} className={`rounded-2xl border p-4 ${severityClass(risk.severity)}`}>
                    <p className="text-sm font-bold">{risk.title}</p>
                    <p className="mt-2 text-xs font-semibold">{formatLabel(risk.source)}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                  No risks detected in this load.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <h2 className="text-xl font-bold text-white">Recommendations</h2>
            <div className="mt-4 space-y-3">
              {recommendations.length ? (
                recommendations.map((recommendation, index) => (
                  <p key={index} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
                    {recommendation}
                  </p>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                  No recommendations generated.
                </p>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
