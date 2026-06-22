"use client";

import { useEffect, useState } from "react";

const metricCards = [
  { key: "healthScore", label: "Health Score" },
  { key: "activeEmployees", label: "Active Employees" },
  { key: "openTasks", label: "Open Tasks" },
  { key: "urgentIssues", label: "Urgent Issues" },
  { key: "criticalIssues", label: "Critical Issues" },
  { key: "pendingDecisions", label: "Pending Decisions" },
  { key: "todayReports", label: "Reports Today" },
];

export default function ExecutiveBriefingPage() {
  const [briefing, setBriefing] = useState(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadBriefing() {
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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Executive Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Executive Briefing
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Leadership briefing for operational health, critical risks,
            pending decisions, workload pressure, and recommended executive
            actions.
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
      </section>
    </main>
  );
}
