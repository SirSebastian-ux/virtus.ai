"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

function getSafeInternalPath(value, origin) {
  if (typeof value !== "string") return null;

  const candidate = value.trim();

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.startsWith("/\\")
  ) {
    return null;
  }

  try {
    const url = new URL(candidate, origin);

    if (url.origin !== origin) return null;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const nextFromUrl = params.get("next");
    const nextFromStorage =
      window.localStorage.getItem("virtus_login_next");

    const safeNext =
      getSafeInternalPath(nextFromUrl, window.location.origin) ??
      getSafeInternalPath(nextFromStorage, window.location.origin) ??
      "/";

    const redirectToLogin = () => {
      if (cancelled) return;

      window.localStorage.setItem("virtus_login_next", safeNext);

      router.replace(
        `/login?next=${encodeURIComponent(safeNext)}`
      );
    };

    const completeAuthentication = async () => {
      let authenticationError = null;

      if (code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(code);

        authenticationError = error;
      } else {
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        );

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          authenticationError = error;
        }
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session || authenticationError || sessionError) {
        redirectToLogin();
        return;
      }

      window.localStorage.removeItem("virtus_login_next");
      router.replace(safeNext);
    };

    void completeAuthentication().catch(() => {
      redirectToLogin();
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-8 py-7 text-center shadow-2xl">
        <p className="text-sm text-zinc-400">
          Confirming your secure account session...
        </p>
      </div>
    </main>
  );
}