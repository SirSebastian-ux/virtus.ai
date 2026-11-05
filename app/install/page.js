import Link from "next/link";
import InstallClient from "./InstallClient";

export const metadata = {
  title: "Install Virtus AI on Android or iPhone | Life Coach, Trainer & Mentor",
  description: "Install Virtus AI directly from the official website on Android or iPhone. No Google Play download needed. Step-by-step instructions for your home screen.",
  alternates: { canonical: "https://virtusaiworld.com/install" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Install Virtus AI directly",
    description: "Your AI life coach, trainer and mentor. Add Virtus AI to your phone from the official website.",
    url: "https://virtusaiworld.com/install",
    siteName: "Virtus AI",
    type: "website",
  },
};

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-[#061514] px-4 py-8 text-[#f6f2e8] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 flex items-center justify-between gap-3" aria-label="Install page">
          <Link href="/" className="font-serif text-xl tracking-wide text-[#f2d393]">Virtus AI</Link>
          <Link href="/" className="text-sm text-[#e9c983] underline underline-offset-4">Return to coaching</Link>
        </nav>
        <InstallClient />
        <footer className="mt-10 border-t border-[#d8bd85]/20 pt-6 text-center text-xs text-[#b4c8bf]">
          By Enhanced Wellness Solutions · Personal development and coaching, not emergency or medical care.
        </footer>
      </div>
    </main>
  );
}
