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
        className="virtus-danger-button flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left shadow-sm backdrop-blur-sm transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div>
          <p className="text-sm font-medium">
            Log out
          </p>
          <p className="mt-1 text-xs virtus-danger-muted">
            Sign out of this account
          </p>
        </div>

        <span className="virtus-danger-muted">
          {loading ? "..." : "›"}
        </span>
      </button>

      {error ? (
        <p className="mt-2 text-xs virtus-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
