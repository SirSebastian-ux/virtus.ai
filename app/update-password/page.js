"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function UpdatePasswordPage() {
  const supabase = createClient();

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
    <main className="min-h-screen virtus-theme-page flex items-center justify-center px-6">
      <div className="virtus-theme-surface w-full max-w-md rounded-3xl border border-sky-900/20 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-300/50">
          Virtus AI
        </p>

        <h1 className="mt-3 text-3xl font-semibold virtus-theme-title">
          Create new password
        </h1>

        <p className="mt-2 mb-6 text-sm leading-6 virtus-theme-muted">
          Choose a new password for your Virtus AI account.
        </p>

        {ready && !success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="virtus-theme-card rounded-2xl border border-sky-900/20 px-4 py-4 shadow-sm shadow-sky-950/10">
              <label className="block text-xs uppercase tracking-[0.18em] text-sky-300/50">
                New password
              </label>

              <div className="relative mt-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="virtus-theme-input w-full rounded-2xl border border-sky-900/25 px-4 py-3 pr-14 text-sm outline-none transition"
                  placeholder="Enter new password"
                  required
                  minLength={8}
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

            <div className="virtus-theme-card rounded-2xl border border-sky-900/20 px-4 py-4 shadow-sm shadow-sky-950/10">
              <label className="block text-xs uppercase tracking-[0.18em] text-sky-300/50">
                Confirm new password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="virtus-theme-input mt-3 w-full rounded-2xl border border-sky-900/25 px-4 py-3 text-sm outline-none transition"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border border-sky-900/30 bg-sky-950/30 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-800/40 hover:bg-sky-900/35 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        ) : null}

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

