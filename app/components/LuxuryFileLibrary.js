"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {name === "library" && <><path d="M12 5c-2.9-2-6-2.3-9-1.6v15.2c3.3-.9 6.4-.4 9 1.4 2.6-1.8 5.7-2.3 9-1.4V3.4c-3-.7-6.1-.4-9 1.6ZM12 5v15" /></>}
      {name === "file" && <><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h5M9 13h6M9 17h6" /></>}
      {name === "upload" && <><path d="M12 16V4m-5 5 5-5 5 5M4 17v3h16v-3" /></>}
      {name === "download" && <><path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3" /></>}
      {name === "refresh" && <><path d="M20 8a8 8 0 0 0-13.5-3L4 8m0-5v5h5M4 16a8 8 0 0 0 13.5 3L20 16m0 5v-5h-5" /></>}
      {name === "close" && <><path d="M5 5 19 19M19 5 5 19" /></>}
      {name === "trash" && <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" /></>}
      {name === "check" && <><path d="m5 12 4 4L19 6" /></>}
      {name === "view" && <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>}
    </svg>
  );
}

export default function LuxuryFileLibrary({
  open,
  onClose,
  isAuthenticated,
  files = [],
  uploading = false,
  onUpload,
  onRefresh,
  onAttach,
  onPreview,
  onDelete,
  attachedIds = [],
  notice = "",
}) {
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const displayed = useMemo(() => {
    const unique = new Map();
    for (const file of files || []) {
      if (file?.id && !unique.has(file.id)) unique.set(file.id, file);
    }
    return [...unique.values()].filter((file) => String(file.file_name || "").toLowerCase().includes(search.trim().toLowerCase()));
  }, [files, search]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="virtus-luxury-library-overlay absolute inset-0 z-[30000] flex items-center justify-center px-3 py-4 sm:px-8"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="virtus-luxury-library-panel relative flex max-h-full w-full max-w-[760px] flex-col overflow-hidden rounded-[26px] border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="virtus-library-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="virtus-luxury-library-header flex flex-wrap items-center justify-between gap-4 p-5 sm:px-7 sm:py-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="virtus-luxury-library-emblem flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
              <Icon name="library" size={26} />
            </span>
            <div className="min-w-0">
              <p className="virtus-luxury-library-overline text-[10px] font-semibold uppercase tracking-[0.23em]">Virtus AI · Workspace</p>
              <h2 id="virtus-library-title" className="virtus-luxury-library-title mt-1 font-serif text-3xl">Document Library</h2>
            </div>
          </div>
          <button type="button" className="virtus-luxury-library-icon-btn" onClick={onClose} aria-label="Close document library" title="Close library">
            <Icon name="close" />
          </button>
        </header>

        <div className="virtus-luxury-library-body flex min-h-0 flex-1 flex-col overflow-y-auto p-5 sm:p-7">
          <p className="virtus-luxury-library-description text-sm leading-6">
            Keep your documents organized, select a file for your conversation, or download it securely.
          </p>

          {!isAuthenticated ? (
            <div className="virtus-luxury-library-empty mt-7 rounded-2xl p-7 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center text-[#f7d790]"><Icon name="file" size={40} /></span>
              <h3 className="mt-3 text-lg font-semibold text-[#fff6e1]">Your private library starts with an account</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#bed0c9]">Sign in to view your saved documents, or create an account to upload and use files with Virtus AI.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link className="virtus-luxury-library-gold-btn" href="/login?next=/" >Log in</Link>
                <Link className="virtus-luxury-library-outline-btn" href="/login?mode=signup&next=/">Create account</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" disabled={uploading} onClick={onUpload} className="virtus-luxury-library-gold-btn inline-flex items-center justify-center gap-2 disabled:opacity-50">
                  <Icon name="upload" size={18} /> {uploading ? "Uploading…" : "Upload files"}
                </button>
                <button type="button" onClick={onRefresh} className="virtus-luxury-library-outline-btn inline-flex items-center gap-2">
                  <Icon name="refresh" size={17} /> Refresh
                </button>
              </div>
              {notice && <p role="status" className="mt-3 rounded-xl border border-[#d8bd85]/30 bg-[#092a26] p-3 text-sm text-[#f7dc9b]">{notice}</p>}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-medium text-[#fbefda]">Saved documents <span className="text-[#e3bf75]">({files.length})</span></h3>
                <label className="min-w-0">
                  <span className="sr-only">Search documents</span>
                  <input
                    className="virtus-luxury-library-search w-full rounded-xl px-3 py-2 text-sm sm:w-56"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search your documents"
                  />
                </label>
              </div>

              {displayed.length === 0 ? (
                <div className="virtus-luxury-library-empty mt-4 rounded-2xl px-6 py-9 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center text-[#f5cc81]"><Icon name="file" size={32}/></span>
                  <p className="mt-3 font-medium text-[#ffefc8]">{files.length ? "No documents match your search" : "No uploaded files yet"}</p>
                  <p className="mt-2 text-xs leading-5 text-[#bed0c9]">{files.length ? "Try a different file name." : "Upload a document to build your library."}</p>
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {displayed.map((file) => {
                    const attached = attachedIds.includes(file.id);
                    const isImage = String(file.file_type || "").startsWith("image/");
                    return (
                      <div key={file.id} className="virtus-luxury-library-item flex flex-wrap items-center gap-3 rounded-2xl p-3 sm:p-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d9b974]/30 bg-[#124238]/60 text-[#f2d28f]">
                          <Icon name={isImage ? "view" : "file"} size={20} />
                        </span>
                        <div className="min-w-[120px] flex-1">
                          <p className="truncate text-sm font-semibold text-[#f7f3e8]" title={file.file_name}>{file.file_name}</p>
                          <p className="mt-1 text-xs text-[#acc3ba]">{isImage ? "Image" : "Document"}{attached ? " · Attached to chat" : ""}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {isImage && (
                            <button type="button" className="virtus-luxury-library-icon-btn" title="Preview" aria-label={"Preview "+file.file_name} onClick={() => onPreview?.(file)}><Icon name="view" size={17}/></button>
                          )}
                          <button type="button" className="virtus-luxury-library-small-btn" onClick={() => onAttach?.(file)} disabled={attached}>
                            {attached ? <><Icon name="check" size={15}/> Added</> : "Use in chat"}
                          </button>
                          <a className="virtus-luxury-library-icon-btn" title="Download" aria-label={"Download "+file.file_name} href={`/api/files/download?fileId=${encodeURIComponent(file.id)}`}><Icon name="download" size={17}/></a>
                          {confirmDelete === file.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button type="button" className="virtus-luxury-library-danger-btn" onClick={() => { setConfirmDelete(null); onDelete?.(file); }}>Delete?</button>
                              <button type="button" className="virtus-luxury-library-icon-btn" onClick={() => setConfirmDelete(null)} aria-label="Cancel deletion"><Icon name="close" size={15}/></button>
                            </div>
                          ) : (
                            <button type="button" className="virtus-luxury-library-icon-btn" title="Delete" aria-label={"Delete "+file.file_name} onClick={() => setConfirmDelete(file.id)}><Icon name="trash" size={16}/></button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <footer className="virtus-luxury-library-footer px-5 py-3 text-xs text-[#acbfb8] sm:px-7">
          Private workspace · Your files are available only to your authenticated account.
        </footer>
      </section>
    </div>
  );
}
