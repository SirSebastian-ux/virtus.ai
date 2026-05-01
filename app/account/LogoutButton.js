"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/signout", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Could not log out.");
      }

      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Could not log out.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="flex w-full items-center justify-between rounded-2xl border border-red-900/40 bg-red-950/20 px-4 py-4 text-left text-red-200 shadow-sm backdrop-blur-sm transition hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div>
          <p className="text-sm font-medium">
            Log out
          </p>
          <p className="mt-1 text-xs text-red-200/70">
            Sign out of this account
          </p>
        </div>

        <span className="text-red-200/70">
          {loading ? "..." : "›"}
        </span>
      </button>

      {error ? (
        <p className="mt-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}