"use client";

import { useEffect, useRef, useState } from "react";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePhotoEditor() {
  const inputRef = useRef(null);
  const previewRef = useRef("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/account/avatar", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Current photo unavailable");
        return response.json();
      })
      .then((data) => { if (mounted) setUrl(data.url || ""); })
      .catch(() => {});
    return () => {
      mounted = false;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function selectPhoto(event) {
    const selected = event.target.files?.[0] || null;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = "";
    setPreview("");
    setProblem("");
    setMessage("");
    setFile(null);
    if (!selected) return;
    if (!PHOTO_TYPES.includes(selected.type)) {
      setProblem("Choose a JPEG, PNG or WebP photograph.");
      event.target.value = "";
      return;
    }
    if (selected.size < 100 || selected.size > MAX_PHOTO_SIZE) {
      setProblem("The photograph must be less than 2 MB.");
      event.target.value = "";
      return;
    }
    const localPreview = URL.createObjectURL(selected);
    previewRef.current = localPreview;
    setPreview(localPreview);
    setFile(selected);
  }

  async function upload(event) {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setProblem("");
    setMessage("");
    try {
      const body = new FormData();
      body.append("photo", file);
      const response = await fetch("/api/account/avatar", { method: "POST", body });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Photo could not be saved.");
      setUrl(data.url || "");
      setFile(null);
      setPreview("");
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
      if (inputRef.current) inputRef.current.value = "";
      setMessage("Profile photograph saved successfully.");
      window.dispatchEvent(new Event("virtus-avatar-updated"));
    } catch (error) {
      setProblem(error.message || "Photo upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={upload} className="virtus-profile-photo-card rounded-2xl border border-[#d8bd85]/30 bg-[#102b28] p-5">
      <h3 className="text-lg font-semibold text-[#f7edda]">Profile photograph</h3>
      <p className="mt-2 text-sm leading-6 text-[#bdd2c9]">
        Add a private photograph to personalize your Virtus profile. Supported: JPEG, PNG or WebP (maximum 2 MB).
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-5">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#e3bd79]/60 bg-[#051e1b]">
          {preview || url ? (
            <img src={preview || url} alt="Profile photograph preview" className="h-full w-full object-cover" />
          ) : <span className="font-serif text-3xl text-[#f1cd8a]">V</span>}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <input ref={inputRef} id="virtus-profile-photo-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="sr-only" aria-describedby="virtus-photo-help" />
          <div className="flex flex-wrap gap-3">
            <label htmlFor="virtus-profile-photo-file" className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[#e3bd79]/60 bg-[#0d4537] px-5 py-2 font-medium text-[#f3d49b] transition hover:bg-[#14604b]">
              {url || file ? "Choose another photo" : "Choose photograph"}
            </label>
            <button type="submit" disabled={!file || busy} className="virtus-gold-button min-h-11 rounded-xl px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45">
              {busy ? "Uploading…" : "Save photograph"}
            </button>
          </div>
          <p id="virtus-photo-help" className="break-words text-xs text-[#b8cbc5]">
            {file ? `Selected: ${file.name} — ready to save` : "Choose a photograph first, then select Save photograph."}
          </p>
        </div>
      </div>
      {problem && <p role="alert" className="mt-4 rounded-lg border border-amber-500/35 bg-amber-900/20 px-3 py-2 text-sm text-amber-100">{problem}</p>}
      {message && <p role="status" className="mt-4 rounded-lg border border-emerald-500/35 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-100">{message}</p>}
    </form>
  );
}
