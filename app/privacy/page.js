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
    <main className="min-h-screen bg-[#080b0b] px-4 py-12 text-[#eee9df] sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-9 border-b border-[#c9a66b]/25 pb-9">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d9b879]">Virtus AI · Trust &amp; Privacy</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#f5f0e5] sm:text-5xl">Privacy Policy</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#bdb8ad]">A clear explanation of how Virtus AI handles information used in coaching conversations, account services and the Android application.</p>
          <p className="mt-4 text-xs text-[#a59c8e]">Last updated: 1 November 2026</p>
        </header>

        <div className="rounded-[28px] border border-[#a98b58]/25 bg-[#101513] px-5 py-8 shadow-[0_18px_70px_rgba(0,0,0,0.35)] sm:px-10 sm:py-11">
          <div className="mb-9 rounded-2xl border border-[#d4ae6b]/25 bg-[#d4ae6b]/[0.05] p-5">
            <p className="text-sm leading-7 text-[#ded5c3]">Virtus AI is an AI-assisted personal development and coaching service. It is not a substitute for licensed clinical care or emergency assistance. This notice covers the Virtus AI website and its Android application.</p>
          </div>
          <div className="space-y-10">
            {sections.map((section, index) => (
              <section key={section.title} className="border-b border-[#d1b57b]/10 pb-9 last:border-0 last:pb-0">
                <div className="mb-4 flex items-start gap-4">
                  <span className="pt-1 text-xs font-semibold tabular-nums tracking-widest text-[#b99a64]">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="text-xl font-semibold tracking-tight text-[#e7c58a]">{section.title}</h2>
                </div>
                <div className="space-y-4 pl-9">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-8 text-[#cbc8bf] sm:text-[15px]">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <section className="mt-11 rounded-2xl border border-[#c9a66b]/30 bg-[#0b100e] p-6">
            <h2 className="text-xl font-semibold text-[#e7c58a]">Privacy questions or deletion requests</h2>
            <p className="mt-3 text-sm leading-7 text-[#cbc8bf]">For privacy questions, requests to access or delete personal information, or account-related assistance, contact the Virtus AI team through the support page. Please do not include passwords or sensitive coaching details in an initial request.</p>
            <Link href="/support" className="mt-5 inline-flex rounded-xl border border-[#d4ae6b]/60 px-5 py-3 text-sm font-semibold text-[#edcc8d] transition hover:bg-[#d4ae6b]/10">Contact support</Link>
          </section>
        </div>
        <footer className="mt-9 flex flex-wrap items-center justify-between gap-4 text-sm text-[#a99f8e]">
          <span>© Virtus AI · Enhanced Wellness Solutions</span>
          <Link href="/" className="text-[#d9b879] hover:text-[#f1d9a8]">Return to Virtus AI</Link>
        </footer>
      </div>
    </main>
  );
}
