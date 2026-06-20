export default function OperationsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-300/60">
          Virtus AI
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-white">
          Operations Intelligence
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Manage company operations, employee reporting, payments, tasks, urgent issues,
          and AI-generated management intelligence.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5">
            <h2 className="text-lg font-semibold text-sky-100">Company Workspace</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Register Enhanced Wellness Solutions and manage departments, employees, and workflows.
            </p>
          </div>

          <div className="rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5">
            <h2 className="text-lg font-semibold text-sky-100">Employee Operations Chat</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Victoria can report payments, tasks, meetings, and urgent issues through a dedicated work chat.
            </p>
          </div>

          <div className="rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5">
            <h2 className="text-lg font-semibold text-sky-100">Admin Intelligence</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Sebastian can review employee activity, AI summaries, alerts, and decisions requiring approval.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
