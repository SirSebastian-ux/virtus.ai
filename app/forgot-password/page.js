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
    <main className="min-h-screen flex items-center justify-center bg-[#091b1c] px-5 py-12 text-[#f5f3ec]">
      <div className="w-full max-w-[480px] rounded-[2rem] border border-[#d8bd85]/25 bg-gradient-to-b from-[#173632] to-[#0b2422] p-7 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
        <div className="mb-6 flex flex-col items-center gap-2 border-b border-[#d8bd85]/15 pb-6"><img src="/virtus-premium-emblem.webp" alt="Virtus AI shield" width="78" height="78" className="h-[78px] w-[78px]" /><p className="font-serif text-2xl tracking-wider text-[#e8c985]">Virtus <span className="text-[#8ad5e6]">AI</span></p><p className="text-[10px] uppercase tracking-[0.2em] text-[#d8bd85]">By Enhanced Wellness Solutions</p></div>

        <h1 className="mt-3 text-3xl font-semibold virtus-theme-title">
          Reset password
        </h1>

        <p className="mt-2 mb-6 text-sm leading-6 virtus-theme-muted">
          Enter your email and we will send a secure password reset link if an account exists.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#0b211f]/65 rounded-2xl border border-[#d8bd85]/20 px-4 py-4 shadow-sm shadow-sky-950/10">
            <label className="block text-xs uppercase tracking-[0.18em] text-[#d8bd85]">
              Email
            </label>

            <input
              type="email"
              pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#081b1a] text-[#f5f3ec] placeholder:text-[#8daba5] focus:border-[#d8bd85] mt-3 w-full rounded-2xl border border-[#d8bd85]/30 px-4 py-3 text-sm outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border border-[#e0c58c] bg-[#d8bd85] py-3 text-sm font-semibold text-[#102623] transition hover:bg-[#f0d99d] disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {message ? (
          <p className="virtus-theme-card mt-4 rounded-2xl border border-[#d8bd85]/20 px-4 py-3 text-sm virtus-theme-title">
            {message}
          </p>
        ) : null}

        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-[#d8bd85] transition hover:text-[#f5e0aa]"
        >
          Return to sign in
        </Link>
      </div>
    </main>
  );
}
