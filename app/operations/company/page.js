export default function OperationsCompanyPage() {
  const departments = [
    "Administration",
    "Finance",
    "Operations",
    "Sales",
    "Marketing",
    "Creative",
  ];

  const reportingRules = [
    "Payments received",
    "New tasks",
    "Pending tasks",
    "Urgent issues",
    "Appointments and sessions",
    "Workshop needs",
    "End-of-day summary",
    "Items needing owner or manager decision",
  ];

  return (
    <section className="px-6 py-8">        <div className="mt-6 rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
            Company Workspace
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-white">
            Company Setup
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            This section will let each company owner create a workspace, define departments,
            invite employees, assign roles, and configure operational reporting rules.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5">
              <h2 className="text-lg font-semibold text-sky-100">Workspace Owner</h2>
              <p className="mt-2 text-sm text-zinc-300">Loaded from signed-in owner account</p>
              <p className="mt-1 text-xs text-zinc-500">Role: Owner / Admin</p>
            </div>

            <div className="rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5">
              <h2 className="text-lg font-semibold text-sky-100">Employee Invitations</h2>
              <p className="mt-2 text-sm text-zinc-300">Invite employees by email</p>
              <p className="mt-1 text-xs text-zinc-500">Roles: Employee, Manager, Admin</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5">
            <h2 className="text-lg font-semibold text-sky-100">Departments</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((department) => (
                <div key={department} className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300">
                  {department}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5">
            <h2 className="text-lg font-semibold text-sky-100">Employee Reporting Rules</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {reportingRules.map((rule) => (
                <div key={rule} className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300">
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
    </section>
  );
}

