import VirtusInteriorHeader from "../components/VirtusInteriorHeader";
import Link from "next/link";

export const metadata = {
  title: "Support | Virtus AI",
  description: "Contact and help information for Virtus AI users.",
};

export default function Page() {
  return (
    <main className="virtus-interior min-h-screen virtus-theme-page">
      <div className="virtus-interior-shell narrow"><VirtusInteriorHeader title="Support" description="Help with your account, privacy, subscriptions and technical questions." backHref="/" backLabel="Return to Virtus" /><section className="virtus-interior-panel rounded-3xl p-8">
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
      </section></div>
    </main>
  );
}
