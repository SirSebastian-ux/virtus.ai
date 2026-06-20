import Link from "next/link";

const navigation = [
  { label: "Overview", href: "/operations" },
  { label: "Company", href: "/operations/company" },
  { label: "Employees", href: "/operations/employees" },
  { label: "Operations Chat", href: "/operations/chat" },
  { label: "Tasks", href: "/operations/tasks" },
  { label: "Payments", href: "/operations/payments" },
  { label: "Reports", href: "/operations/reports" },
  { label: "Daily Report", href: "/operations/daily-report" },
  { label: "Urgent Issues", href: "/operations/urgent" },
  { label: "Decision Queue", href: "/operations/decisions" },
  { label: "Admin Dashboard", href: "/operations/admin" },
];

export default function OperationsLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-300/60">
            Virtus AI
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-white">
            Operations Intelligence
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Operational visibility, reporting, approvals, risks, payments, and AI management intelligence.
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-72 shrink-0 border-r border-zinc-800 xl:block">
          <nav className="p-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
