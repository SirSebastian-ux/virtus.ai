import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import StyleToneForm from "./StyleToneForm";

export default async function StyleTonePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("response_style")
      .eq("id", user.id)
      .maybeSingle();

    profile = data || null;
  }

  const currentStyle = profile?.response_style || "default";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-8 py-10">
        <div className="mb-8 rounded-3xl border border-sky-900/20 bg-zinc-950/25 px-6 py-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-300/50">
            Virtus AI
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-sky-100">
            Style and Tone
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Choose how Virtus should respond to you.
          </p>
        </div>

        <div className="rounded-3xl border border-sky-900/20 bg-zinc-950/35 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
          <StyleToneForm initialStyle={currentStyle} />
        </div>

        <div className="mt-8">
          <Link
            href="/account/personalization"
            className="inline-flex items-center rounded-2xl border border-sky-900/30 bg-sky-950/20 px-4 py-2 text-sm text-sky-200 transition hover:border-sky-800/40 hover:bg-sky-950/35"
          >
            Back to personalization
          </Link>
        </div>
      </div>
    </main>
  );
}