import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Virtus AI",
  description: "Privacy information for Virtus AI coaching services, accounts, conversations, files and the Android application.",
};

const sections = [
  {
    title: "Information we process",
    paragraphs: [
      "When you use Virtus AI, we may process account identifiers and profile details, messages and coaching reflections you submit, conversation history, saved preferences and memory settings, uploaded documents, and information needed to provide subscriptions and customer support.",
      "The service may also process technical information needed for authentication, reliability, abuse prevention and troubleshooting, such as device or browser details, timestamps and service events. The information processed depends on the features you use.",
    ],
  },
  {
    title: "Why we process information",
    paragraphs: [
      "We use this information to operate your account, deliver AI-assisted coaching and conversations, maintain continuity when enabled, manage files and subscriptions, respond to support and privacy requests, protect the service, and investigate technical problems.",
      "Personal coaching conversations can include sensitive reflections. Please avoid submitting another person's confidential information without appropriate authorization.",
    ],
  },
  {
    title: "AI processing and service providers",
    paragraphs: [
      "Messages and other content submitted to AI features may be transmitted to the AI processing services used by Virtus AI to generate responses. Account and application services may involve infrastructure and authentication providers, including Supabase and Vercel. Website subscription payments are handled through Stripe where applicable.",
      "These providers process information to deliver their respective services under their own contractual and technical arrangements. We do not describe private coaching content as publicly accessible. Any optional use of conversation content for broader product improvement or model training must follow the choices and consent presented to users.",
    ],
  },
  {
    title: "Microphone, speech and uploaded files",
    paragraphs: [
      "If you choose a voice feature, the application may request microphone access to capture speech for that feature. You can deny or revoke microphone permission in Android settings. Depending on the feature, speech or a transcription may be processed to provide your requested interaction.",
      "Files you deliberately upload may be stored and processed to provide the requested functionality. Do not upload documents containing information you are not authorized to share.",
    ],
  },
  {
    title: "Billing and subscriptions",
    paragraphs: [
      "Subscription records may include plan selection, payment status and transaction references. Payment providers handle payment credentials according to their own policies. Availability of subscription purchasing and management may differ between the website and Android application.",
    ],
  },
  {
    title: "Retention, security and deletion",
    paragraphs: [
      "Information may be retained while needed to provide the service and for applicable security, dispute-resolution, financial or legal obligations. Retention depends on the record type; we do not promise a universal automatic deletion period.",
      "Account holders can manage available profile and personalization controls in the application. Certain uploaded files can be deleted using available file controls. For access, correction, account deletion or deletion of associated personal information, contact our support team through the Virtus AI support page. We will review the request, verify account ownership where necessary, and explain any information that must be retained for legal or security reasons.",
      "We use access controls and other technical safeguards to protect information, although no online service can guarantee absolute security.",
    ],
  },
  {
    title: "Your choices and rights",
    paragraphs: [
      "You can choose what information to share, manage available memory and personalization settings, and control device permissions. Depending on applicable law, you may have rights to request access, correction, deletion or restriction of processing. Contact support to exercise these rights.",
    ],
  },
  {
    title: "Children and changes",
    paragraphs: [
      "Virtus AI is designed for personal development and coaching, not as a service specifically directed to children. Age eligibility and any applicable parental requirements are governed by the service's registration terms.",
      "We may revise this policy when our features, providers or legal obligations change. Material changes will be reflected on this page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06110f] px-4 py-8 text-[#f5f0df] sm:px-7 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_5%,rgba(5,83,66,0.48),transparent_60%),linear-gradient(145deg,#06110f_0%,#071a17_50%,#030b0a_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30 [background:linear-gradient(155deg,transparent_0%,transparent_40%,rgba(9,91,71,0.25)_40.1%,transparent_62%)]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-5 rounded-[24px] border border-[#cda85f]/40 bg-gradient-to-br from-[#003d32] via-[#00291f] to-[#001b17] px-6 py-5 shadow-[0_16px_60px_rgba(0,0,0,0.32)] sm:px-9">
          <Link href="/" className="flex items-center gap-4" aria-label="Virtus AI home">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e7bd69]/75 bg-[#072b28] text-3xl text-[#edc77a] shadow-[inset_0_0_18px_rgba(230,185,98,0.16)]" aria-hidden="true">✦</span>
            <span className="flex flex-col">
              <span className="font-serif text-2xl tracking-wide text-[#f0d09a]">Virtus AI</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e0b66d]">By Enhanced Wellness Solutions</span>
            </span>
          </Link>
          <Link href="/" className="rounded-full border border-[#d8ad5b]/70 bg-[#062e27] px-5 py-2.5 text-sm font-medium text-[#f1cb80] transition hover:bg-[#105043]">Return to Virtus AI</Link>
        </header>

        <div className="rounded-[30px] border border-[#d7b36b]/75 bg-gradient-to-b from-[#00372c] via-[#00281f] to-[#002119] p-[1px] shadow-[0_24px_85px_rgba(0,0,0,0.45)]">
          <div className="rounded-[29px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(24,107,81,0.48),transparent_55%)] px-5 py-10 sm:px-12 sm:py-14">
            <header className="mx-auto mb-12 max-w-3xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#e9be70]">Virtus AI · Trust &amp; Privacy</p>
              <div className="mx-auto my-5 flex items-center justify-center gap-4 text-[#eec67d]" aria-hidden="true"><span className="h-px w-16 bg-[#d8b36c]/45" />✦<span className="h-px w-16 bg-[#d8b36c]/45" /></div>
              <h1 className="font-serif text-4xl leading-tight text-[#f4d8a8] sm:text-6xl">Privacy Policy</h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#d6e1d9]">A clear explanation of how Virtus AI handles information used in coaching conversations, account services and the Android application.</p>
              <p className="mt-5 text-xs text-[#d7b879]">Last updated: 1 November 2026</p>
            </header>

            <div className="mx-auto max-w-4xl">
              <div className="mb-8 rounded-2xl border border-[#d9b46a]/45 bg-[#00241e]/85 px-6 py-6 shadow-[inset_0_1px_18px_rgba(228,180,88,0.05)]">
                <p className="text-sm leading-8 text-[#f1e8d5]">Virtus AI is an AI-assisted personal development and coaching service. It is not a substitute for licensed clinical care or emergency assistance. This notice covers the Virtus AI website and its Android application.</p>
              </div>
              <div className="grid gap-4">
                {sections.map((section, index) => (
                  <section key={section.title} className="rounded-2xl border border-[#c7a05a]/35 bg-gradient-to-br from-[#00392e] to-[#00251f] px-5 py-6 shadow-[0_10px_28px_rgba(0,0,0,0.15)] sm:px-8">
                    <div className="mb-4 flex items-center gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d4aa61]/45 bg-[#06493b] text-xs font-semibold text-[#edc47d]">{String(index + 1).padStart(2, "0")}</span>
                      <h2 className="font-serif text-xl font-semibold text-[#f0cf96] sm:text-2xl">{section.title}</h2>
                    </div>
                    <div className="space-y-4 sm:pl-[52px]">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-sm leading-8 text-[#d9e5dc] sm:text-[15px]">{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <section className="mt-7 rounded-2xl border border-[#e1b66a]/65 bg-gradient-to-br from-[#064d3d] to-[#00271f] p-6 sm:p-8">
                <h2 className="font-serif text-2xl text-[#f3d19a]">Privacy questions or deletion requests</h2>
                <p className="mt-3 text-sm leading-8 text-[#e0e7dd]">For privacy questions, requests to access or delete personal information, or account-related assistance, contact the Virtus AI team through the support page. Please do not include passwords or sensitive coaching details in an initial request.</p>
                <Link href="/support" className="mt-5 inline-flex rounded-xl border border-[#e5bb73] bg-[#06392f] px-6 py-3 text-sm font-semibold text-[#f4d49b] transition hover:bg-[#0b5b48]">Contact support</Link>
              </section>
            </div>
          </div>
        </div>
        <footer className="mt-7 flex flex-wrap items-center justify-between gap-4 px-2 text-xs text-[#b9c8b9]">
          <span>© Virtus AI · Enhanced Wellness Solutions</span>
          <Link href="/" className="text-[#e9c17b] hover:text-[#ffe0a6]">Return to Virtus AI</Link>
        </footer>
      </div>
    </main>
  );
}
