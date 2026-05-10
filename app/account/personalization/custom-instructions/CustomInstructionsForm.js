"use client";

import { useState } from "react";

export default function CustomInstructionsForm({
  initialCustomInstructions = "",
}) {
  const [customInstructions, setCustomInstructions] = useState(
    initialCustomInstructions
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSave() {
    setSaving(true);
    setStatus("");

    const res = await fetch("/api/account/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customInstructions }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setStatus(data.error || "Failed to save instructions.");
    } else {
      setStatus("Instructions saved.");
    }

    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="virtus-theme-card rounded-2xl border border-sky-900/20 px-4 py-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-300/50">
          Instructions
        </p>

        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="Example: Be direct with me. Guide me one step at a time. Challenge my thinking when needed."
          maxLength={5000}
          rows={12}
          className="virtus-theme-input mt-3 min-h-[320px] w-full resize-y rounded-2xl border border-sky-900/25 px-4 py-3 text-sm leading-6 outline-none transition [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl border border-sky-900/30 bg-sky-950/10 px-4 py-2 text-sm text-sky-700 transition hover:border-sky-800/40 hover:bg-sky-950/15 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save instructions"}
        </button>

        {status ? <p className="text-sm text-sky-700">{status}</p> : null}
      </div>
    </div>
  );
}