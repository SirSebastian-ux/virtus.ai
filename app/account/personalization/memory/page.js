import VirtusInteriorHeader from "../../../components/VirtusInteriorHeader";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import MemoryForm from "./MemoryForm";
import AppearanceSync from "../../AppearanceSync";

export default async function MemoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("memory_enabled, chat_history_enabled, record_history_enabled")
      .eq("id", user.id)
      .maybeSingle();

    profile = data || null;
  }

  return (
    <main className="virtus-interior min-h-screen virtus-theme-page">
      <AppearanceSync />

      <div className="virtus-interior-shell narrow virtus-interior-subpage">
        <VirtusInteriorHeader title="Memory & Continuity" description="Control saved memory, conversation continuity, and the information Virtus remembers." backHref="/account/personalization" backLabel="All personalization settings" />

        <div className="virtus-theme-surface virtus-interior-panel rounded-3xl border border-sky-900/20 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
          <MemoryForm
            initialMemoryEnabled={profile?.memory_enabled ?? true}
            initialChatHistoryEnabled={profile?.chat_history_enabled ?? true}
            initialRecordHistoryEnabled={profile?.record_history_enabled ?? true}
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