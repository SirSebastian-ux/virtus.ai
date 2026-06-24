"use client";

import { useEffect, useState } from "react";

const metricLabels = [
  ["activeEmployees", "Employees"],
  ["openTasks", "Open Tasks"],
  ["overdueTasks", "Overdue"],
  ["urgentIssues", "Urgent"],
  ["criticalIssues", "Critical"],
  ["pendingDecisions", "Decisions"],
  ["todayReports", "Reports Today"],
];

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
      No department intelligence available yet.
    </div>
  );
}

export default function DepartmentIntelligencePage() {
  const [departments, setDepartments] = useState([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadDepartments() {
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
          `/api/operations/department-intelligence?workspaceId=${encodeURIComponent(
            nextWorkspaceId
          )}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load department intelligence.");
        }

        if (alive) {
          setWorkspaceId(nextWorkspaceId);
          setDepartments(result.departments || []);
        }
      } catch (loadError) {
        if (alive) setError(loadError.message);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadDepartments();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Department Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Department Health & Risk
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Department-level visibility into health score, workload pressure,
            urgent issues, overdue work, pending decisions, and daily reporting.
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

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-400">
              Loading department intelligence...
            </div>
          ) : departments.length === 0 ? (
            <EmptyState />
          ) : (
            departments.map((department) => (
              <section
                key={department.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">{department.name}</h2>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">
                      Risk Level: {department.riskLevel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 text-center">
                    <p className="text-sm text-slate-400">Health Score</p>
                    <p className="mt-2 text-4xl font-semibold">
                      {department.healthScore}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                  {metricLabels.map(([key, label]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-100">
                        {department[key] ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
