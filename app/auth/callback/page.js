"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    supabase.auth.getSession().then(() => {
      const params = new URLSearchParams(window.location.search);
      const nextFromUrl = params.get("next") || "";
      const nextFromStorage = localStorage.getItem("virtus_login_next") || "";
      const next = nextFromUrl || nextFromStorage || "/";
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

      localStorage.removeItem("virtus_login_next");
      router.replace(safeNext);
    });
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-white">
      Confirming your account...
    </div>
  );
}
