"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
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
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://virtusaiworld.com/update-password",
      });

      setMessage(
        "If an account exists for this email, a password reset link has been sent."
      );
      setEmail("");
    } catch (error) {
      setMessage(
        "If an account exists for this email, a password reset link has been sent."
      );
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
          Reset password
        </h1>

        <p className="mt-2 mb-6 text-sm leading-6 virtus-theme-muted">
          Enter your email and we will send a secure password reset link if an account exists.
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border border-sky-900/30 bg-sky-950/30 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-800/40 hover:bg-sky-900/35 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {message ? (
          <p className="virtus-theme-card mt-4 rounded-2xl border border-sky-900/20 px-4 py-3 text-sm virtus-theme-title">
            {message}
          </p>
        ) : null}

        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-sky-300/70 transition hover:text-sky-200"
        >
          Return to sign in
        </Link>
      </div>
    </main>
  );
}
