import Link from "next/link";

export const metadata = {
  title: "Support | Virtus AI",
  description: "Contact and help information for Virtus AI users.",
};

export default function Page() {
  return (
    <main className="min-h-screen virtus-theme-page px-6 py-12 text-zinc-100">
      <section className="mx-auto max-w-4xl rounded-3xl border border-sky-900/25 bg-zinc-950/75 p-8 shadow-sm shadow-sky-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/70">
          Virtus AI
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          Support
        </h1>

        <p className="mt-3 text-sm leading-7 text-zinc-400">
          Contact and help information for Virtus AI users.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-white">Need help?</h2>
            <p className="mt-2">For account, billing, access, privacy, or technical questions, contact the Virtus AI team.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Suggested support email</h2>
            <p className="mt-2">support@virtusaiworld.com</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Billing support</h2>
            <p className="mt-2">Paid subscriptions are managed through Stripe. Logged-in users should use the billing portal where available.</p>
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
