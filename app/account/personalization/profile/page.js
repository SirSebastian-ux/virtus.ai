import VirtusInteriorHeader from "../../../components/VirtusInteriorHeader";
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
    <main className="virtus-interior min-h-screen virtus-theme-page">
      <AppearanceSync />
      <div className="virtus-interior-shell narrow virtus-interior-subpage">
        <VirtusInteriorHeader title="Your Profile" description="Manage the information Virtus uses to recognize your background and preferences." backHref="/account/personalization" backLabel="All personalization settings" />

        <div className="virtus-theme-surface virtus-interior-panel rounded-3xl border border-sky-900/20 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
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
            className="virtus-interior-back"
          >
            Back to personalization
          </Link>
        </div>
      </div>
    </main>
  );
}