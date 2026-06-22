"use client";

import { useEffect, useState } from "react";

const cards = [
  { key: "activeEmployees", label: "Active Employees" },
  { key: "openTasks", label: "Open Tasks" },
  { key: "openUrgentIssues", label: "Urgent Issues" },
  { key: "pendingDecisions", label: "Pending Decisions" },
  { key: "todayReports", label: "Reports Today" },
  { key: "pendingPayments", label: "Pending Payments" },
];

export default function OperationsDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/operations/metrics", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load dashboard.");
        }

        if (alive) {
          setData(result.metrics);
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
            Live operational command view for employees, reports, tasks,
            urgent issues, decisions, and payments.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.key}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-3 text-4xl font-semibold">
                {loading ? "..." : data?.[card.key] ?? 0}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Workspace</p>
          <p className="mt-2 text-sm text-slate-300">
            {loading ? "Loading..." : data?.workspaceId || "No active workspace"}
          </p>
        </div>
      </section>
    </main>
  );
}
