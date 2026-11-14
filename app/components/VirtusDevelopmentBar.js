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

  // A compact, borderless continuation of the subscription header, not a second card.
  // The absence of a baseline must never imply a zero competency score.
  const mobileIndicator = (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={expanded}
      aria-label={baselinePending
        ? "My growth: baseline not established. Open development details."
        : "My growth: stage " + summary.indexStage + " of 6, " + percent + " percent. Open development details."}
      className="virtus-mobile-growth inline-flex w-full min-w-0 flex-col items-stretch justify-center rounded-md border-0 bg-transparent px-0 py-1 text-left shadow-none outline-offset-2 transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e9c681] md:hidden"
    >
      <span className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-[9px] font-medium uppercase tracking-[0.13em] text-[#d3b67a]">My growth</span>
        <span className="shrink-0 text-[9px] font-semibold tracking-[0.02em] text-[#e5cc99]">{baselinePending ? "Baseline" : "Stage " + summary.indexStage + " · " + percent + "%"}</span>
      </span>
      <span className="mt-[5px] block h-[2px] w-full overflow-hidden rounded-full bg-[#496354]/55" role="progressbar"
        aria-label={baselinePending ? "Development baseline not established" : "Development journey"}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={baselinePending ? undefined : summary.indexPercent}>
        <span className="block h-full rounded-full bg-gradient-to-r from-[#b48d48] via-[#ecd197] to-[#ffe8b6] transition-[width] duration-1000"
          style={{width: baselinePending ? "0%" : summary.indexPercent + "%"}} />
      </span>
    </button>
  );
  return (
    <>
    <aside aria-label="Private Virtus development indicator"
      className={"pointer-events-none relative z-10 w-full shrink-0 md:fixed md:right-2 md:top-1/2 md:z-40 md:w-auto md:-translate-y-1/2 " + (mobileSlot ? "max-md:hidden" : "")}>
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
      {!mobileSlot && (
        <div className="pointer-events-auto flex w-full flex-col items-end border-b border-[#aa8c57]/20 bg-[#071f1b] px-4 py-2 md:hidden">
          <div className="w-[min(48vw,184px)] max-w-full">{mobileIndicator}</div>
          {expanded && <div className="mt-2 w-full max-w-sm">{details}</div>}
        </div>
      )}
    </aside>
    {mobileSlot && createPortal(
      <div className="pointer-events-auto relative flex w-full min-w-0 flex-col items-end gap-2">
        <div className="w-[min(48vw,184px)] max-w-full">{mobileIndicator}</div>
        {expanded && <div className="w-full max-w-sm">{details}</div>}
      </div>,
      mobileSlot
    )}
  </>
  );
}
