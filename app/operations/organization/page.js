"use client";

import Link from "next/link";

const sections = [
  {
    title: "Company Profile",
    description: "Manage your company information and workspace settings.",
    href: "/operations/company",
  },
  {
    title: "Leadership Team",
    description: "Create leadership positions and assign responsible people.",
    href: "/operations/organization/leadership",
  },
  {
    title: "Team Members",
    description: "Add and manage employees and departments.",
    href: "/operations/employees",
  },
  {
    title: "Invitations",
    description: "Invite new members to join your organization.",
    href: "/operations/admin",
  },
  {
    title: "Roles & Permissions",
    description: "Manage access, roles and permission profiles.",
    href: "/operations/permissions",
  },
  {
    title: "Organization Structure",
    description: "View reporting relationships and hierarchy.",
    href: "/operations/structure",
  },
];

export default function OrganizationPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
      <header>
        <h1 className="text-3xl font-bold text-white">Organization</h1>
        <p className="mt-2 text-zinc-400">
          Manage your company&apos;s organizational structure from one place.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.href}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-white">
              {section.title}
            </h2>

            <p className="mt-3 text-sm text-zinc-400">
              {section.description}
            </p>

            <Link
              href={section.href}
              className="mt-6 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
            >
              Open
            </Link>
          </div>
        ))}
      </section>
    </main>
  );
}
