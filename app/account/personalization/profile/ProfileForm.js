"use client";

import { useState } from "react";

export default function ProfileForm({
  initialNickname = "",
  initialOccupation = "",
  initialAbout = "",
  initialPreferences = "",
}) {
  const [nickname, setNickname] = useState(initialNickname);
  const [occupation, setOccupation] = useState(initialOccupation);
  const [about, setAbout] = useState(initialAbout);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSave() {
    setSaving(true);
    setStatus("");

    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname, occupation, about, preferences }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus(data.error || "Failed to save profile.");
        setSaving(false);
        return;
      }

      setStatus("Profile saved.");
    } catch (error) {
      setStatus("Failed to save profile.");
    }

    setSaving(false);
  }

  const fieldCardClass =
    "rounded-2xl border border-sky-900/20 bg-black/25 px-4 py-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm";

  const labelClass =
    "text-xs uppercase tracking-[0.18em] text-sky-300/50";

  const inputClass =
    "mt-3 w-full rounded-2xl border border-sky-900/25 bg-zinc-950/45 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-sky-800/50 focus:bg-zinc-950/65";

  const textareaClass =
    "mt-3 min-h-[260px] w-full resize-y rounded-2xl border border-sky-900/25 bg-zinc-950/45 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 transition focus:border-sky-800/50 focus:bg-zinc-950/65 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  return (
    <div className="space-y-4">
      <div className={fieldCardClass}>
        <p className={labelClass}>Nickname</p>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter the name Virtus should call you"
          className={inputClass}
        />
      </div>

      <div className={fieldCardClass}>
        <p className={labelClass}>Occupation</p>
        <input
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder="Enter your role or profession"
          className={inputClass}
        />
      </div>

      <div className={fieldCardClass}>
        <p className={labelClass}>More about you</p>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Write something about yourself"
          maxLength={5000}
          rows={10}
          className={textareaClass}
        />
      </div>

      <div className={fieldCardClass}>
        <p className={labelClass}>Interests, values, or preferences</p>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="Add important preferences, interests, or values that Virtus should keep in mind"
          maxLength={5000}
          rows={10}
          className={textareaClass}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl border border-sky-900/30 bg-sky-950/20 px-4 py-2 text-sm text-sky-200 transition hover:border-sky-800/40 hover:bg-sky-950/35 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>

        {status ? <p className="text-sm text-sky-300/70">{status}</p> : null}
      </div>
    </div>
  );
}