"use client";

import { useEffect, useRef } from "react";

export default function VirtusPracticeWorkspace({
  open,
  onClose,
  assessment,
  children,
  categoryCount = 0,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const controls = [...dialog.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter((element) => element.getClientRects().length > 0);

      if (!controls.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus && typeof previousFocus.focus === "function" && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="virtus-luxury-practice-overlay absolute inset-0 z-[30010] flex items-center justify-center px-3 py-4 sm:px-8"
      role="presentation"
      onClick={onClose}
    >
      <section
        ref={dialogRef}
        className="virtus-luxury-practice-panel relative flex max-h-full w-full max-w-[860px] flex-col overflow-hidden rounded-[26px] border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="virtus-practice-workspace-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="virtus-luxury-library-header flex items-center justify-between gap-4 p-5 sm:px-7 sm:py-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="virtus-luxury-library-emblem flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
              <svg width="27" height="27" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8"/>
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
            </span>
            <div className="min-w-0">
              <p className="virtus-luxury-library-overline text-[10px] font-semibold uppercase tracking-[0.23em]">Virtus AI · Development</p>
              <h2 id="virtus-practice-workspace-title" className="virtus-luxury-library-title mt-1 font-serif text-3xl">Practice Studio</h2>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close Practice Studio"
            title="Close Practice Studio"
            className="virtus-luxury-library-icon-btn shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5 19 19M19 5 5 19"/></svg>
          </button>
        </header>

        <div className="virtus-luxury-practice-body virtus-luxury-library-body min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <p className="virtus-luxury-library-description mb-5 text-sm leading-6">
            Build a personalized practice, resume a saved session, or choose a skill to train with Virtus.
          </p>
          <div className="virtus-luxury-practice-assessment">{assessment}</div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <h3 className="virtus-luxury-practice-section-title text-base font-semibold">Practice Categories</h3>
            <span className="virtus-luxury-practice-count text-xs">{categoryCount} areas</span>
          </div>
          <div className="virtus-luxury-practice-categories mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {children}
          </div>
        </div>

        <footer className="virtus-luxury-library-footer px-5 py-3 text-xs text-[#acbfb8] sm:px-7">
          Your selected practice opens in chat · Your existing access and saved exercises are preserved.
        </footer>
      </section>
    </div>
  );
}
