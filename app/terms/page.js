import Link from "next/link";

export const metadata = {
  title: "Terms of Use | Virtus AI",
  description: "The basic terms for using Virtus AI as an AI coaching and self-mastery platform.",
};

export default function Page() {
  return (
    <main className="min-h-screen virtus-theme-page px-6 py-12 text-zinc-100">
      <section className="mx-auto max-w-4xl rounded-3xl border border-sky-900/25 bg-zinc-950/75 p-8 shadow-sm shadow-sky-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/70">
          Virtus AI
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          Terms of Use
        </h1>

        <p className="mt-3 text-sm leading-7 text-zinc-400">
          The basic terms for using Virtus AI as an AI coaching and self-mastery platform.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-white">Use of the service</h2>
            <p className="mt-2">Virtus AI provides AI-supported reflection, coaching structure, personal development tools, file tools, projects, and guided practices. The service is not a replacement for emergency support, medical care, legal advice, or financial advice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Accounts and access</h2>
            <p className="mt-2">Users are responsible for maintaining access to their account and using Virtus AI responsibly. Paid access is controlled by Stripe billing and verified subscription events.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Acceptable use</h2>
            <p className="mt-2">Users must not attempt to bypass plan limits, access admin tools, misuse files, overload the service, or use the product for harmful, unlawful, or abusive activity.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">AI limitations</h2>
            <p className="mt-2">AI responses may be incomplete or imperfect. Users remain responsible for their choices and should verify important information before acting on it.</p>
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
