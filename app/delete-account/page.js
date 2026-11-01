import Link from "next/link";

export const metadata = {
  title: "Delete Account & Data | Virtus AI",
  description: "How to request deletion of your Virtus AI account and associated personal data.",
};

const steps = [
  "Email support@virtusaiworld.com from the email address associated with your Virtus AI account.",
  'Use the subject line "Virtus AI account deletion request" and state that you want your account and associated personal data deleted.',
  "We may ask you to verify account ownership before acting on the request. Never send your password or sensitive coaching conversations by email.",
  "Our support team will review the request, arrange deletion of applicable account data, and explain any records that must be retained for legal, financial, security, or dispute-resolution obligations.",
];

export default function DeleteAccountPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06110f] px-4 py-8 text-[#f5f0df] sm:px-7 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_5%,rgba(5,83,66,0.48),transparent_60%),linear-gradient(145deg,#06110f_0%,#071a17_50%,#030b0a_100%)]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-5 rounded-[24px] border border-[#cda85f]/40 bg-gradient-to-br from-[#003d32] via-[#00291f] to-[#001b17] px-6 py-5">
          <Link href="/" className="flex items-center gap-4" aria-label="Virtus AI home">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e7bd69]/75 bg-[#072b28] text-3xl text-[#edc77a]" aria-hidden="true">✦</span>
            <span className="flex flex-col"><span className="font-serif text-2xl tracking-wide text-[#f0d09a]">Virtus AI</span><span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e0b66d]">By Enhanced Wellness Solutions</span></span>
          </Link>
          <Link href="/" className="rounded-full border border-[#d8ad5b]/70 bg-[#062e27] px-5 py-2.5 text-sm font-medium text-[#f1cb80] hover:bg-[#105043]">Return to Virtus AI</Link>
        </header>
        <div className="rounded-[30px] border border-[#d7b36b]/75 bg-gradient-to-b from-[#00372c] via-[#00281f] to-[#002119] p-[1px] shadow-[0_24px_85px_rgba(0,0,0,0.45)]">
          <div className="rounded-[29px] px-5 py-10 sm:px-12 sm:py-14">
            <header className="mx-auto mb-10 max-w-3xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#e9be70]">Virtus AI · Account & Privacy</p>
              <h1 className="mt-5 font-serif text-4xl text-[#f4d8a8] sm:text-6xl">Delete Your Account</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#d6e1d9]">Request deletion of your Virtus AI account and associated personal information, whether you use the Android app or the website.</p>
            </header>
            <div className="mx-auto max-w-4xl space-y-5">
              <section className="rounded-2xl border border-[#c7a05a]/35 bg-[#003027] p-6 sm:p-8">
                <h2 className="font-serif text-2xl text-[#f0cf96]">How to request account deletion</h2>
                <ol className="mt-5 space-y-4">
                  {steps.map((step, index) => <li key={step} className="flex gap-4 text-sm leading-7 text-[#d9e5dc]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d4aa61]/45 bg-[#06493b] text-[#edc47d]">{index + 1}</span><span>{step}</span></li>)}
                </ol>
                <a href="mailto:support@virtusaiworld.com?subject=Virtus%20AI%20account%20deletion%20request" className="mt-7 inline-flex rounded-xl border border-[#e5bb73] bg-[#06392f] px-6 py-3 text-sm font-semibold text-[#f4d49b] hover:bg-[#0b5b48]">Request account deletion by email</a>
                <p className="mt-3 text-xs leading-6 text-[#c4d2c9]">You can submit a request without signing in. We may require ownership verification before deleting an account.</p>
              </section>
              <section className="rounded-2xl border border-[#c7a05a]/35 bg-[#003027] p-6 sm:p-8">
                <h2 className="font-serif text-2xl text-[#f0cf96]">What data is covered?</h2>
                <p className="mt-3 text-sm leading-8 text-[#d9e5dc]">A verified deletion request covers the account and applicable associated data, including profile information, stored conversations, coaching reflections, saved preferences or memories, and uploaded files. Some records may need to be retained where required for billing, tax, fraud prevention, security, disputes, or other legal obligations. We will explain applicable exceptions when responding to your request.</p>
                <p className="mt-4 text-sm leading-8 text-[#d9e5dc]">Deleting your Virtus AI account does not necessarily cancel an external subscription or reverse previous payments. Contact support for billing assistance and follow any applicable subscription cancellation process.</p>
              </section>
              <section className="rounded-2xl border border-[#c7a05a]/35 bg-[#003027] p-6 sm:p-8">
                <h2 className="font-serif text-2xl text-[#f0cf96]">Questions or partial data deletion</h2>
                <p className="mt-3 text-sm leading-8 text-[#d9e5dc]">You may also contact support to ask about deleting specific conversations, files, or other personal information without closing your account. Availability depends on the type of data and applicable retention obligations. We will explain what can be removed.</p>
                <Link href="/privacy" className="mt-4 inline-block text-sm font-semibold text-[#f1cb80] underline underline-offset-4">Read the Privacy Policy</Link>
              </section>
            </div>
          </div>
        </div>
        <footer className="mt-7 flex flex-wrap items-center justify-between gap-4 px-2 text-xs text-[#b9c8b9]"><span>© Virtus AI · Enhanced Wellness Solutions</span><Link href="/support" className="text-[#e9c17b]">Support</Link></footer>
      </div>
    </main>
  );
}
