const overviewCards = [
  { label: "Payments Today", value: "0", note: "Confirmed operational payments" },
  { label: "Completed Tasks", value: "0", note: "Tasks closed by employees" },
  { label: "Pending Tasks", value: "0", note: "Open work requiring follow-up" },
  { label: "Urgent Issues", value: "0", note: "High-priority operational risks" },
  { label: "Decision Queue", value: "0", note: "Approvals awaiting management" },
];

const intelligencePanels = [
  {
    title: "AI Executive Summary",
    body: "Once data is connected, Virtus AI will summarize daily activity, blocked work, payments, urgent issues, performance signals, and decisions requiring leadership attention.",
  },
  {
    title: "Operational Risk",
    body: "The system will identify overdue tasks, missing reports, unconfirmed payments, repeated delays, unresolved urgent issues, and abnormal activity patterns.",
  },
  {
    title: "Performance Intelligence",
    body: "Managers will see department activity, employee consistency, completed work, pending responsibilities, and recurring execution gaps.",
  },
];

const alertTypes = [
  "Unconfirmed payment received",
  "Task overdue or blocked",
  "Urgent issue reported",
  "Daily report missing",
  "Approval request pending",
  "Repeated delay pattern detected",
];

const decisionItems = [
  "Approve operational expense",
  "Assign owner to blocked task",
  "Review urgent issue escalation",
  "Confirm payment proof",
];

export default function OperationsAdminPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <section className="mx-auto max-w-7xl">
        <a href="/operations" className="text-sm text-sky-300 hover:text-sky-200">
          Back to Operations
        </a>

        <div className="mt-6 rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
            Operations Intelligence
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                Management overview for company activity, employee reporting, operational
                risks, decision requests, payment signals, and AI-generated executive insight.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-400">
              Status: <span className="text-sky-200">UI foundation ready</span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {overviewCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-4"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{card.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
              <h2 className="text-lg font-semibold text-sky-100">
                Management Intelligence
              </h2>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {intelligencePanels.map((panel) => (
                  <div
                    key={panel.title}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
                  >
                    <h3 className="text-sm font-semibold text-white">{panel.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{panel.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
              <h2 className="text-lg font-semibold text-sky-100">Management Alerts</h2>
              <div className="mt-4 space-y-3">
                {alertTypes.map((alert) => (
                  <div
                    key={alert}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300"
                  >
                    {alert}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-sky-100">Decision Queue</h2>
                <a href="/operations/decisions" className="text-sm text-sky-300 hover:text-sky-200">
                  Open queue
                </a>
              </div>

              <div className="mt-4 space-y-3">
                {decisionItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
              <h2 className="text-lg font-semibold text-sky-100">System Flow</h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                <p>Employee report → AI extraction → structured records</p>
                <p>Records → tasks, payments, urgent issues, reports</p>
                <p>Reports → alerts, decision queue, dashboard summary</p>
                <p>Dashboard → manager action and executive visibility</p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
