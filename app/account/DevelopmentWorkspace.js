"use client";

import { useCallback, useEffect, useState } from "react";
import { DEVELOPMENT_DOMAINS, selfRatedTrajectory } from "@/lib/virtus-development.mjs";

const initialGoal = {
  title: "", focus_domain: "self_awareness", observed_behavior: "",
  desired_behavior: "", baseline_rating: 3,
};

async function send(body) {
  const response = await fetch("/api/account/development", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Unable to save.");
  return result;
}

export default function DevelopmentWorkspace() {
  const [goals, setGoals] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [goalForm, setGoalForm] = useState(initialGoal);
  const [activeGoal, setActiveGoal] = useState(null);
  const [rating, setRating] = useState(3);
  const [evidence, setEvidence] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/account/development", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Unable to load your development.");
    setGoals(payload.goals || []);
    setCheckins(payload.checkins || []);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/account/development", { cache: "no-store" })
      .then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.error || "Unable to load."); return body; })
      .then((body) => { if (!active) return; setGoals(body.goals || []); setCheckins(body.checkins || []); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function act(body, callback) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await send(body);
      await refresh();
      callback?.();
      setNotice("Your development record was saved.");
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  }

  return (
    <section className="mt-6 rounded-3xl border border-[#d8bd85]/50 bg-gradient-to-br from-[#06392e] to-[#071d1c] p-5 text-[#f6f1e4] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#dfc88a]">Virtus Cognitive Development</p>
          <h2 className="mt-2 font-serif text-2xl text-[#f7e4b1]">My Development</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d1dfd5]">Define an observable behavior, choose how you want to respond, and review what actually happens. Your goals and ratings are authored by you—not inferred diagnoses.</p>
        </div>
        <button type="button" onClick={() => setCreating((v) => !v)}
          className="rounded-xl bg-[#e8ca87] px-4 py-3 text-sm font-bold text-[#082820]">
          {creating ? "Close goal form" : "+ Define a goal"}
        </button>
      </div>
      {loading && <p className="mt-4 text-sm">Loading development records...</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/60 bg-red-950/30 p-3 text-sm text-red-100">{error}</p>}
      {notice && <p role="status" className="mt-4 text-sm text-emerald-200">{notice}</p>}
      {creating && (
        <form className="mt-6 grid gap-3 rounded-2xl border border-[#bca16d]/40 bg-[#082621] p-4"
          onSubmit={(e) => { e.preventDefault(); void act({ type: "goal", ...goalForm }, () => { setGoalForm(initialGoal); setCreating(false); }); }}>
          <label className="text-sm">Goal title
            <input required minLength={4} maxLength={120} value={goalForm.title} onChange={(e) => setGoalForm({...goalForm,title:e.target.value})}
              className="mt-2 w-full rounded-lg border border-[#9e9165] bg-[#0d3730] p-3 text-white" placeholder="e.g. Respond calmly to disagreement" />
          </label>
          <label className="text-sm">Development area
            <select value={goalForm.focus_domain} onChange={(e) => setGoalForm({...goalForm,focus_domain:e.target.value})}
              className="mt-2 block w-full rounded-lg border border-[#9e9165] bg-[#0d3730] p-3 text-white">
              {DEVELOPMENT_DOMAINS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </label>
          <label className="text-sm">What do you currently observe yourself doing?
            <textarea required minLength={10} maxLength={500} rows={3} value={goalForm.observed_behavior}
              onChange={(e) => setGoalForm({...goalForm,observed_behavior:e.target.value})}
              className="mt-2 w-full rounded-lg border border-[#9e9165] bg-[#0d3730] p-3 text-white" />
          </label>
          <label className="text-sm">What response would you like to practice?
            <textarea required minLength={10} maxLength={500} rows={3} value={goalForm.desired_behavior}
              onChange={(e) => setGoalForm({...goalForm,desired_behavior:e.target.value})}
              className="mt-2 w-full rounded-lg border border-[#9e9165] bg-[#0d3730] p-3 text-white" />
          </label>
          <label className="text-sm">Current self-rating (1 = rarely demonstrated, 5 = consistently demonstrated)
            <select value={goalForm.baseline_rating} onChange={(e) => setGoalForm({...goalForm,baseline_rating:Number(e.target.value)})}
              className="mt-2 block w-full rounded-lg border border-[#9e9165] bg-[#0d3730] p-3 text-white">
              {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
            </select>
          </label>
          <button disabled={busy} className="rounded-xl bg-[#e8ca87] px-4 py-3 font-semibold text-[#082820] disabled:opacity-50">Save my goal</button>
        </form>
      )}
      <div className="mt-5 space-y-4">
        {goals.length === 0 && !loading && <p className="rounded-xl border border-[#cfb576]/30 p-4 text-sm text-[#d1dfd5]">No development goals yet. Start with one situation in which you want to respond differently.</p>}
        {goals.map((goal) => {
          const records = checkins.filter((item) => item.goal_id === goal.id);
          const points = selfRatedTrajectory(goal, records);
          const latest = points[points.length - 1];
          return (
            <article key={goal.id} className="rounded-2xl border border-[#cfb576]/30 bg-[#082621] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-[#e9cc92]">{DEVELOPMENT_DOMAINS.find((d) => d.key === goal.focus_domain)?.label || "Development"}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{goal.title}</h3>
                </div>
                <span className="rounded-full border border-[#bda16a]/50 px-3 py-1 text-xs text-[#f4d99d]">{goal.status}</span>
              </div>
              <p className="mt-3 text-sm leading-6"><strong>Current pattern:</strong> {goal.observed_behavior}</p>
              <p className="mt-2 text-sm leading-6"><strong>Chosen response:</strong> {goal.desired_behavior}</p>
              <p className="mt-3 text-sm text-[#d0e0d5]">Self-rated progress: {goal.baseline_rating}/5 baseline → {latest.rating}/5 latest · {records.length} check-ins</p>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[#184b40]" aria-label={`Latest self-rating ${latest.rating} of 5`}>
                <div className="rounded-full bg-[#dec184]" style={{width:`${Number(latest.rating)*20}%`}} />
              </div>
              {records[0] && (
                <p className="mt-3 text-xs leading-5 text-[#c3d4ca]">
                  <strong>Most recent reflection:</strong> {records[0].evidence} · Next: {records[0].next_action}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {goal.status === "active" && (
                  <button type="button" onClick={() => { setActiveGoal(activeGoal === goal.id ? null : goal.id); setRating(latest.rating); setEvidence(""); setNextAction(""); }}
                    className="rounded-lg border border-[#d8bd85] px-4 py-2 text-sm text-[#f8e6b7]">
                    {activeGoal === goal.id ? "Close reflection" : "+ Record a check-in"}
                  </button>
                )}
                <button type="button" disabled={busy}
                  onClick={() => void act({type:"status",goal_id:goal.id,status:goal.status==="active"?"paused":"active"})}
                  className="rounded-lg border border-white/25 px-4 py-2 text-sm text-[#d3e1d7] disabled:opacity-40">
                  {goal.status==="active" ? "Pause" : "Resume"}
                </button>
                {goal.status !== "completed" && <button type="button" disabled={busy}
                  onClick={() => void act({type:"status",goal_id:goal.id,status:"completed"})}
                  className="rounded-lg border border-white/25 px-4 py-2 text-sm text-[#d3e1d7] disabled:opacity-40">Mark complete</button>}
              </div>
              {activeGoal === goal.id && goal.status === "active" && (
                <form className="mt-4 space-y-3 rounded-xl border border-[#a88b57]/40 p-4"
                  onSubmit={(e) => { e.preventDefault(); void act({type:"checkin",goal_id:goal.id,rating,evidence,next_action:nextAction}, () => {setActiveGoal(null); setEvidence(""); setNextAction("");}); }}>
                  <label className="block text-sm">How often did you demonstrate the chosen response?
                    <select value={rating} onChange={(e) => setRating(Number(e.target.value))}
                      className="mt-2 block w-full rounded-lg border border-[#9e9165] bg-[#0d3730] p-3">
                      {[1,2,3,4,5].map((n)=><option key={n} value={n}>{n}/5</option>)}
                    </select>
                  </label>
                  <label className="block text-sm">What actually happened? Give observable evidence.
                    <textarea required minLength={10} maxLength={1000} value={evidence} onChange={(e)=>setEvidence(e.target.value)} rows={3}
                      className="mt-2 block w-full rounded-lg border border-[#9e9165] bg-[#0d3730] p-3" />
                  </label>
                  <label className="block text-sm">What will you practice next?
                    <textarea required minLength={5} maxLength={500} value={nextAction} onChange={(e)=>setNextAction(e.target.value)} rows={2}
                      className="mt-2 block w-full rounded-lg border border-[#9e9165] bg-[#0d3730] p-3" />
                  </label>
                  <button disabled={busy} className="rounded-lg bg-[#e8ca87] px-4 py-3 font-semibold text-[#082820] disabled:opacity-50">Save reflection</button>
                </form>
              )}
            </article>
          );
        })}
      </div>
      <p className="mt-5 text-xs leading-5 text-[#c0d4c9]">This workspace contains client-authored goals and self-reported observations. A change in self-rating does not establish clinical improvement or a validated psychological result. Records remain private to your account.</p>
    </section>
  );
}
