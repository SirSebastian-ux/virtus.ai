"use client";

import { useEffect, useMemo, useState } from "react";
import { uniqueEvidencePeriods } from "@/lib/virtus-coaching-history.mjs";

const DOMAINS = [
  ["Critical thinking", ["critical thinking"]],
  ["Leadership", ["leadership", "accountability"]],
  ["Communication", ["communication"]],
  ["Metacognition", ["metacognition"]],
  ["Emotional intelligence", ["emotional regulation", "emotional intelligence"]],
  ["Self-awareness", ["self-awareness"]],
  ["Behavioral regulation", ["behavioral regulation", "emotional regulation"]],
];
const LABELS = { improving: "Signs of progress", stable: "Consistent", declining: "Needs attention", unclear: "Insufficient evidence" };
const COLORS = { improving: "#42c49d", stable: "#e4bd79", declining: "#d6917d" };

export default function UniversalDevelopmentDashboard({ plan = "free" }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/account/coaching-history", { cache: "no-store" });
        if (!response.ok) throw new Error("Development history is temporarily unavailable.");
        const data = await response.json();
        if (active) setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    };
    load();
    window.addEventListener("virtus-coaching-review-saved", load);
    return () => { active = false; window.removeEventListener("virtus-coaching-review-saved", load); };
  }, []);
  const periods = useMemo(() => uniqueEvidencePeriods(reviews), [reviews]);
  const tier = plan === "premium" ? "Mentor" : plan === "plus" ? "Trainer" : plan === "life_coach" ? "Life Coach" : "Trial / Free";
  const rows = DOMAINS.map(([name, aliases]) => {
    const points = periods.map((period) => {
      const observations = Array.isArray(period.observations) ? period.observations : [];
      const match = observations.find((item) => aliases.includes(String(item.skill || "").toLowerCase()) && Object.hasOwn(LABELS, item.direction));
      return match ? { direction: match.direction, evidence: match.evidence, date: period.created_at } : null;
    }).filter(Boolean);
    return { name, points, last: points.at(-1) };
  });
  return (
    <section className="rounded-2xl border border-[#d8bd85]/40 bg-[#092b25] p-5 text-[#f7ebd5]" aria-label="Your seven-domain development dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e4bd79]">Virtus development intelligence</p><h3 className="mt-2 font-serif text-2xl">My Development Dashboard</h3><p className="mt-2 text-sm text-[#c6d5ce]">Seven independent domains. Observations come from your own recorded coaching reviews, never generic or invented scores.</p></div>
        <span className="rounded-full border border-[#d8bd85]/50 bg-[#15473a] px-4 py-2 text-sm text-[#e4bd79]">{tier} · {periods.length} review periods</span>
      </div>
      {loading && <p className="mt-4 text-sm">Loading your development record...</p>}
      {error && <p role="alert" className="mt-4 text-sm text-amber-200">{error}</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ name, points, last }) => (
          <div key={name} className="rounded-xl border border-[#c6a56d]/35 bg-[#0e3a30] p-4">
            <p className="text-sm font-semibold">{name}</p>
            <p className="mt-2 text-xs text-[#e4bd79]">{last ? LABELS[last.direction] : "Not measured"}</p>
            <div className="mt-4 flex h-14 items-end gap-1.5 border-b border-[#d8bd85]/20 pb-1" aria-label={points.length + " recorded observations"}>
              {points.length ? points.slice(-12).map((point, index) => <div key={index} className="min-w-2 flex-1 rounded-t-sm" style={{ height: point.direction === "improving" ? "90%" : point.direction === "stable" ? "58%" : point.direction === "declining" ? "30%" : "12%", background: COLORS[point.direction] || "#66877a" }} />) : <div className="h-1 w-full rounded bg-[#42675b]" />}
            </div>
            <p className="mt-2 text-xs text-[#c4d3cc]">{points.length} evidence {points.length === 1 ? "period" : "periods"}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#c4d3cc]">Bars indicate qualitative observation categories, not ability percentages. A single review is a baseline, not proof of improvement. Private coaching observations remain in your personal profile and are not employer reporting data.</p>
      <p className="mt-2 text-xs text-[#e4bd79]">{tier === "Mentor" ? "Mentor: full coaching review history and adaptive development." : tier === "Trainer" ? "Trainer: guided practice and development comparisons." : tier === "Life Coach" ? "Life Coach: personal reflection and development overview." : "Your development overview is available; membership determines coaching and training access."}</p>
    </section>
  );
}
