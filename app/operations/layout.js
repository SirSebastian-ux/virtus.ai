"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Overview", href: "/operations", metricKey: null },
  { label: "Company", href: "/operations/company", metricKey: null },
  { label: "Employees", href: "/operations/employees", metricKey: "activeEmployees" },
  { label: "Structure", href: "/operations/structure", metricKey: null },
  { label: "Operations Chat", href: "/operations/chat", metricKey: "todayReports" },
  { label: "Tasks", href: "/operations/tasks", metricKey: "openTasks" },
  { label: "Payments", href: "/operations/payments", metricKey: "pendingPayments" },
  { label: "Reports", href: "/operations/reports", metricKey: "todayReports" },
  { label: "Daily Report", href: "/operations/daily-report", metricKey: null },
  { label: "Urgent Issues", href: "/operations/urgent", metricKey: "openUrgentIssues" },
  { label: "Decision Queue", href: "/operations/decisions", metricKey: "pendingDecisions" },
  { label: "Admin Dashboard", href: "/operations/admin", metricKey: null },
];

export default function OperationsLayout({ children }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      try {
        const response = await fetch("/api/operations/metrics");
        const data = await response.json();

        if (!isMounted || !response.ok) return;

        setMetrics(data.metrics || null);
      } catch {}
    }

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-300/60">
            Virtus AI
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-white">
            Operations Intelligence
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Operational visibility, reporting, approvals, risks, payments, and AI management intelligence.
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-72 shrink-0 border-r border-zinc-800 xl:block">
          <nav className="p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const metricValue =
                  item.metricKey && metrics ? metrics[item.metricKey] : null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                  >
                    <span>{item.label}</span>

                    {typeof metricValue === "number" && metricValue > 0 ? (
                      <span className="ml-3 rounded-full border border-sky-800/50 bg-sky-950/50 px-2 py-0.5 text-xs font-semibold text-sky-100">
                        {metricValue}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

