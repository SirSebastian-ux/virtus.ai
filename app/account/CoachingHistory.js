"use client";

import { useEffect, useState } from "react";
import {
  COACHING_SKILLS,
  DIRECTION_LABELS,
  getSkillObservations,
  getTrendPoints,
  formatCoachingEvidence,
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

export default function CoachingHistory({ displayName = "The client" }) {
  const [reviews, setReviews] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("Self-awareness");
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
  const timeline = getTrendPoints(reviews, selectedSkill);
  const xCoordinate = (index) => timeline.length <= 1 ? 50 : 12 + (index * 77) / (timeline.length - 1);
  const yCoordinate = (band) => 80 - band * 28;
  const segments = [];
  for (let index = 1; index < timeline.length; index++) {
    const previous = timeline[index - 1];
    const current = timeline[index];
    if (previous.band !== null && current.band !== null) segments.push({
      x1: xCoordinate(index - 1), y1: yCoordinate(previous.band),
      x2: xCoordinate(index), y2: yCoordinate(current.band), key: index,
    });
  }

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
          <div className="mt-6 rounded-2xl border border-[#d8bd85]/35 bg-[#061e1b] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-serif text-xl text-[#f3e5c8]">Development trend</h4>
                <p className="mt-1 text-xs text-[#b9ccc3]">Qualitative observations across distinct evidence periods, not ability scores.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#e7d3aa]">Area
                <select value={selectedSkill} onChange={(event) => setSelectedSkill(event.target.value)} className="min-h-11 rounded-xl border border-[#d8bd85]/45 bg-[#0b352c] px-3 py-2 text-[#f5eee0]">
                  {COACHING_SKILLS.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl bg-[#041b19] p-2">
              <svg viewBox="0 0 100 100" role="img" aria-label={`Qualitative trend for ${selectedSkill}: ${timeline.length} review periods`} className="h-64 w-full" preserveAspectRatio="none">
                {[24,52,80].map((y, i) => <g key={y}>
                  <line x1="12" y1={y} x2="89" y2={y} stroke="#496b5b" strokeWidth=".4" strokeDasharray="1.2 1.2" />
                  <text x="1" y={y + 1.5} fill="#cbd9cd" fontSize="2.5">{["Up", "Steady", "Down"][i]}</text>
                </g>)}
                {segments.map((line) => <line key={line.key} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#e9c17c" strokeWidth=".9" vectorEffect="non-scaling-stroke" />)}
                {timeline.filter((point) => point.band !== null).map((point) => <circle key={point.index} cx={xCoordinate(point.index)} cy={yCoordinate(point.band)} r="1.4" fill="#f2d28e" stroke="#0a4034" strokeWidth=".4">
                  <title>{dateLabel(point.date)}: {DIRECTION_LABELS[point.direction]} ({point.confidence} confidence)</title>
                </circle>)}
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[#b9ccc3]">
              <span>{timeline.length ? dateLabel(timeline[0].date) : "No reviews"}</span>
              <span>{timeline.length ? dateLabel(timeline.at(-1).date) : ""}</span>
            </div>
            {timeline.length < 2 && <p className="mt-3 text-sm text-[#ecd5a7]">Only one distinct evidence period is available. A direction cannot yet be established.</p>}
            {timeline.length > 1 && segments.length === 0 && <p className="mt-3 text-sm text-[#ecd5a7]">Not enough comparable observations to draw a continuous line.</p>}
            <p className="mt-3 text-xs leading-5 text-[#b9ccc3]">Up = signs of progress; Steady = consistent patterns; Down = areas needing attention. Gaps represent insufficient evidence. This line joins qualitative classifications, not measured performance.</p>
          </div>
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
                      <p className="mt-3 text-sm leading-6 text-[#cfddd4]">{formatCoachingEvidence(latestObservation.evidence, displayName) || "No supporting explanation recorded."}</p>
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
