import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("coaching_progress_reviews")
    .select("id,created_at,message_count,first_message_at,last_message_at,observations")
    .eq("user_id", user.id).order("created_at", { ascending: true }).limit(100);
  if (error) return NextResponse.json({ error: "Review history unavailable" }, { status: 500 });
  const { count: userMessageCount } = await supabase.from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id).eq("role", "user");
  return NextResponse.json({ reviews: data || [], activity: { userMessageCount: userMessageCount ?? null } },
    { headers: { "Cache-Control": "private, no-store" } });
}
