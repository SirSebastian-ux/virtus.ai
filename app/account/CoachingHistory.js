"use client";

import { useEffect, useState } from "react";
import {
  COACHING_SKILLS,
  DIRECTION_LABELS,
  getSkillObservations,
  uniqueEvidencePeriods,
} from "@/lib/virtus-coaching-history.mjs";

const statusTone = {
  improving: "text-emerald-200 border-emerald-500/35 bg-emerald-900/25",
  stable: "text-[#f3d28f] border-[#d8bd85]/35 bg-[#a77a30]/10",
  declining: "text-amber-200 border-amber-500/35 bg-amber-900/20",
  unclear: "text-[#c5d3ce] border-white/20 bg-white/5",
};

const dateLabel = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export default function CoachingHistory() {
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
      } catch (failure) {
        if (active) setError(failure.message || "Development history unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const handleReviewUpdated = () => void load();
    window.addEventListener("virtus-coaching-review-saved", handleReviewUpdated);
    return () => {
      active = false;
      window.removeEventListener("virtus-coaching-review-saved", handleReviewUpdated);
    };
  }, []);

  const periods = uniqueEvidencePeriods(reviews);
  const first = periods[0];
  const latest = periods.at(-1);

  return (
    <section className="virtus-coaching-history rounded-2xl border border-[#d8bd85]/35 bg-[#102b28] p-5 text-[#f5f3ec]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#e9c781]">Development record</p>
          <h3 className="mt-2 font-serif text-2xl">Your reflection history</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c3d1ca]">
            A timeline of observable patterns in your conversations. These are qualitative AI
            observations, not test scores or measurements of intelligence.
          </p>
        </div>
        {periods.length > 0 && <span className="rounded-full border border-[#d8bd85]/40 px-3 py-2 text-xs text-[#f2d08b]">{periods.length} distinct evidence {periods.length === 1 ? "period" : "periods"}</span>}
      </div>

      {loading && <p className="mt-5 text-sm text-[#c3d1ca]" role="status">Loading development history…</p>}
      {error && <p role="alert" className="mt-5 text-sm text-amber-200">{error}</p>}
      {!loading && !error && periods.length === 0 && (
        <div className="mt-5 rounded-xl border border-[#d8bd85]/20 bg-[#061e1b] p-5">
          <p className="font-semibold">No reviews recorded yet</p>
          <p className="mt-2 text-sm text-[#c3d1ca]">Use “Review my progress” above to create your first evidence-based observation.</p>
        </div>
      )}

      {first && latest && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#d8bd85]/25 bg-[#061e1b] p-4"><p className="text-xs text-[#c3d1ca]">First recorded review</p><p className="mt-1 font-semibold text-[#f2d08b]">{dateLabel(first.created_at)}</p></div>
            <div className="rounded-xl border border-[#d8bd85]/25 bg-[#061e1b] p-4"><p className="text-xs text-[#c3d1ca]">Latest recorded review</p><p className="mt-1 font-semibold text-[#f2d08b]">{dateLabel(latest.created_at)}</p></div>
            <div className="rounded-xl border border-[#d8bd85]/25 bg-[#061e1b] p-4"><p className="text-xs text-[#c3d1ca]">Evidence periods</p><p className="mt-1 font-semibold text-[#f2d08b]">{periods.length}</p></div>
          </div>
          {periods.length === 1 && (
            <p className="mt-4 rounded-xl border border-[#d8bd85]/25 bg-[#0a3129] p-4 text-sm leading-6 text-[#e9dac0]">
              This is your baseline review. A change over time cannot yet be established. Additional reviews based on new conversations will provide comparison points.
            </p>
          )}
          {periods.length > 1 && (
            <p className="mt-4 text-sm leading-6 text-[#c3d1ca]">
              Review periods reflect different conversation windows. AI interpretations may vary; compare the supporting evidence, not just the status labels.
            </p>
          )}
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {COACHING_SKILLS.map((skill) => {
              const observations = getSkillObservations(reviews, skill);
              const latestObservation = observations.at(-1);
              return (
                <article key={skill} className="min-w-0 rounded-xl border border-[#d8bd85]/25 bg-[#061e1b] p-4">
                  <h4 className="font-semibold text-[#f6eee0]">{skill}</h4>
                  {latestObservation ? (
                    <>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[latestObservation.direction]}`}>{DIRECTION_LABELS[latestObservation.direction]}</span>
                        <span className="text-xs text-[#b9ccc3]">{latestObservation.confidence} confidence · {dateLabel(latestObservation.date)}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#cfddd4]">{latestObservation.evidence || "No supporting explanation recorded."}</p>
                      {observations.length > 1 && <p className="mt-3 border-t border-[#d8bd85]/15 pt-3 text-xs text-[#b9ccc3]">{observations.length} reviews mention this area. Open the individual reviews for a detailed comparison of evidence.</p>}
                    </>
                  ) : <p className="mt-3 text-sm text-[#b9ccc3]">No sufficiently specific observation recorded.</p>}
                </article>
              );
            })}
          </div>
        </>
      )}
      <p className="mt-5 text-xs leading-5 text-[#a7bdb4]">
        Important: these observations are qualitative coaching feedback. They are not clinical assessments, validated psychometrics, or proof of a change in ability.
      </p>
    </section>
  );
}
