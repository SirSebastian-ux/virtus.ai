"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const supabase = createClient();

  function getSafeNextPath() {
    if (typeof window === "undefined") return "/";

    const params = new URLSearchParams(window.location.search);
    const nextFromUrl = params.get("next") || "";
    const nextFromStorage = localStorage.getItem("virtus_login_next") || "";
    const next = nextFromUrl || nextFromStorage || "/";

    if (!next.startsWith("/") || next.startsWith("//")) return "/";

    return next;
  }

  function rememberNextPath() {
    const next = getSafeNextPath();

    localStorage.setItem("virtus_login_next", next);

    return next;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function syncLoginAppearance() {
      const savedAppearance = localStorage.getItem("virtus_appearance");
      const nextAppearance = savedAppearance === "light" ? "light" : "dark";

      document.documentElement.setAttribute(
        "data-virtus-appearance",
        nextAppearance
      );
    }

    syncLoginAppearance();

    window.addEventListener("storage", syncLoginAppearance);
    window.addEventListener("focus", syncLoginAppearance);

    return () => {
      window.removeEventListener("storage", syncLoginAppearance);
      window.removeEventListener("focus", syncLoginAppearance);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(rememberNextPath())}`,
          },
        });

        if (error) {
          setMessage("Error: " + error.message);
        } else {
          setMessage("Account created. Check your email and confirm your account. After confirmation, Virtus will return you to the page you opened.");
          setEmail("");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
        } else {
          const guestId =
            typeof window !== "undefined"
              ? localStorage.getItem("virtus_guest_id")
              : null;

          if (guestId) {
            try {
              await fetch("/api/auth/claim-guest", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ guestId }),
              });

              localStorage.removeItem("virtus_guest_access");
              localStorage.removeItem("virtus_guest_recent_chats");
              localStorage.removeItem("virtus_guest_id");
              localStorage.removeItem("virtus_chat_id");
            } catch (claimError) {
              console.error("CLAIM GUEST ERROR:", claimError);
            }
          }

          const nextPath = rememberNextPath();

          setMessage("Signed in successfully.");
          localStorage.removeItem("virtus_login_next");
          window.location.href = nextPath;
        }
      }
    } catch (error) {
      setMessage("Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen virtus-theme-page flex items-center justify-center px-6">
      <div className="virtus-theme-surface w-full max-w-md rounded-3xl border border-sky-900/20 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-300/50">
          Virtus AI
        </p>

        <h1 className="mt-3 text-3xl font-semibold virtus-theme-title">
          {mode === "signup" ? "Create account" : "Sign in"}
        </h1>

        <p className="mt-2 mb-6 text-sm leading-6 virtus-theme-muted">
          Access Virtus AI with your personal account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="virtus-theme-card rounded-2xl border border-sky-900/20 px-4 py-4 shadow-sm shadow-sky-950/10">
            <label className="block text-xs uppercase tracking-[0.18em] text-sky-300/50">
              Email
            </label>
<input
  type="email"
  pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="virtus-theme-input mt-3 w-full rounded-2xl border border-sky-900/25 px-4 py-3 text-sm outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="virtus-theme-card rounded-2xl border border-sky-900/20 px-4 py-4 shadow-sm shadow-sky-950/10">
            <label className="block text-xs uppercase tracking-[0.18em] text-sky-300/50">
              Password
            </label>
            <div className="relative mt-3">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="virtus-theme-input w-full rounded-2xl border border-sky-900/25 px-4 py-3 pr-14 text-sm outline-none transition"
                placeholder="Enter password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-sky-300/70 transition hover:bg-sky-950/35 hover:text-sky-100"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                    <path d="M9.88 4.24A10.72 10.72 0 0 1 12 4c7 0 10 8 10 8a15.88 15.88 0 0 1-3.21 4.46" />
                    <path d="M6.61 6.61C3.98 8.36 2 12 2 12s3 8 10 8a10.84 10.84 0 0 0 5.39-1.39" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border border-sky-900/30 bg-sky-950/30 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-800/40 hover:bg-sky-900/35 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create account"
              : "Sign in"}
          </button>
        </form>

        {message ? (
          <p className="virtus-theme-card mt-4 rounded-2xl border border-sky-900/20 px-4 py-3 text-sm virtus-theme-title">
            {message}
          </p>
        ) : null}

        {mode === "login" ? (
          <a
            href="/forgot-password"
            className="mt-4 inline-block text-sm text-sky-300/70 transition hover:text-sky-200"
          >
            Forgot password?
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
          className="mt-6 text-sm text-sky-300/70 transition hover:text-sky-200"
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
