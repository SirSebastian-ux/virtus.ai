import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const FALLBACK_ADMIN_EMAILS = ["sebastian@ewellnessolutions.com"];

function getConfiguredAdminEmails() {
  const rawEmails = process.env.VIRTUS_ADMIN_EMAILS || "";

  const configuredEmails = rawEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return configuredEmails.length > 0
    ? configuredEmails
    : FALLBACK_ADMIN_EMAILS;
}

export function isAdminUser(user) {
  const email = String(user?.email || "").trim().toLowerCase();

  if (!email) return false;

  return getConfiguredAdminEmails().includes(email);
}

export async function requireAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  if (!isAdminUser(user)) {
    redirect("/");
  }

  return user;
}

export async function requireAdminApi() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      ),
    };
  }

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (!isAdminUser(user)) {
    return {
      user,
      response: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}
