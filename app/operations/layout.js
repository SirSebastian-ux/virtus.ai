"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  canViewAdminModule,
  canViewCompanyModule,
  canViewDecisionQueueModule,
  canViewEmployeesModule,
  canViewPaymentsModule,
  canViewPermissionsModule,
  canViewReportsModule,
  canViewStructureModule,
  canViewTasksModule,
  canViewUrgentIssuesModule,
} from "@/lib/operations/access";

const navigation = [
  { label: "Overview", href: "/operations", metricKey: null, visible: () => true },
  { label: "Company", href: "/operations/company", metricKey: null, visible: canViewCompanyModule },
  { label: "Employees", href: "/operations/employees", metricKey: "activeEmployees", visible: canViewEmployeesModule },
  { label: "Structure", href: "/operations/structure", metricKey: null, visible: canViewStructureModule },
  { label: "Operations Chat", href: "/operations/chat", metricKey: "todayReports", visible: () => true },
  { label: "Tasks", href: "/operations/tasks", metricKey: "openTasks", visible: canViewTasksModule },
  { label: "Payments", href: "/operations/payments", metricKey: "pendingPayments", visible: canViewPaymentsModule },
  { label: "Reports", href: "/operations/reports", metricKey: "todayReports", visible: canViewReportsModule },
  { label: "Daily Report", href: "/operations/daily-report", metricKey: null, visible: () => true },
  { label: "Urgent Issues", href: "/operations/urgent", metricKey: "openUrgentIssues", visible: canViewUrgentIssuesModule },
  { label: "Decision Queue", href: "/operations/decisions", metricKey: "pendingDecisions", visible: canViewDecisionQueueModule },
  { label: "Permissions", href: "/operations/permissions", metricKey: null, visible: canViewPermissionsModule },
  { label: "Admin Dashboard", href: "/operations/admin", metricKey: null, visible: canViewAdminModule },
];

export default function OperationsLayout({ children }) {
  const [metrics, setMetrics] = useState(null);
  const [role, setRole] = useState("employee");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const metricsResponse = await fetch("/api/operations/metrics", {
          cache: "no-store",
        });

        const metricsData = await metricsResponse.json();

        if (!isMounted || !metricsResponse.ok) return;

        setMetrics(metricsData.metrics || null);

        const workspaceId = metricsData?.metrics?.workspaceId;

        if (!workspaceId) return;

        const accessResponse = await fetch(
          `/api/operations/access-context?workspaceId=${encodeURIComponent(
            workspaceId
          )}`,
          { cache: "no-store" }
        );

        const accessData = await accessResponse.json();

        if (
          isMounted &&
          accessResponse.ok &&
          accessData?.accessContext?.role
        ) {
          setRole(accessData.accessContext.role);
        }
      } catch {}
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleNavigation = useMemo(
    () => navigation.filter((item) => item.visible(role)),
    [role]
  );

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
              {visibleNavigation.map((item) => {
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
