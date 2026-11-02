import VirtusInteriorHeader from "../../components/VirtusInteriorHeader";
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
    <main className="virtus-interior min-h-screen virtus-theme-page">
      <AppearanceSync />
      <div className="virtus-interior-shell narrow virtus-interior-subpage">
<VirtusInteriorHeader title="Personalization" description="Choose how Virtus remembers, communicates, reasons, and works with you." backHref="/account" backLabel="Account settings" />

        <div className="virtus-personalization-list">
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
            className="virtus-interior-back"
          >
            Back to settings
          </Link>
        </div>
      </div>
    </main>
  );
}