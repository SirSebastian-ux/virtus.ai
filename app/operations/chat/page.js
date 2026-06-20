export default function OperationsChatPage() {
  const extractedItems = [
    "Payments detected from employee message",
    "Tasks and completed work extracted",
    "Urgent issues separated for management",
    "Missing details flagged for follow-up",
  ];

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <section className="mx-auto max-w-6xl">
        <a href="/operations" className="text-sm text-sky-300 hover:text-sky-200">
          Back to Operations
        </a>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
              Employee Operations Chat
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-white">
              Daily Work Reporting
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Employees type what happened during the day. Virtus AI converts the message
              into structured payments, tasks, urgent issues, meetings, and management alerts.
            </p>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Example employee message
              </p>

              <div className="mt-4 rounded-2xl bg-zinc-900/80 p-4 text-sm leading-6 text-zinc-300">
                Today I received a client payment, scheduled two appointments, followed up
                on pending workshop materials, and need manager approval for a room booking.
              </div>

              <textarea
                className="mt-4 min-h-40 w-full resize-none rounded-2xl border border-sky-900/25 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-700/60"
                placeholder="Employee writes operations update here..."
              />

              <button className="mt-4 rounded-2xl border border-sky-800/50 bg-sky-950/40 px-5 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-900/40">
                Analyze Update
              </button>
            </div>
          </section>

          <aside className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold text-sky-100">AI Extraction Preview</h2>

            <div className="mt-4 space-y-3">
              {extractedItems.map((item) => (
                <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
