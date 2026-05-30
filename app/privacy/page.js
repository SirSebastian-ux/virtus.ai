import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Virtus AI",
  description: "How Virtus AI handles account data, conversations, files, memory, and product usage.",
};

export default function Page() {
  return (
    <main className="min-h-screen virtus-theme-page px-6 py-12 text-zinc-100">
      <section className="mx-auto max-w-4xl rounded-3xl border border-sky-900/25 bg-zinc-950/75 p-8 shadow-sm shadow-sky-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/70">
          Virtus AI
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          Privacy Policy
        </h1>

        <p className="mt-3 text-sm leading-7 text-zinc-400">
          How Virtus AI handles account data, conversations, files, memory, and product usage.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-white">What we collect</h2>
            <p className="mt-2">Virtus AI may process information you provide directly, including account details, chat messages, uploaded files, saved notes, memory preferences, and product settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">How we use information</h2>
            <p className="mt-2">We use information to provide AI coaching features, account access, memory controls, file tools, billing access, support, security, and product improvement.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">AI and sensitive content</h2>
            <p className="mt-2">Virtus AI may process personal reflections, coaching notes, and uploaded content. Users should avoid submitting information they do not want processed by the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">User control</h2>
            <p className="mt-2">Users can manage personalization and memory settings in their account area. Data export, deletion, and retention workflows will be expanded as the product matures.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="mt-2">For privacy or support questions, contact the Virtus AI team through the support page.</p>
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
