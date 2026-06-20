export default function OperationsPage() {
  const sections = [
    {
      title: "Company Setup",
      description: "Register the company workspace, departments, roles, and reporting rules.",
      href: "/operations/company",
    },
    {
      title: "Employees",
      description: "Invite employees, assign roles, and open individual employee profiles.",
      href: "/operations/employees",
    },
    {
      title: "Operations Chat",
      description: "Employees report payments, tasks, meetings, urgent issues, and daily activity.",
      href: "/operations/chat",
    },
    {
      title: "Tasks",
      description: "Track new tasks, pending work, deadlines, approvals, and blocked items.",
      href: "/operations/tasks",
    },
    {
      title: "Payments",
      description: "Record client payments, methods, proof, references, and confirmation status.",
      href: "/operations/payments",
    },
    {
      title: "Reports",
      description: "Review daily summaries, completed work, delays, and management notes.",
      href: "/operations/reports",
    },
    {
      title: "Admin Dashboard",
      description: "See AI summaries, urgent alerts, decision queue, and company performance.",
      href: "/operations/admin",
    },
    {
      title: "Decision Queue",
      description: "Review approvals, escalations, payment confirmations, and blocked items.",
      href: "/operations/decisions",
    },
    {
      title: "Urgent Issues",
      description: "Track operational risks, escalations, blocked work, and urgent employee reports.",
      href: "/operations/urgent",
    },
    {
      title: "Daily Report",
      description: "Review daily company activity, completed work, follow-ups, and AI summaries.",
      href: "/operations/daily-report",
    },
  ];

  return (
    <section className="px-6 py-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-300/60">
          Virtus AI
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-white">
          Operations Intelligence
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Transform daily employee updates into structured management intelligence:
          payments, tasks, urgent issues, reports, decisions, and AI summaries.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5 transition hover:border-sky-700/50 hover:bg-zinc-900"
            >
              <h2 className="text-lg font-semibold text-sky-100">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{section.description}</p>
            </a>
          ))}
        </div>
    </section>
  );
}


