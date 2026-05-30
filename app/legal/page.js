import Link from "next/link";

export const metadata = {
  title: "Legal Notice | Virtus AI",
  description: "Important legal, AI, billing, and service limitations for Virtus AI.",
};

export default function Page() {
  return (
    <main className="min-h-screen virtus-theme-page px-6 py-12 text-zinc-100">
      <section className="mx-auto max-w-4xl rounded-3xl border border-sky-900/25 bg-zinc-950/75 p-8 shadow-sm shadow-sky-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/70">
          Virtus AI
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          Legal Notice
        </h1>

        <p className="mt-3 text-sm leading-7 text-zinc-400">
          Important legal, AI, billing, and service limitations for Virtus AI.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-white">AI disclosure</h2>
            <p className="mt-2">Virtus AI uses artificial intelligence to generate responses, structure reflections, and support coaching-style interactions. AI output should be treated as supportive guidance, not absolute truth.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Wellness disclaimer</h2>
            <p className="mt-2">Virtus AI is designed for personal development, emotional discipline, leadership reflection, and self-mastery. It does not replace professional mental health care or emergency services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Billing</h2>
            <p className="mt-2">Paid plan activation, cancellation, and billing status are managed through Stripe checkout, Stripe billing portal, and verified webhook events.</p>
          </section>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <Link href="/" className="text-sm font-medium text-sky-300 hover:text-sky-200">
            Return to Virtus AI
          </Link>
        </div>
      </section>
    </main>
  );
}
