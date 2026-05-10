import Link from "next/link";
import AppearanceSync from "../AppearanceSync";

function PersonalizationCard({ title, children }) {
  return (
    <section className="group virtus-theme-card flex items-center justify-between gap-6 rounded-3xl border border-sky-900/20 px-6 py-5 shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-sky-950/10">
      <div className="min-w-0">
        <h2 className="text-base font-semibold virtus-theme-title">{title}</h2>
        <div className="mt-2 text-sm leading-6 virtus-theme-muted">{children}</div>
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-900/30 bg-sky-950/20 text-sky-300/70 transition group-hover:bg-sky-900/35 group-hover:text-sky-200">
        &rsaquo;
      </div>
    </section>
  );
}

export default function PersonalizationPage() {
  return (
    <main className="min-h-screen virtus-theme-page">
      <AppearanceSync />
      <div className="mx-auto w-full max-w-5xl px-8 py-10">
<div className="virtus-theme-surface mb-8 rounded-3xl border border-sky-900/20 px-6 py-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
  <p className="text-xs uppercase tracking-[0.22em] text-sky-300/50">
    Virtus AI
  </p>

  <h1 className="mt-3 text-3xl font-semibold virtus-theme-title">
    Personalization
  </h1>

  <p className="mt-2 max-w-2xl text-sm leading-6 virtus-theme-muted">
    Shape how Virtus remembers, responds, and works with you.
  </p>
</div>

        <div className="space-y-3">
          <Link href="/account/personalization/style-tone">
            <PersonalizationCard title="Style and tone">
              Choose how Virtus responds: direct, balanced, gentle, strategic, or executive.
            </PersonalizationCard>
          </Link>

          <Link href="/account/personalization/custom-instructions">
            <PersonalizationCard title="Custom instructions">
              Add personal guidance for how Virtus should work with you.
            </PersonalizationCard>
          </Link>

          <Link href="/account/personalization/profile">
            <PersonalizationCard title="Profile">
              Nickname, occupation, background, interests, values, and preferences.
            </PersonalizationCard>
          </Link>

          <Link href="/account/personalization/memory">
            <PersonalizationCard title="Memory">
              Control how Virtus uses memory, chat history, and personal data.
            </PersonalizationCard>
          </Link>
          <Link href="/account/personalization/reasoning">
  <PersonalizationCard title="Reasoning discipline">
    Control how Virtus handles uncertainty, interpretation, and deeper psychological or spiritual claims.
  </PersonalizationCard>
</Link>
        </div>

        <div className="mt-8">
          <Link
            href="/account"
            className="inline-flex items-center rounded-2xl border border-sky-900/30 bg-sky-950/10 px-4 py-2 text-sm text-sky-700 transition hover:border-sky-800/40 hover:bg-sky-950/15"
          >
            Back to settings
          </Link>
        </div>
      </div>
    </main>
  );
}