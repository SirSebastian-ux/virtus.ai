"use client";

import { useEffect, useState } from "react";

const metricCards = [
  ["activeEmployees", "Active Employees"],
  ["submittedReports", "Submitted Reports"],
  ["reviewedReports", "Reviewed Reports"],
  ["unreviewedReports", "Unreviewed Reports"],
  ["activeDepartments", "Active Departments"],
  ["departmentsMissingReports", "Departments Missing Reports"],
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function EmptyState({ message }) {
  return <p className="text-sm text-slate-500">{message}</p>;
}

export default function DailyReportingPage() {
  const [dashboard, setDashboard] = useState(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [reportDate, setReportDate] = useState(todayIsoDate());
  const [rawReport, setRawReport] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadReporting(nextDate = reportDate) {
    try {
      setError("");
      setNotice("");
      setLoading(true);

      const metricsResponse = await fetch("/api/operations/metrics", {
        cache: "no-store",
      });

      const metricsResult = await metricsResponse.json();

      if (!metricsResponse.ok) {
        throw new Error(metricsResult.error || "Failed to load workspace.");
      }

      const nextWorkspaceId = metricsResult.metrics?.workspaceId || "";

      if (!nextWorkspaceId) {
        setWorkspaceId("");
        setDashboard(null);
        return;
      }

      const response = await fetch(
        `/api/operations/daily-reporting?workspaceId=${encodeURIComponent(
          nextWorkspaceId
        )}&reportDate=${encodeURIComponent(nextDate)}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load daily reporting.");
      }

      setWorkspaceId(nextWorkspaceId);
      setDashboard(result);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function initializeReporting() {
      await loadReporting(reportDate);
    }

    initializeReporting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitReport(event) {
    event.preventDefault();

    if (!rawReport.trim()) {
      setError("Write the daily report before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setNotice("");

      const response = await fetch("/api/operations/daily-reporting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          rawReport,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit report.");
      }

      setRawReport("");
      setNotice("Daily report submitted.");
      await loadReporting(reportDate);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function reviewReport(reportId, reviewStatus) {
    try {
      setReviewingId(reportId);
      setError("");
      setNotice("");

      const response = await fetch("/api/operations/daily-reporting", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          reviewStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to review report.");
      }

      setNotice("Report review status updated.");
      await loadReporting(reportDate);
    } catch (reviewError) {
      setError(reviewError.message);
    } finally {
      setReviewingId("");
    }
  }

  const metrics = dashboard?.metrics || {};
  const reports = dashboard?.reports || [];
  const missingDepartmentReports = dashboard?.missingDepartmentReports || [];
  const canReview = ["owner", "director", "senior_manager", "department_manager", "supervisor"].includes(
    dashboard?.accessContext?.role
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Daily Reporting
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Daily Reporting System
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Structured employee report submission, leadership review,
            reporting compliance, missing department detection, and daily
            management visibility.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-200">
            {notice}
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
            <label className="text-sm text-slate-400" htmlFor="report-date">
              Report Date
            </label>
            <div className="mt-2 flex gap-3">
              <input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => loadReporting(reportDate)}
                className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Load
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <form
          onSubmit={submitReport}
          className="rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <h2 className="text-xl font-semibold">Submit Daily Report</h2>
          <p className="mt-2 text-sm text-slate-400">
            Write the core work completed, pending work, blockers, urgent
            issues, decisions needed, and important communication.
          </p>

          <textarea
            value={rawReport}
            onChange={(event) => setRawReport(event.target.value)}
            rows={8}
            className="mt-5 w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none focus:border-cyan-400"
            placeholder="Example: Completed..., Pending..., Blockers..., Decisions needed..."
          />

          <button
            type="submit"
            disabled={submitting || !workspaceId}
            className="mt-4 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </form>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Submitted Reports</h2>
            <div className="mt-5 space-y-3">
              {reports.length === 0 ? (
                <EmptyState message="No reports found for this date." />
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-100">
                          {report.employeeName || "Unknown employee"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {report.departmentName || "No department"} ·{" "}
                          {report.reviewStatus}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          {report.aiSummary || report.rawReport}
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          Submitted: {formatDate(report.createdAt)}
                        </p>
                      </div>

                      {canReview ? (
                        <div className="flex flex-wrap gap-2">
                          {[
                            "supervisor_reviewed",
                            "manager_reviewed",
                            "approved",
                            "rejected",
                          ].map((status) => (
                            <button
                              key={status}
                              type="button"
                              disabled={reviewingId === report.id}
                              onClick={() => reviewReport(report.id, status)}
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {status.replaceAll("_", " ")}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Missing Department Reports</h2>
            <div className="mt-5 space-y-3">
              {missingDepartmentReports.length === 0 ? (
                <EmptyState message="No missing department reports detected." />
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
        </div>
      </section>
    </main>
  );
}

