"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const emptyMetrics = {
  activeAlerts: 0,
  criticalAlerts: 0,
  highAlerts: 0,
  openAlerts: 0,
};

const statusOptions = ["open", "acknowledged", "investigating", "resolved", "closed"];
const severityOptions = ["low", "medium", "high", "critical"];

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

function statusClass(status) {
  if (["resolved", "closed"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (status === "investigating") return "bg-blue-50 text-blue-700";
  if (status === "acknowledged") return "bg-violet-50 text-violet-700";
  return "bg-red-50 text-red-700";
}

export default function ManagementAlertsPage() {
  const [workspaceId, setWorkspaceId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("virtus_operations_workspace_id") || "";
  });
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [accessContext, setAccessContext] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    severity: "medium",
    alertType: "manual_alert",
  });

  const groupedAlerts = useMemo(() => {
    return {
      critical: alerts.filter((alert) => alert.severity === "critical" && !["resolved", "closed"].includes(alert.status)),
      high: alerts.filter((alert) => alert.severity === "high" && !["resolved", "closed"].includes(alert.status)),
      active: alerts.filter((alert) => !["critical", "high"].includes(alert.severity) && !["resolved", "closed"].includes(alert.status)),
      resolved: alerts.filter((alert) => ["resolved", "closed"].includes(alert.status)),
    };
  }, [alerts]);

  async function loadAlerts(targetWorkspaceId = workspaceId) {
    const cleanWorkspaceId = String(targetWorkspaceId || "").trim();

    if (!cleanWorkspaceId) {
      setStatusMessage("Enter a workspace ID to load management alerts.");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch(`/api/operations/management-alerts?workspaceId=${encodeURIComponent(cleanWorkspaceId)}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load management alerts.");
      }

      setAlerts(payload.alerts || []);
      setMetrics(payload.metrics || emptyMetrics);
      setAccessContext(payload.accessContext || null);
    } catch (error) {
      setStatusMessage(error.message);
      setAlerts([]);
      setMetrics(emptyMetrics);
    } finally {
      setLoading(false);
    }
  }

  async function createAlert(event) {
    event.preventDefault();

    const cleanWorkspaceId = workspaceId.trim();

    if (!cleanWorkspaceId || !form.title.trim() || !form.message.trim()) {
      setStatusMessage("Workspace ID, title, and message are required.");
      return;
    }

    setCreating(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/operations/management-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: cleanWorkspaceId,
          title: form.title,
          message: form.message,
          severity: form.severity,
          alertType: form.alertType,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to create management alert.");
      }

      setForm({
        title: "",
        message: "",
        severity: "medium",
        alertType: "manual_alert",
      });
      setStatusMessage("Management alert created.");
      await loadAlerts(cleanWorkspaceId);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setCreating(false);
    }
  }

  async function updateAlert(alertId, status) {
    setStatusMessage("");

    try {
      const response = await fetch("/api/operations/management-alerts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alertId,
          status,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to update management alert.");
      }

      setStatusMessage("Management alert updated.");
      await loadAlerts();
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  useEffect(() => {
    if (workspaceId.trim()) {
      window.localStorage.setItem("virtus_operations_workspace_id", workspaceId.trim());
    }
  }, [workspaceId]);

  function AlertCard({ alert }) {
    return (
      <article className={`rounded-2xl border p-5 shadow-sm ${severityClass(alert.severity)}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">
                {formatLabel(alert.severity)}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(alert.status)}`}>
                {formatLabel(alert.status)}
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">
                {formatLabel(alert.alertType)}
              </span>
            </div>

            <h3 className="mt-3 text-lg font-semibold text-slate-950">{alert.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{alert.message}</p>

            <div className="mt-3 text-xs text-slate-500">
              {alert.departmentName ? `Department: ${alert.departmentName}` : "Company-level alert"} · Created{" "}
              {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "recently"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => updateAlert(alert.id, status)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                {formatLabel(status)}
              </button>
            ))}
          </div>
        </div>
      </article>
    );
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
                Management Alerts Engine
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
                Operational risk command center
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                Monitor critical issues, overdue work, pending decisions, missing reports, and management risks
                before they become executive failures.
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                loadAlerts();
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
                {loading ? "Loading..." : "Load Alerts"}
              </button>
            </form>
          </div>
        </header>

        {statusMessage ? (
          <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            {statusMessage}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Active Alerts", metrics.activeAlerts],
            ["Critical", metrics.criticalAlerts],
            ["High", metrics.highAlerts],
            ["Open", metrics.openAlerts],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={createAlert} className="rounded-3xl border border-white/10 bg-white/10 p-6">
            <h2 className="text-xl font-bold text-white">Create Manual Alert</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Use this when leadership identifies a risk before the automated alert engine detects it.
            </p>

            <div className="mt-5 space-y-4">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Alert title"
                className="w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-slate-950 outline-none"
              />

              <textarea
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Alert message"
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-slate-950 outline-none"
              />

              <select
                value={form.severity}
                onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-slate-950 outline-none"
              >
                {severityOptions.map((severity) => (
                  <option key={severity} value={severity}>
                    {formatLabel(severity)}
                  </option>
                ))}
              </select>

              <input
                value={form.alertType}
                onChange={(event) => setForm((current) => ({ ...current, alertType: event.target.value }))}
                placeholder="Alert type"
                className="w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-slate-950 outline-none"
              />

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Alert"}
              </button>
            </div>

            {accessContext ? (
              <p className="mt-4 text-xs text-slate-400">
                Current access: {formatLabel(accessContext.role)} · Scope: {formatLabel(accessContext.scopeType)}
              </p>
            ) : null}
          </form>

          <div className="space-y-5">
            {[
              ["Critical Alerts", groupedAlerts.critical],
              ["High Priority Alerts", groupedAlerts.high],
              ["Active Alerts", groupedAlerts.active],
              ["Resolved / Closed", groupedAlerts.resolved],
            ].map(([title, items]) => (
              <section key={title} className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">{title}</h2>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {items.length ? (
                    items.map((alert) => <AlertCard key={alert.id} alert={alert} />)
                  ) : (
                    <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                      No alerts in this section.
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}


