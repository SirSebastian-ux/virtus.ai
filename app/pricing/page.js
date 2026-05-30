import Link from "next/link";

export const metadata = {
  title: "Pricing | Virtus AI",
  description: "Virtus AI plan options and upgrade path.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen virtus-theme-page px-6 py-12 text-zinc-100">
      <section className="mx-auto max-w-5xl rounded-3xl border border-sky-900/25 bg-zinc-950/75 p-8 shadow-sm shadow-sky-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/70">
          Virtus AI
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          Pricing
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          Choose the level of support, memory, depth, and continuity that matches your current stage.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Free", "Entry support for basic AI reflection and saved account access."],
            ["Plus", "Deeper coaching support, stronger continuity, and expanded practice access."],
            ["Premium / Virtus Prime", "Highest depth for strategic coaching, projects, leadership, and transformation work."],
          ].map(([name, text]) => (
            <div key={name} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <h2 className="text-lg font-semibold text-white">{name}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/upgrade" className="inline-flex rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-sky-300">
            View plans and upgrade
          </Link>
        </div>
      </section>
    </main>
  );
}
