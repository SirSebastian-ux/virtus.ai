export default function OperationsEmployeesPage() {
  const employeeCards = [
    {
      title: "Owner / Admin",
      description: "The company owner has full access to workspace setup, reports, payments, decisions, employees, and AI summaries.",
      access: "Full company access",
    },
    {
      title: "Manager",
      description: "Managers can monitor teams, review reports, assign tasks, and approve selected operational actions.",
      access: "Department or team access",
    },
    {
      title: "Employee",
      description: "Employees can submit work updates, record payments, report urgent issues, and complete assigned tasks.",
      access: "Personal reporting access",
    },
  ];

  return (
    <section className="px-6 py-8">        <h1 className="mt-6 text-3xl font-semibold text-white">Employees</h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Invite employees, assign roles, and open individual operational profiles.
          Actual users will be loaded from the company workspace database.
        </p>

        <div className="mt-8 grid gap-4">
          {employeeCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-sky-900/25 bg-zinc-900/60 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-sky-100">{card.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{card.description}</p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-sm text-zinc-300">{card.access}</p>
                  <p className="mt-1 text-xs text-sky-300/70">Role-based permissions</p>
                </div>
              </div>
            </div>
          ))}
        </div>
    </section>
  );
}

