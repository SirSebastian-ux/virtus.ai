"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileNameEditor({ initialName = "" }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function save(event) {
    event.preventDefault();
    setNotice("");
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80) {
      setNotice("Enter a display name between 1 and 80 characters.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Could not save.");
      setNotice("Display name saved.");
      router.refresh();
    } catch (error) {
      setNotice(error.message || "Could not save your display name.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-[#d8bd85]/25 bg-[#102b28] p-5">
      <label htmlFor="virtus-display-name" className="block text-sm font-medium text-[#f5f3ec]">Your display name</label>
      <p className="mt-1 text-xs text-[#b8cbc5]">This is the name shown in your personal development dashboard.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <input id="virtus-display-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)}
          autoComplete="nickname" className="min-w-0 flex-1 rounded-xl border border-[#d8bd85]/30 bg-[#081c1b] px-4 py-3 text-[#f5f3ec] outline-none focus:border-[#e8c985]" />
        <button type="submit" disabled={saving} className="rounded-xl border border-[#d8bd85]/60 bg-[#d8bd85] px-5 py-3 font-medium text-[#0c2421] disabled:opacity-60">
          {saving ? "Saving..." : "Save name"}
        </button>
      </div>
      {notice && <p role="status" className="mt-2 text-xs text-[#e8c985]">{notice}</p>}
    </form>
  );
}
