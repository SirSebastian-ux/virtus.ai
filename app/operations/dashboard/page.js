"use client";

import { useEffect, useState } from "react";

const cards = [
  { key: "employees", label: "Employees" },
  { key: "tasks", label: "Tasks" },
  { key: "urgentIssues", label: "Urgent Issues" },
  { key: "decisions", label: "Decisions" },
  { key: "reports", label: "Reports" },
];

export default function OperationsDashboardPage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDashboard() {
    if (!workspaceId.trim()) {
      setError("Workspace ID is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/operations/dashboard?workspaceId=${encodeURIComponent(
          workspaceId.trim()
        )}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load dashboard.");
      }

      setData(result);
    } catch (loadError) {
      setError(loadError.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

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
            Role-aware operational overview for employees, tasks, urgent
            issues, decisions, and reports.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <label className="text-sm font-medium text-slate-200">
            Workspace ID
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
              placeholder="Paste workspace ID"
              className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
            />
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load Dashboard"}
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </div>

        {data ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Current Role</p>
              <p className="mt-1 text-2xl font-semibold capitalize">
                {data.role?.replaceAll("_", " ")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {cards.map((card) => (
                <div
                  key={card.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="mt-3 text-4xl font-semibold">
                    {data.metrics?.[card.key] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
