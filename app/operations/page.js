"use client";

import { useEffect, useState } from "react";

const actionCards = [
  {
    title: "Company Setup",
    description: "Workspace, departments, roles, and company structure.",
    href: "/operations/company",
  },
  {
    title: "Employees",
    description: "Manage employees, roles, departments, and active seats.",
    href: "/operations/employees",
  },
  {
    title: "Operations Chat",
    description: "Collect daily reports and extract operational intelligence.",
    href: "/operations/chat",
  },
  {
    title: "Reports",
    description: "Review employee reports, summaries, and extracted items.",
    href: "/operations/reports",
  },
  {
    title: "Tasks",
    description: "Track open work, completed work, blockers, and follow-ups.",
    href: "/operations/tasks",
  },
  {
    title: "Urgent Issues",
    description: "Monitor risks, escalations, blocked work, and serious issues.",
    href: "/operations/urgent",
  },
  {
    title: "Decision Queue",
    description: "Review decisions, approvals, and management escalations.",
    href: "/operations/decisions",
  },
  {
    title: "Payments",
    description: "Review payment records, confirmations, and pending money.",
    href: "/operations/payments",
  },
  {
    title: "Daily Report",
    description: "Company-wide activity summary and management overview.",
    href: "/operations/daily-report",
  },
];

const emptyMetrics = {
  activeEmployees: 0,
  todayReports: 0,
  openTasks: 0,
  openUrgentIssues: 0,
  pendingDecisions: 0,
  pendingPayments: 0,
};

export default function OperationsPage() {
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadMetrics() {
      try {
        const response = await fetch("/api/operations/metrics", {
          cache: "no-store",
        });
        const data = await response.json();

        if (alive && data?.metrics) {
          setMetrics({ ...emptyMetrics, ...data.metrics });
        }
      } catch (error) {
        console.error("Failed to load Operations metrics", error);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadMetrics();

    return () => {
      alive = false;
    };
  }, []);

  const summaryCards = [
    {
      label: "Active Employees",
      value: metrics.activeEmployees,
      description: "People currently active in this workspace.",
    },
    {
      label: "Unreviewed Reports Today",
      value: metrics.todayReports,
      description: "Reports requiring management review today.",
    },
    {
      label: "Open Tasks",
      value: metrics.openTasks,
      description: "Tasks not yet completed.",
    },
    {
      label: "Urgent Issues",
      value: metrics.openUrgentIssues,
      description: "Operational issues not yet resolved.",
    },
    {
      label: "Pending Decisions",
      value: metrics.pendingDecisions,
      description: "Items waiting for management approval.",
    },
    {
      label: "Pending Payments",
      value: metrics.pendingPayments,
      description: "Payments not yet confirmed.",
    },
  ];

  return (
    <section className="px-6 py-8">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-300/60">
        Owner / Director Dashboard
      </p>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            Operations Intelligence
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Company-wide control center for reports, employees, tasks, urgent
            issues, payments, decisions, and management follow-up.
          </p>
        </div>

        <a
          href="/operations/chat"
          className="inline-flex rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          Submit or Review Report
        </a>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-sky-900/25 bg-zinc-900/70 p-5"
          >
            <p className="text-sm text-zinc-400">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {loading ? "..." : card.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h2 className="text-lg font-semibold text-amber-100">
          Management Focus
        </h2>
        <p className="mt-2 text-sm leading-6 text-amber-100/70">
          Start each day by reviewing unreviewed reports, urgent issues, open
          tasks, and pending decisions. The owner dashboard must show the whole
          company first. Later, the same intelligence will be filtered for senior
          managers, department managers, supervisors, and employees.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white">Operational Areas</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Use these areas to manage the company structure and daily execution.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actionCards.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5 transition hover:border-sky-700/50 hover:bg-zinc-900"
            >
              <h3 className="text-lg font-semibold text-sky-100">
                {section.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {section.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
