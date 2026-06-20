const reportStats = [
  { label: "Reports Submitted", value: "0", note: "Employee updates received" },
  { label: "Missing Reports", value: "0", note: "Expected reports not submitted" },
  { label: "Completed Work", value: "0", note: "Closed items from reports" },
  { label: "Follow-Ups", value: "0", note: "Items needing tomorrow action" },
];

const reportSections = [
  "Completed tasks",
  "Pending work",
  "Payments received",
  "Client activity",
  "Urgent issues",
  "Approvals requested",
  "Tomorrow priorities",
];

export default function OperationsDailyReportPage() {
  return (
    <section className="px-6 py-8">
      <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
            Daily Intelligence
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-white">Daily Report</h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Consolidated daily operational view generated from employee reports, task updates,
            payments, urgent issues, approvals, and AI summary logic.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {reportStats.map((stat) => (
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
              <h2 className="text-lg font-semibold text-sky-100">Report Structure</h2>

              <div className="mt-4 space-y-3">
                {reportSections.map((section) => (
                  <div
                    key={section}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300"
                  >
                    {section}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
              <h2 className="text-lg font-semibold text-sky-100">AI Daily Summary</h2>

              <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-400">
                <p>
                  Virtus AI will convert employee updates into a structured daily report showing
                  what happened, what was completed, what is blocked, what requires approval, and
                  what management should prioritize next.
                </p>

                <p>
                  Daily reports will connect to tasks, payments, urgent issues, decision queue,
                  employee activity logs, department visibility, and executive summaries.
                </p>
              </div>
            </section>
          </div>
      </div>
    </section>
  );
}

