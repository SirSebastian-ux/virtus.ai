"use client";

import { useEffect, useState } from "react";

export default function OperationsChatPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [rawReport, setRawReport] = useState("");
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractingReportId, setExtractingReportId] = useState("");
  const [reviewingReportId, setReviewingReportId] = useState("");
  const [error, setError] = useState("");

  async function loadReports(workspaceId) {
    if (!workspaceId) return;

    const response = await fetch(
      `/api/operations/reports?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load reports.");
      setReports([]);
      return;
    }

    setReports(Array.isArray(data.reports) ? data.reports : []);
  }

  async function loadEmployees(workspaceId) {
    if (!workspaceId) return;

    const response = await fetch(
      `/api/operations/employees?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load employees.");
      setEmployees([]);
      setDepartments([]);
      return;
    }

    setEmployees(Array.isArray(data.employees) ? data.employees : []);
    setDepartments(Array.isArray(data.departments) ? data.departments : []);
  }

  async function loadWorkspaceContext(workspaceId) {
    setIsLoading(true);
    setError("");
    setSelectedEmployeeId("");
    setSelectedDepartmentId("");

    await loadEmployees(workspaceId);
    await loadReports(workspaceId);

    setIsLoading(false);
  }

  async function handleWorkspaceChange(event) {
    const workspaceId = event.target.value;
    setSelectedWorkspaceId(workspaceId);
    await loadWorkspaceContext(workspaceId);
  }

  async function markReportReviewed(reportId) {
    setReviewingReportId(reportId);
    setError("");

    const response = await fetch("/api/operations/reports", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportId }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to mark report reviewed.");
    } else {
      await loadReports(selectedWorkspaceId);
    }

    setReviewingReportId("");
  }

  async function extractReport(reportId) {
    setExtractingReportId(reportId);
    setError("");

    const response = await fetch("/api/operations/reports/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportId }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to extract report.");
    } else {
      await loadReports(selectedWorkspaceId);
    }

    setExtractingReportId("");
  }

  async function submitReport(event) {
    event.preventDefault();

    if (!selectedWorkspaceId || !rawReport.trim()) {
      setError("Workspace and report text are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/operations/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId: selectedWorkspaceId,
        employeeId: selectedEmployeeId,
        departmentId: selectedDepartmentId,
        rawReport,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to submit report.");
    } else {
      setRawReport("");
      await loadReports(selectedWorkspaceId);
    }

    setIsSubmitting(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/operations/workspaces");
      const data = await response.json();

      if (!isMounted) return;

      if (!response.ok) {
        setError(data?.error || "Unable to load workspaces.");
        setWorkspaces([]);
        setIsLoading(false);
        return;
      }

      const loadedWorkspaces = Array.isArray(data.workspaces) ? data.workspaces : [];
      setWorkspaces(loadedWorkspaces);

      if (loadedWorkspaces.length > 0) {
        setSelectedWorkspaceId(loadedWorkspaces[0].id);
        await loadWorkspaceContext(loadedWorkspaces[0].id);
      } else {
        setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="px-6 py-8">
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
            Employee Operations Chat
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-white">
            Daily Work Reporting
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Store employee updates as structured operational reports. AI extraction
            into tasks, payments, urgent issues, and decisions comes next.
          </p>

          <form
            onSubmit={submitReport}
            className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={selectedWorkspaceId}
                onChange={handleWorkspaceChange}
                className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                {workspaces.length === 0 ? (
                  <option value="">No workspace available</option>
                ) : (
                  workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))
                )}
              </select>

              <select
                value={selectedEmployeeId}
                onChange={(event) => {
                  const employeeId = event.target.value;
                  setSelectedEmployeeId(employeeId);

                  const employee = employees.find((item) => item.id === employeeId);
                  setSelectedDepartmentId(employee?.departmentId || "");
                }}
                className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                <option value="">No employee selected</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>

              <select
                value={selectedDepartmentId}
                onChange={(event) => setSelectedDepartmentId(event.target.value)}
                className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500 md:col-span-2"
              >
                <option value="">No department selected</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 rounded-2xl bg-zinc-900/80 p-4 text-sm leading-6 text-zinc-300">
              Example: Today I received a client payment, scheduled two appointments,
              followed up on workshop materials, and need manager approval for a room booking.
            </div>

            <textarea
              value={rawReport}
              onChange={(event) => setRawReport(event.target.value)}
              className="mt-4 min-h-44 w-full resize-none rounded-2xl border border-sky-900/25 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-700/60"
              placeholder="Employee writes operations update here..."
            />

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting || !selectedWorkspaceId}
              className="mt-4 rounded-2xl border border-sky-800/50 bg-sky-950/40 px-5 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-900/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving Report..." : "Save Report"}
            </button>
          </form>
        </section>

        <aside className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <h2 className="text-lg font-semibold text-sky-100">Report History</h2>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <p className="text-sm text-zinc-400">Loading reports...</p>
            ) : reports.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
                No reports saved yet.
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                >
                  <p className="text-sm font-semibold text-sky-100">
                    {report.employeeName || "Unassigned employee"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {report.departmentName || "No department"} · {report.reportDate}
                  </p>

                  <p className="mt-2 inline-flex rounded-full border border-zinc-800 px-2 py-1 text-xs text-zinc-400">
                    {report.reviewStatus === "reviewed" ? "Reviewed" : "Unreviewed"}
                  </p>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-zinc-300">
                    {report.rawReport}
                  </p>

                  {report.aiSummary ? (
                    <div className="mt-3 rounded-xl border border-sky-900/30 bg-sky-950/20 p-3 text-xs leading-5 text-sky-100">
                      {report.aiSummary}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => extractReport(report.id)}
                      disabled={extractingReportId === report.id}
                      className="rounded-xl border border-sky-800/50 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-950/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {extractingReportId === report.id ? "Extracting..." : "Extract Items"}
                    </button>

                    {report.reviewStatus !== "reviewed" ? (
                      <button
                        type="button"
                        onClick={() => markReportReviewed(report.id)}
                        disabled={reviewingReportId === report.id}
                        className="rounded-xl border border-emerald-800/50 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-950/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reviewingReportId === report.id ? "Reviewing..." : "Mark Reviewed"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}



