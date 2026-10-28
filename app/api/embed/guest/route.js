import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

const COOKIE = "virtus_trial_device_id";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request) {
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (user) return NextResponse.json({ error: "Embedded preview is for guests only. Open Virtus AI World to continue." }, { status: 409 });
    const admin = createAdminClient();
    const rawCookie = request.cookies.get(COOKIE)?.value || "";
    const existing = UUID.test(rawCookie) ? rawCookie : null;
    let guestId = existing;
    let row = null;
    if (guestId) {
      const result = await admin.from("guest_access").select("guest_id,plan_status,trial_ends_at").eq("guest_id", guestId).maybeSingle();
      row = result.data;
    }
    if (!row) {
      guestId = crypto.randomUUID();
      const now = new Date();
      const ends = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const result = await admin.from("guest_access").insert({
        guest_id: guestId, plan: "trial_guest", plan_status: "trialing",
        trial_started_at: now.toISOString(), trial_ends_at: ends.toISOString(),
      }).select("guest_id,plan_status,trial_ends_at").single();
      if (result.error) throw result.error;
      row = result.data;
    }
    const response = NextResponse.json({ guestId, trialEndsAt: row.trial_ends_at, planStatus: row.plan_status }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(COOKIE, guestId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60*60*24*365 });
    return response;
  } catch (error) {
    console.error("EWS guest bootstrap failed", error?.message);
    return NextResponse.json({ error: "Trial Guest is temporarily unavailable." }, { status: 503 });
  }
}
