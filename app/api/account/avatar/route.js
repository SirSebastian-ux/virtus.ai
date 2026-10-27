import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle();
  if (!profile?.avatar_path) return NextResponse.json({ url: null });
  const { data, error } = await supabase.storage.from("virtus-profile-photos").createSignedUrl(profile.avatar_path, 3600);
  if (error) return NextResponse.json({ error: "Photo unavailable" }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const photo = form.get("photo");
  if (!photo || typeof photo.arrayBuffer !== "function") return NextResponse.json({ error: "Select an image" }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size > 2097152 || photo.size < 100) return NextResponse.json({ error: "Use a JPEG, PNG, or WebP under 2 MB" }, { status: 400 });
  const bytes = new Uint8Array(await photo.arrayBuffer());
  const jpeg = photo.type === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = photo.type === "image/png" && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v);
  const webp = photo.type === "image/webp" && String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
  if (!(jpeg || png || webp)) return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
  const extension = jpeg ? "jpg" : png ? "png" : "webp";
  const path = user.id + "/avatar." + extension;
  const { error: uploadError } = await supabase.storage.from("virtus-profile-photos").upload(path, bytes, { contentType: photo.type, upsert: true });
  if (uploadError) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  const { error: profileError } = await createAdminClient().from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (profileError) return NextResponse.json({ error: "Profile update failed" }, { status: 500 });
  const { data: signed } = await supabase.storage.from("virtus-profile-photos").createSignedUrl(path, 3600);
  return NextResponse.json({ success: true, url: signed?.signedUrl || null });
}
