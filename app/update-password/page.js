"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function UpdatePasswordPage() {

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    function syncLoginAppearance() {
      const savedAppearance = localStorage.getItem("virtus_appearance");
      const nextAppearance = savedAppearance === "light" ? "light" : "dark";

      document.documentElement.setAttribute(
        "data-virtus-appearance",
        nextAppearance
      );
    }

    async function preparePasswordResetSession() {
      syncLoginAppearance();

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage(
            "This reset link is invalid or has expired. Please request a new password reset link."
          );
          setReady(false);
          return;
        }

        window.history.replaceState({}, document.title, "/update-password");
      }

      setReady(true);
    }

    preparePasswordResetSession();

    window.addEventListener("storage", syncLoginAppearance);
    window.addEventListener("focus", syncLoginAppearance);

    return () => {
      window.removeEventListener("storage", syncLoginAppearance);
      window.removeEventListener("focus", syncLoginAppearance);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);

    if (password.length < 8) {
      setMessage("Please use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(
        "We could not update your password. Please request a new password reset link and try again."
      );
    } else {
      setPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setMessage("Your password has been updated successfully. You can now return to sign in.");
      await supabase.auth.signOut();
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#091b1c] px-5 py-12 text-[#f5f3ec]">
      <div className="w-full max-w-[480px] rounded-[2rem] border border-[#d8bd85]/25 bg-gradient-to-b from-[#173632] to-[#0b2422] p-7 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
        <div className="mb-6 flex flex-col items-center gap-2 border-b border-[#d8bd85]/15 pb-6"><img src="/virtus-aurum-emblem.svg" alt="Virtus AI shield" width="78" height="78" className="h-[78px] w-[78px]" /><p className="font-serif text-2xl tracking-wider text-[#e8c985]">Virtus <span className="text-[#8ad5e6]">AI</span></p><p className="text-[10px] uppercase tracking-[0.2em] text-[#d8bd85]">By Enhanced Wellness Solutions</p></div>

        <h1 className="mt-3 text-3xl font-semibold virtus-theme-title">
          Create new password
        </h1>

        <p className="mt-2 mb-6 text-sm leading-6 virtus-theme-muted">
          Choose a new password for your Virtus AI account.
        </p>

        {ready && !success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#0b211f]/65 rounded-2xl border border-[#d8bd85]/20 px-4 py-4 shadow-sm shadow-sky-950/10">
              <label className="block text-xs uppercase tracking-[0.18em] text-[#d8bd85]">
                New password
              </label>

              <div className="relative mt-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#081b1a] text-[#f5f3ec] placeholder:text-[#8daba5] focus:border-[#d8bd85] w-full rounded-2xl border border-[#d8bd85]/30 px-4 py-3 pr-14 text-sm outline-none transition"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[#d8bd85] transition hover:bg-sky-950/35 hover:text-sky-100"
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

            <div className="bg-[#0b211f]/65 rounded-2xl border border-[#d8bd85]/20 px-4 py-4 shadow-sm shadow-sky-950/10">
              <label className="block text-xs uppercase tracking-[0.18em] text-[#d8bd85]">
                Confirm new password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#081b1a] text-[#f5f3ec] placeholder:text-[#8daba5] focus:border-[#d8bd85] mt-3 w-full rounded-2xl border border-[#d8bd85]/30 px-4 py-3 text-sm outline-none transition"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border border-[#e0c58c] bg-[#d8bd85] py-3 text-sm font-semibold text-[#102623] transition hover:bg-[#f0d99d] disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        ) : null}

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

