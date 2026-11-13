"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { buildDevelopmentBar } from "@/lib/virtus-development-bar.mjs";

const HIDDEN = /^\/(?:login|auth|forgot-password|update-password|pricing|privacy|terms|legal|support|install|embed)(?:\/|$)/;

export default function VirtusDevelopmentBar() {
  const path = usePathname() || "/";
  const [authenticated, setAuthenticated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [activityCount, setActivityCount] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [mobileTop, setMobileTop] = useState(94);
  const [mobileSlot, setMobileSlot] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    const response = await fetch("/api/account/coaching-history", {
      credentials: "same-origin", cache: "no-store",
    });
    if (response.status === 401) {
      setAuthenticated(false);
      setReviews([]);
      setActivityCount(null);
      return;
    }
    if (!response.ok) throw Error("Development history is temporarily unavailable.");
    const data = await response.json();
    setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    setActivityCount(Number.isInteger(data.activity?.userMessageCount) ? data.activity.userMessageCount : null);
    setAuthenticated(true);
    setError("");
  }, []);

  useEffect(() => {
    if (HIDDEN.test(path)) {
      setExpanded(false);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        if (active) await loadHistory();
      } catch {
        if (active) setError("Unable to check the latest development history.");
      }
    };
    load();
    window.addEventListener("virtus-coaching-review-saved", load);
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.removeEventListener("virtus-coaching-review-saved", load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadHistory, path]);

  useEffect(() => {
    const measure = () => {
      const header = document.querySelector(".virtus-chat-root .virtus-luxury-header");
      setMobileTop(header ? Math.max(70, Math.round(header.getBoundingClientRect().bottom + 8)) : 94);
    };
    measure();
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    const header = document.querySelector(".virtus-chat-root .virtus-luxury-header");
    if (header) observer.observe(header);
    return () => { window.removeEventListener("resize", measure); observer.disconnect(); };
  }, [path]);
  // Attach the mobile indicator beneath the user plan, not over the workspace.
  useEffect(() => {
    const updateSlot = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      setMobileSlot(mobile ? document.getElementById("virtus-development-header-slot") : null);
    };
    updateSlot();
    window.addEventListener("resize", updateSlot);
    return () => window.removeEventListener("resize", updateSlot);
  }, [path]);

  const summary = useMemo(() => buildDevelopmentBar(reviews), [reviews]);

  async function requestReview() {
    if (refreshing) return;
    setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/account/coaching-progress", {
        credentials: "same-origin", cache: "no-store",
      });
      if (!response.ok) throw Error("A new review is not available at the moment.");
      await loadHistory();
      window.dispatchEvent(new Event("virtus-coaching-review-saved"));
    } catch {
      setError("New review unavailable. Previous development history is preserved.");
    } finally {
      setRefreshing(false);
    }
  }

  if (HIDDEN.test(path) || !authenticated) return null;

  const percent = summary.indexPercent.toFixed(1);
  const journeyChange = summary.journeyDelta.toFixed(1);
  const baselinePending = summary.scored === 0;
  const toggle = () => setExpanded((value) => !value);
  const domainDetails = summary.domains.map((domain) => (
    <li key={domain.name} className="flex justify-between gap-2 border-b border-[#caa76c]/15 py-1.5">
      <span className="text-[#dee9e1]">{domain.name}</span>
      <span className="shrink-0 font-medium text-[#f3cf8c]">
        {domain.level === null ? "Pending" : "Stage " + (Math.floor(domain.level) + 1)}
      </span>
    </li>
  ));
  const details = (
    <section className="max-h-[65dvh] overflow-y-auto rounded-xl border border-[#caa76c]/70 bg-[#092b25] p-4 text-sm shadow-2xl" aria-label="Development bar details">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-[#e9c681]">VIRTUS DEVELOPMENT</span>
        <button type="button" onClick={() => setExpanded(false)} aria-label="Close development details" className="text-lg text-[#e9c681]">x</button>
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{baselinePending ? "Baseline pending" : percent + "%"}</p>
      <p className="text-xs text-[#e4c88f]">{baselinePending ? "Development Index: baseline pending" : "Development Index: Stage " + summary.indexStage + " of 6"}</p>
      {baselinePending && <p className="mt-2 text-xs leading-5 text-[#d4ded9]">Your earlier reviews are preserved. The new eight-domain competency assessment has not established a level for this account yet.</p>}
      {activityCount !== null && <p className="mt-2 text-xs text-[#f1cf84]">{activityCount.toLocaleString()} recorded chat messages; participation is tracked separately from demonstrated competency.</p>}
      <p className="mt-2 text-xs text-[#f1cf84]">Gradual journey movement: {summary.journeyDelta > 0 ? "+" : ""}{journeyChange} percentage points since baseline</p>
      <p className="mt-2 text-xs leading-5 text-[#d4ded9]">
        {summary.trend}. {summary.scored} of 8 domains have an established competency level.
        The visible bar starts at your established competency baseline and changes by at most 0.5 percentage points per new qualifying review. Repeated credible evidence can also lower it.
      </p>
      <p className="mt-3 text-xs font-semibold text-[#e9c681]">EIGHT DEVELOPMENT DOMAINS</p>
      <ul className="mt-1 text-[11px]">{domainDetails}</ul>
      <a href="/account#my-development" className="mt-3 block text-xs font-semibold text-[#f1cf84] underline underline-offset-2">
        Open full Development Index
      </a>
      <button type="button" onClick={requestReview} disabled={refreshing}
        className="mt-3 w-full rounded-lg border border-[#e9c681]/60 px-3 py-2 text-xs font-semibold text-[#f1cf84] disabled:opacity-50">
        {refreshing ? "Reviewing recent evidence..." : "Review recent activity"}
      </button>
      {error && <p className="mt-2 text-xs text-amber-200" role="status">{error}</p>}
      <p className="mt-3 text-[10px] leading-4 text-[#b8c9c0]">
        The index baseline and journey movement are coaching interpretations, not IQ scores or validated psychological measurements.
        Private to your account. Completion alone never earns points.
      </p>
    </section>
  );

  return (
    <>
    <aside aria-label="Private Virtus development indicator"
      style={{"--virtus-mobile-development-top": mobileTop + "px"}}
      className="pointer-events-none fixed right-2 top-1/2 z-40 -translate-y-1/2 max-md:right-3 max-md:top-[var(--virtus-mobile-development-top)] max-md:translate-y-0">
      <div className="pointer-events-auto hidden flex-col items-center gap-2 rounded-2xl border border-[#caa76c]/60 bg-[#082b25]/95 px-2 py-3 shadow-2xl md:flex">
        <button type="button" onClick={toggle} aria-expanded={expanded} aria-label="Open development details"
          className="text-[10px] font-semibold text-[#e9c681]">{baselinePending ? "NEW" : "ST " + summary.indexStage}</button>
        <button type="button" onClick={toggle} aria-expanded={expanded}
          aria-label={"Development journey " + percent + " percent; show details"}
          className="flex h-36 w-5 items-end overflow-hidden rounded-full border border-[#ad8d52] bg-[#26483c]">
          <span role="progressbar" aria-label="Development journey progress" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={summary.indexPercent} className="block w-full rounded-full bg-gradient-to-t from-[#9b742f] via-[#d6aa53] to-[#f8e4a7] transition-all duration-1000"
            style={{height: summary.indexPercent + "%"}} />
        </button>
        <button type="button" onClick={toggle} className="text-[10px] font-semibold text-[#f6deb0]">{baselinePending ? "N/A" : percent + "%"}</button>
      </div>
      {!mobileSlot && <>
      <button type="button" onClick={toggle} aria-expanded={expanded}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#caa76c]/70 bg-[#082b25]/95 px-3 py-2 shadow-xl md:hidden"
        aria-label={"Development journey " + percent + " percent; open details"}>
        <span className="text-xs text-[#f4d795]">{baselinePending ? "NEW" : "ST " + summary.indexStage}</span>
        <span className="h-2 w-20 overflow-hidden rounded-full bg-[#26483c]">
          <span className="block h-full rounded-full bg-[#d6aa53] transition-all duration-1000" style={{width: summary.indexPercent + "%"}} />
        </span>
        <span className="text-xs font-semibold text-[#f4d795]">{baselinePending ? "N/A" : percent + "%"}</span>
      </button>
      {expanded && <div className="pointer-events-auto absolute right-10 top-0 w-72 max-md:top-12 max-md:right-0">{details}</div>}
      </>}
    </aside>
    {mobileSlot && createPortal(
      <div className="pointer-events-auto relative z-40 flex w-full justify-end">
      <button type="button" onClick={toggle} aria-expanded={expanded}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#caa76c]/70 bg-[#082b25]/95 px-3 py-2 shadow-xl md:hidden"
        aria-label={"Development journey " + percent + " percent; open details"}>
        <span className="text-xs text-[#f4d795]">{baselinePending ? "NEW" : "ST " + summary.indexStage}</span>
        <span className="h-2 w-20 overflow-hidden rounded-full bg-[#26483c]">
          <span className="block h-full rounded-full bg-[#d6aa53] transition-all duration-1000" style={{width: summary.indexPercent + "%"}} />
        </span>
        <span className="text-xs font-semibold text-[#f4d795]">{baselinePending ? "N/A" : percent + "%"}</span>
      </button>
      {expanded && <div className="pointer-events-auto absolute right-10 top-0 w-72 max-md:top-12 max-md:right-0">{details}</div>}
      </div>,
      mobileSlot
    )}
  </>
  );
}
