export default function OperationsReportsPage() {
  const reportSections = [
    "Daily activity summary",
    "Completed work",
    "Uncompleted work",
    "Payments summary",
    "Pending tasks",
    "Urgent issues",
    "Biggest challenge",
    "Priority for tomorrow",
    "Management notes",
  ];

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <section className="mx-auto max-w-6xl">
        <a href="/operations" className="text-sm text-sky-300 hover:text-sky-200">
          Back to Operations
        </a>

        <div className="mt-6 rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
            Management Reporting
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-white">Reports</h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Reports convert employee updates into management-readable daily summaries,
            operational risks, decisions needed, and follow-up priorities.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reportSections.map((section) => (
              <div key={section} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-sm text-zinc-300">{section}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-sky-100">AI Daily Summary Example</h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              The AI summary will be generated from structured company data, not from guesswork.
              It should explain what happened, what is pending, what is urgent, what needs approval,
              and what management should focus on next.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
