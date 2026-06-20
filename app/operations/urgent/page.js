const urgentStats = [
  { label: "Open Issues", value: "0", note: "Currently unresolved" },
  { label: "High Priority", value: "0", note: "Requires fast action" },
  { label: "Blocked Work", value: "0", note: "Tasks affected by issues" },
  { label: "Resolved Today", value: "0", note: "Closed urgent items" },
];

const issueTypes = [
  "Client escalation",
  "Operational blocker",
  "Payment dispute",
  "Employee support need",
  "Missed deadline risk",
  "Resource or material shortage",
];

export default function OperationsUrgentIssuesPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <section className="mx-auto max-w-7xl">
        <a href="/operations/admin" className="text-sm text-sky-300 hover:text-sky-200">
          Back to Admin Dashboard
        </a>

        <div className="mt-6 rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
            Operational Risk
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-white">Urgent Issues</h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Track high-priority operational risks, blocked work, escalations, and urgent
            employee reports that require manager visibility or immediate action.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {urgentStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-4"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{stat.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
              <h2 className="text-lg font-semibold text-sky-100">Issue Categories</h2>

              <div className="mt-4 space-y-3">
                {issueTypes.map((type) => (
                  <div
                    key={type}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300"
                  >
                    {type}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
              <h2 className="text-lg font-semibold text-sky-100">AI Escalation Logic</h2>

              <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-400">
                <p>
                  Virtus AI will classify urgent employee reports by severity, affected
                  department, business impact, required owner, and time sensitivity.
                </p>

                <p>
                  Serious issues will create management alerts, decision queue items, activity
                  logs, and dashboard signals so leadership can respond before the issue becomes
                  a larger operational failure.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
