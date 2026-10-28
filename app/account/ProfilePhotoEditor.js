"use client";

import { useEffect, useState } from "react";

export default function ProfilePhotoEditor() {
  const [url, setUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/account/avatar", { cache: "no-store" }).then(r => r.json()).then(d => setUrl(d.url || null)).catch(() => {});
  }, []);
  async function upload(event) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("photo", file);
      const response = await fetch("/api/account/avatar", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setUrl(data.url);
      setFile(null);
      setMessage("Profile photo saved.");
    } catch (error) {
      setMessage(error.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={upload} className="rounded-2xl border border-[#d8bd85]/25 bg-[#102b28] p-5 text-[#f5f3ec]">
    <h3 className="text-base font-semibold">Profile photograph</h3>
    <p className="mt-1 text-xs text-[#b8cbc5]">Optional private photo. JPEG, PNG or WebP, up to 2 MB.</p>
    <div className="mt-4 flex flex-wrap items-center gap-4">
      {url ? <img src={url} alt="Your profile photograph" className="h-20 w-20 rounded-full border border-[#d8bd85]/40 object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#d8bd85]/40 bg-[#081c1b] text-2xl">V</div>}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} className="max-w-full text-sm" aria-label="Choose a profile photo" />
      <button type="submit" disabled={!file || busy} className="virtus-gold-button px-4 py-2 text-sm disabled:opacity-50">{busy ? "Uploading..." : "Upload photo"}</button>
    </div>
    {message && <p role="status" className="mt-3 text-sm text-[#e8c985]">{message}</p>}
  </form>;
}
