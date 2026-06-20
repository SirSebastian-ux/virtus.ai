export default function OperationsTasksPage() {
  const taskStatuses = [
    "Not started",
    "In progress",
    "Completed",
    "Waiting for response",
    "Needs approval",
    "Overdue",
  ];

  const taskFields = [
    "Task description",
    "Assigned by",
    "Assigned to",
    "Time assigned",
    "Action taken",
    "Status",
    "Deadline",
    "Reason for delay",
    "Support needed",
    "Approval needed",
  ];

  return (
    <section className="px-6 py-8">        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
              Accountability System
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-white">Tasks</h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Track assigned work, pending tasks, delayed items, approvals, deadlines,
              and support required by employees.
            </p>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <h2 className="text-lg font-semibold text-sky-100">Task Statuses</h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {taskStatuses.map((status) => (
                  <div key={status} className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300">
                    {status}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold text-sky-100">Task Record Structure</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {taskFields.map((field) => (
                <div key={field} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <p className="text-sm text-zinc-300">{field}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
              <h3 className="text-sm font-semibold text-red-200">Management Alerts</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                The system should flag overdue tasks, repeated delays, blocked work,
                and tasks waiting for owner or manager approval.
              </p>
            </div>
          </section>
        </div>
    </section>
  );
}

