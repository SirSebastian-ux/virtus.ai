"use client";

import { useEffect, useState } from "react";

const SKILLS = ["Self-awareness", "Emotional regulation", "Critical thinking", "Metacognition", "Accountability", "Communication"];
const values = { improving: 1, stable: 0, declining: -1 };

export default function CoachingHistory() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    fetch("/api/account/coaching-history", { cache: "no-store" })
      .then(async r => { if (!r.ok) throw new Error("History unavailable"); return r.json(); })
      .then(body => { if (mounted) setReviews(body.reviews || []); })
      .catch(e => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, []);
  const first = reviews[0];
  return (
    <section className="rounded-2xl border border-[#d8bd85]/25 bg-[#102b28] p-5 text-[#f5f3ec]">
      <h3 className="text-lg font-semibold">Development history</h3>
      <p className="mt-1 text-xs text-[#b8cbc5]">Dated AI observations of conversational development. Changes represent coaching signals, not validated psychometric scores.</p>
      {error && <p role="alert" className="mt-3 text-amber-300">{error}</p>}
      {!error && !reviews.length && <p className="mt-3 text-sm text-[#b8cbc5]">Your progress timeline begins when you request your first coaching review.</p>}
      {first && <p className="mt-3 text-sm text-[#e8c985]">First review: {new Date(first.created_at).toLocaleDateString()} · Latest review: {new Date(reviews.at(-1).created_at).toLocaleDateString()}</p>}
      <div className="mt-4 space-y-4">
        {SKILLS.map(skill => {
          const points = reviews.map(r => {
            const item = (r.observations || []).find(o => o.skill?.toLowerCase() === skill.toLowerCase());
            return { date: r.created_at, value: item ? values[item.direction] : undefined, confidence: item?.confidence };
          }).filter(p => p.value !== undefined);
          if (!points.length) return null;
          return <div key={skill} className="rounded-xl border border-[#d8bd85]/15 bg-[#081c1b] p-4">
            <p className="mb-3 text-sm font-medium">{skill}</p>
            <div className="flex items-center gap-2" aria-label={skill + " coaching observations"}>
              {points.map((p, index) => <div key={index} className="min-w-0 flex-1 text-center">
                <div title={new Date(p.date).toLocaleDateString() + " · " + (p.value > 0 ? "Improving" : p.value < 0 ? "Declining" : "Stable") + " · " + p.confidence + " confidence"} className={"h-7 rounded-md " + (p.value > 0 ? "bg-emerald-500/70" : p.value < 0 ? "bg-amber-500/70" : "bg-sky-500/60")} />
                <p className="mt-1 truncate text-[10px] text-[#b8cbc5]">{new Date(p.date).toLocaleDateString()}</p>
              </div>)}
            </div>
          </div>;
        })}
      </div>
    </section>
  );
}
