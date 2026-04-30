"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
            emailRedirectTo: "https://virtusaiworld.com/auth/callback",
          },
        });

        if (error) {
          setMessage("❌ " + error.message);
        } else {
          setMessage("✅ Account created. Check your email and confirm your account before signing in.");
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

          setMessage("Signed in successfully. Your guest session has been moved into your account.");
          window.location.href = "/";
        }
      }
    } catch (error) {
      setMessage("Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-sky-900/20 bg-zinc-950/35 p-6 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-300/50">
          Virtus AI
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-sky-100">
          {mode === "signup" ? "Create account" : "Sign in"}
        </h1>

        <p className="mt-2 mb-6 text-sm leading-6 text-zinc-400">
          Access Virtus AI with your personal account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-sky-900/20 bg-black/25 px-4 py-4 shadow-sm shadow-sky-950/10">
            <label className="block text-xs uppercase tracking-[0.18em] text-sky-300/50">
              Email
            </label>
<input
  type="email"
  pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-sky-900/25 bg-zinc-950/45 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-sky-800/50 focus:bg-zinc-950/65"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="rounded-2xl border border-sky-900/20 bg-black/25 px-4 py-4 shadow-sm shadow-sky-950/10">
            <label className="block text-xs uppercase tracking-[0.18em] text-sky-300/50">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-sky-900/25 bg-zinc-950/45 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-sky-800/50 focus:bg-zinc-950/65"
              placeholder="Enter password"
              required
            />
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
          <p className="mt-4 rounded-2xl border border-sky-900/20 bg-black/25 px-4 py-3 text-sm text-white">
            {message}
          </p>
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