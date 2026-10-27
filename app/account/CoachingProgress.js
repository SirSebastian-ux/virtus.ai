"use client";

import { useEffect, useState } from "react";

const labels = { improving: "Improving", declining: "Needs attention", stable: "Stable", unclear: "Not enough evidence" };
const tones = { improving: "text-emerald-300", declining: "text-amber-300", stable: "text-sky-300", unclear: "text-slate-300" };

export default function CoachingProgress() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function review() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/account/coaching-progress", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Review unavailable");
      setResult(body);
    } catch (err) {
      setError(err.message || "Review unavailable");
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="rounded-2xl border border-[#d8bd85]/25 bg-[#102b28] p-5 text-[#f5f3ec]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Your coaching development</h3>
          <p className="mt-1 max-w-xl text-sm text-[#b8cbc5]">Review changes in your expressed reasoning and reflection across conversations. The review is private and evidence-based.</p>
        </div>
        <button type="button" onClick={review} disabled={loading} className="rounded-xl border border-[#d8bd85]/60 bg-[#d8bd85] px-4 py-2 font-medium text-[#0c2421] disabled:opacity-60">{loading ? "Reviewing..." : result ? "Refresh review" : "Review my progress"}</button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-amber-300">{error}</p>}
      {result?.status === "insufficient_evidence" && <p className="mt-4 text-sm text-[#b8cbc5]">More conversation history is needed for a meaningful review. Keep reflecting in chat.</p>}
      {result?.status === "reviewed" && (
        <div className="mt-5 space-y-3">
          <p className="text-xs text-[#b8cbc5]">Reviewed {result.count} messages{result.firstDate ? ` since ${new Date(result.firstDate).toLocaleDateString()}` : ""}. {result.note}</p>
          {result.observations.length === 0 && <p className="text-sm text-[#b8cbc5]">No defensible skill trends identified yet.</p>}
          {result.observations.map((item, index) => (
            <div key={index} className="rounded-xl border border-[#d8bd85]/15 bg-[#081c1b] p-4">
              <div className="flex flex-wrap justify-between gap-2"><strong>{item.skill}</strong><span className={tones[item.direction] || tones.unclear}>{labels[item.direction] || labels.unclear} · {item.confidence} confidence</span></div>
              <p className="mt-2 text-sm text-[#b8cbc5]">{item.evidence}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-[#b8cbc5]">AI observations are not clinical assessments, fixed ability scores, or proof of personal improvement or decline.</p>
    </section>
  );
}
