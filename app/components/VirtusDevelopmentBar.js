"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { buildDevelopmentBar } from "@/lib/virtus-development-bar.mjs";

const HIDDEN = /^\/(?:login|auth|forgot-password|update-password|pricing|privacy|terms|legal|support|install|embed)(?:\/|$)/;

export default function VirtusDevelopmentBar() {
  const path = usePathname() || "/";
  const [authenticated, setAuthenticated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    const response = await fetch("/api/account/coaching-history", {
      credentials: "same-origin", cache: "no-store",
    });
    if (response.status === 401) {
      setAuthenticated(false);
      setReviews([]);
      return;
    }
    if (!response.ok) throw Error("Development history is temporarily unavailable.");
    const data = await response.json();
    setReviews(Array.isArray(data.reviews) ? data.reviews : []);
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

  const percent = summary.percent.toFixed(1);
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
      <p className="mt-2 text-2xl font-semibold text-white">{percent}%</p>
      <p className="text-xs text-[#e4c88f]">Journey stage {summary.stage} of 6</p>
      <p className="mt-2 text-xs leading-5 text-[#d4ded9]">
        {summary.trend}. {summary.scored} of 8 domains have an established competency level.
        The bar moves by at most 0.5 percentage points per independent review and can also decline.
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
        The journey percentage is a conservative coaching indicator, not an IQ score or a validated psychological measurement.
        Private to your account. Completion alone never earns points.
      </p>
    </section>
  );

  return (
    <aside aria-label="Private Virtus development indicator"
      className="pointer-events-none fixed right-2 top-1/2 z-40 -translate-y-1/2 max-md:bottom-3 max-md:right-3 max-md:top-auto max-md:translate-y-0">
      <div className="pointer-events-auto hidden flex-col items-center gap-2 rounded-2xl border border-[#caa76c]/60 bg-[#082b25]/95 px-2 py-3 shadow-2xl md:flex">
        <button type="button" onClick={toggle} aria-expanded={expanded} aria-label="Open development details"
          className="text-[10px] font-semibold text-[#e9c681]">ST {summary.stage}</button>
        <button type="button" onClick={toggle} aria-expanded={expanded}
          aria-label={"Development journey " + percent + " percent; show details"}
          className="flex h-36 w-5 items-end overflow-hidden rounded-full border border-[#ad8d52] bg-[#26483c]">
          <span role="progressbar" aria-label="Development journey progress" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={summary.percent} className="block w-full rounded-full bg-gradient-to-t from-[#9b742f] via-[#d6aa53] to-[#f8e4a7] transition-all duration-1000"
            style={{height: summary.percent + "%"}} />
        </button>
        <button type="button" onClick={toggle} className="text-[10px] font-semibold text-[#f6deb0]">{percent}%</button>
      </div>
      <button type="button" onClick={toggle} aria-expanded={expanded}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#caa76c]/70 bg-[#082b25]/95 px-3 py-2 shadow-xl md:hidden"
        aria-label={"Development journey " + percent + " percent; open details"}>
        <span className="text-xs text-[#f4d795]">ST {summary.stage}</span>
        <span className="h-2 w-20 overflow-hidden rounded-full bg-[#26483c]">
          <span className="block h-full rounded-full bg-[#d6aa53] transition-all duration-1000" style={{width: summary.percent + "%"}} />
        </span>
        <span className="text-xs font-semibold text-[#f4d795]">{percent}%</span>
      </button>
      {expanded && <div className="pointer-events-auto absolute right-10 top-0 w-72 max-md:bottom-12 max-md:right-0 max-md:top-auto">{details}</div>}
    </aside>
  );
}
