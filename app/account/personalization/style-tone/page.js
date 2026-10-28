import VirtusInteriorHeader from "../../../components/VirtusInteriorHeader";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import StyleToneForm from "./StyleToneForm";
import AppearanceSync from "../../AppearanceSync";

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
    <main className="virtus-interior min-h-screen virtus-theme-page">
      <AppearanceSync />

      <div className="virtus-interior-shell narrow virtus-interior-subpage">
        <VirtusInteriorHeader title="Style and Tone" description="Choose the communication style that suits you, from gentle coaching to strategic guidance." backHref="/account/personalization" backLabel="All personalization settings" />

        <div className="virtus-theme-surface virtus-interior-panel rounded-3xl border border-sky-900/20 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
          <StyleToneForm initialStyle={currentStyle} />
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