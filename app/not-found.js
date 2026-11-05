import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] bg-[#071614] px-5 py-16 text-[#f8f3e7]">
      <section className="mx-auto max-w-xl rounded-3xl border border-[#d8bd85]/55 bg-gradient-to-br from-[#0a4234] to-[#061c1a] p-8 text-center shadow-2xl sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#eac982]">Virtus AI · Navigation</p>
        <h1 className="mt-6 font-serif text-3xl text-[#fff1cb]">This link could not be opened.</h1>
        <p className="mt-4 text-sm leading-7 text-[#c8d9d1]">The page may have moved or the shared link may be incomplete. You can return to Virtus AI or use the official installation link below.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/install" className="rounded-xl bg-[#ebcd89] px-5 py-3 font-bold text-[#0a2a23]">Install Virtus AI</Link>
          <Link href="/" className="rounded-xl border border-[#e1c486]/50 px-5 py-3 font-semibold text-[#f4deac]">Open Virtus AI</Link>
        </div>
        <p className="mt-8 break-all text-xs text-[#bacfc5]">Official installation address: virtusaiworld.com/install</p>
      </section>
    </main>
  );
}
