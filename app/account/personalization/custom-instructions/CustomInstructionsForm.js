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
      <div className="rounded-2xl border border-sky-900/20 bg-black/25 px-4 py-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-300/50">
          Instructions
        </p>

        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="Example: Be direct with me. Guide me one step at a time. Challenge my thinking when needed."
          maxLength={5000}
          rows={12}
          className="mt-3 min-h-[320px] w-full resize-y rounded-2xl border border-sky-900/25 bg-zinc-950/45 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 transition focus:border-sky-800/50 focus:bg-zinc-950/65 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl border border-sky-900/30 bg-sky-950/20 px-4 py-2 text-sm text-sky-200 transition hover:border-sky-800/40 hover:bg-sky-950/35 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save instructions"}
        </button>

        {status ? <p className="text-sm text-sky-300/70">{status}</p> : null}
      </div>
    </div>
  );
}