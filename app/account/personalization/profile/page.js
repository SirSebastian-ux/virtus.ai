import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import ProfileForm from "./ProfileForm";
import AppearanceSync from "../../AppearanceSync";

export default async function PersonalizationProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("nickname, occupation, about, preferences")
      .eq("id", user.id)
      .maybeSingle();

    profile = data || null;
  }

  return (
    <main className="min-h-screen virtus-theme-page">
      <AppearanceSync />
      <div className="mx-auto w-full max-w-5xl px-8 py-10">
        <div className="virtus-theme-surface mb-8 rounded-3xl border border-sky-900/20 px-6 py-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-300/50">
            Virtus AI
          </p>

          <h1 className="mt-3 text-3xl font-semibold virtus-theme-title">
            Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 virtus-theme-muted">
            Personal profile settings for how Virtus knows and addresses you.
          </p>
        </div>

        <div className="virtus-theme-surface rounded-3xl border border-sky-900/20 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
          <ProfileForm
            initialNickname={profile?.nickname || ""}
            initialOccupation={profile?.occupation || ""}
            initialAbout={profile?.about || ""}
            initialPreferences={profile?.preferences || ""}
          />
        </div>

        <div className="mt-8">
          <Link
            href="/account/personalization"
            className="inline-flex items-center rounded-2xl border border-sky-900/30 bg-sky-950/10 px-4 py-2 text-sm text-sky-700 transition hover:border-sky-800/40 hover:bg-sky-950/15"
          >
            Back to personalization
          </Link>
        </div>
      </div>
    </main>
  );
}