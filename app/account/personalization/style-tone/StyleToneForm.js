"use client";

import { useState } from "react";

const styles = [
  ["default", "Default", "Standard Virtus response behavior."],
  ["direct", "Direct", "Shorter, sharper, and more decisive."],
  ["balanced", "Balanced", "Clear and useful without being too soft or too hard."],
  ["gentle", "Gentle", "Calmer, softer, and more supportive."],
  ["strategic", "Strategic", "More structured, analytical, and forward-looking."],
  ["executive", "Executive", "High-level, concise, and decision-focused."],
];

export default function StyleToneForm({ initialStyle = "default" }) {
  const [responseStyle, setResponseStyle] = useState(initialStyle);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function saveStyle(nextStyle) {
    setResponseStyle(nextStyle);
    setSaving(true);
    setStatus("");

    const res = await fetch("/api/account/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ responseStyle: nextStyle }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setStatus(data.error || "Failed to save style.");
    } else {
      setStatus("Style saved.");
    }

    setSaving(false);
  }

  return (
    <div className="space-y-3">
      {styles.map(([value, label, description]) => {
        const active = responseStyle === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => saveStyle(value)}
            disabled={saving}
            className={`group flex w-full items-center justify-between gap-6 rounded-2xl border px-4 py-4 text-left shadow-sm backdrop-blur-sm transition disabled:opacity-50 ${
              active
                ? "border-sky-700/60 bg-sky-950/35 shadow-sky-950/20"
                : "border-sky-900/20 bg-black/25 shadow-sky-950/10 hover:border-sky-800/40 hover:bg-zinc-950/55"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-sky-100">{label}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                {description}
              </p>
            </div>

            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                active
                  ? "border-sky-600/60 bg-sky-900/40 text-sky-100"
                  : "border-sky-900/30 bg-sky-950/20 text-sky-300/50 group-hover:bg-sky-900/35 group-hover:text-sky-200"
              }`}
            >
              {active ? "✓" : "›"}
            </div>
          </button>
        );
      })}

      {status ? <p className="text-sm text-sky-300/70">{status}</p> : null}
    </div>
  );
}