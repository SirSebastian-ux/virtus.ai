"use client";

import { useEffect, useState } from "react";

const cards = [
  { key: "activeEmployees", label: "Active Employees" },
  { key: "openTasks", label: "Open Tasks" },
  { key: "openUrgentIssues", label: "Urgent Issues" },
  { key: "pendingDecisions", label: "Pending Decisions" },
  { key: "todayReports", label: "Reports Today" },
];

function formatRole(role) {
  return String(role || "employee").replaceAll("_", " ");
}

export default function OperationsDashboardPage() {
  const [accessContext, setAccessContext] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
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
          if (alive) {
            setMetrics(metricsResult.metrics);
            setWorkspaceId("");
          }
          return;
        }

        const dashboardResponse = await fetch(
          `/api/operations/dashboard?workspaceId=${encodeURIComponent(
            nextWorkspaceId
          )}`,
          { cache: "no-store" }
        );

        const dashboardResult = await dashboardResponse.json();

        if (!dashboardResponse.ok) {
          throw new Error(dashboardResult.error || "Failed to load dashboard.");
        }

        if (alive) {
          setWorkspaceId(nextWorkspaceId);
          setAccessContext(dashboardResult.accessContext);
          setMetrics(dashboardResult.metrics);
          setIntelligence(dashboardResult.intelligence);
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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Operations Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Executive Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Role-aware command view filtered by company, department, team, or
            personal operating scope.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Health Score</p>
            <p className="mt-2 text-4xl font-semibold">
              {loading ? "..." : intelligence?.healthScore ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Role</p>
            <p className="mt-2 text-2xl font-semibold capitalize">
              {loading ? "..." : formatRole(accessContext?.role)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Scope</p>
            <p className="mt-2 text-2xl font-semibold capitalize">
              {loading ? "..." : accessContext?.scopeType || "self"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Workspace</p>
            <p className="mt-2 truncate text-sm text-slate-300">
              {loading ? "Loading..." : workspaceId || "No active workspace"}
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
                {loading ? "..." : metrics?.[card.key] ?? 0}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Executive Alerts</h2>

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
                No executive alerts available.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
