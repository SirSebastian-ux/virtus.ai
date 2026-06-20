const decisionStats = [
  { label: "Pending Decisions", value: "0", note: "Awaiting manager action" },
  { label: "Approvals", value: "0", note: "Expense, payment, or work approvals" },
  { label: "Escalations", value: "0", note: "Items requiring leadership review" },
  { label: "Resolved Today", value: "0", note: "Completed management actions" },
];

const decisionTypes = [
  "Expense approval",
  "Payment confirmation",
  "Task ownership decision",
  "Urgent issue escalation",
  "Workshop or meeting approval",
  "Operational exception review",
];

export default function OperationsDecisionQueuePage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <section className="mx-auto max-w-7xl">
        <a href="/operations/admin" className="text-sm text-sky-300 hover:text-sky-200">
          Back to Admin Dashboard
        </a>

        <div className="mt-6 rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
            Management Action
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-white">Decision Queue</h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Central place for management approvals, escalations, confirmations, and operational
            decisions detected from employee reports and structured company activity.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {decisionStats.map((stat) => (
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
              <h2 className="text-lg font-semibold text-sky-100">Decision Categories</h2>

              <div className="mt-4 space-y-3">
                {decisionTypes.map((type) => (
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
              <h2 className="text-lg font-semibold text-sky-100">Future Workflow</h2>

              <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-400">
                <p>
                  When an employee report contains an approval request, blocked task, payment
                  confirmation need, or urgent issue, Virtus AI will create a structured decision
                  item for the correct manager or owner.
                </p>

                <p>
                  Each decision will carry workspace, department, employee, source report, audit
                  trail, priority level, due date, and resolution status.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
