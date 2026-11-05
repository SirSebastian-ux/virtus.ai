"use client";
import { useEffect, useState } from "react";
import { validateCognitivePattern } from "@/lib/virtus-cognitive-patterns.mjs";

const EMPTY = {
  title: "", observed_situation: "", interpretation: "", response: "",
  alternative_interpretation: "", evidence: "",
};
const FIELDS = [
  ["title", "Short name", "e.g. I interpret disagreement as rejection", 120],
  ["observed_situation", "What actually happened?", "Describe the observable event, not a diagnosis.", 600],
  ["interpretation", "What meaning did you assign?", "Record your interpretation, including uncertainty.", 600],
  ["response", "What did you feel, say or do?", "Describe your response as accurately as possible.", 600],
  ["alternative_interpretation", "What alternative interpretation is plausible?", "A possible explanation, not forced positivity.", 600],
  ["evidence", "What evidence supports or challenges this reflection?", "Use actual examples; separate facts from beliefs.", 1000],
];
async function send(action, data) {
  const response = await fetch("/api/account/cognitive-patterns", {
    method: action,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Unable to update reflection.");
  return body;
}
export default function CognitivePatternsWorkspace() {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/account/cognitive-patterns", { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Could not load reflections.");
    setPatterns(body.patterns || []);
  }
  useEffect(() => {
    let active = true;
    fetch("/api/account/cognitive-patterns", { cache: "no-store" })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to load."); return d; })
      .then(d => { if (active) setPatterns(d.patterns || []); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function revise(pattern) {
    setEditing(pattern.id);
    setForm(Object.fromEntries(Object.keys(EMPTY).map(k => [k, pattern[k] || ""])));
    setOpen(true);
  }
  function cancel() { setOpen(false); setEditing(null); setForm(EMPTY); }
  async function act(method, data, done) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await send(method, data);
      await load();
      done?.();
      setNotice("Reflection updated. Only confirmed reflections can support future coaching.");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function save(event) {
    event.preventDefault();
    const checked = validateCognitivePattern(form);
    if (checked.error) { setError(checked.error); return; }
    void act(editing ? "PATCH" : "POST", editing
      ? { type: "revise", id: editing, ...checked.value } : checked.value, cancel);
  }
  return (
    <section className="mt-6 rounded-3xl border border-[#d8bd85]/45 bg-gradient-to-br from-[#0b332c] to-[#061e1c] p-5 text-[#f7f0df] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d9bc82]">Psychological Pattern Intelligence</p>
          <h2 className="mt-2 font-serif text-2xl">My Reflection Patterns</h2>
          <p className="mt-2 text-sm leading-6 text-[#d1ded5]">
            Observe situations, assumptions, responses and alternative interpretations.
            You control whether Virtus may use each reflection in future coaching.
            These are hypotheses, not fixed traits or diagnoses.
          </p>
        </div>
        <button type="button" onClick={() => open ? cancel() : setOpen(true)}
          className="rounded-xl border border-[#e8c98c] px-4 py-3 text-sm font-semibold text-[#f5db9f]">
          {open ? "Close" : "+ Add reflection"}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-400/50 bg-red-950/30 px-3 py-2 text-sm text-red-100">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-emerald-200">{notice}</p>}
      {open && (
        <form onSubmit={save} className="mt-5 space-y-4 rounded-2xl border border-[#d8bd85]/35 bg-[#082720] p-4">
          <p className="text-sm font-semibold text-[#e8cc91]">{editing ? "Revise a reflection (requires new confirmation)" : "Create a private draft"}</p>
          {FIELDS.map(([key, label, placeholder, max]) => (
            <label key={key} className="block text-sm">
              {label}
              {key === "title"
                ? <input required minLength={4} maxLength={max} value={form[key]} placeholder={placeholder}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-[#bca16f]/60 bg-[#0c3d32] p-3 text-white placeholder:text-[#aac4b6]" />
                : <textarea required minLength={10} maxLength={max} value={form[key]} rows={2} placeholder={placeholder}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-[#bca16f]/60 bg-[#0c3d32] p-3 text-white placeholder:text-[#aac4b6]" />
              }
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} className="rounded-xl bg-[#e8ca87] px-5 py-3 text-sm font-bold text-[#072d24] disabled:opacity-50">
              {editing ? "Save revision as unconfirmed" : "Save private draft"}
            </button>
            <button type="button" onClick={cancel} className="rounded-xl border border-white/35 px-4 py-3 text-sm">Cancel</button>
          </div>
        </form>
      )}
      {loading && <p className="mt-4 text-sm">Loading reflections...</p>}
      {!loading && !patterns.length && <p className="mt-4 text-sm text-[#d1ded5]">No pattern reflections recorded. You can begin with a real interaction and examine its interpretation.</p>}
      <div className="mt-5 space-y-3">
        {patterns.map(pattern => (
          <article key={pattern.id} className="rounded-xl border border-[#bb9c67]/35 bg-[#082720] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h3 className="font-semibold">{pattern.title}</h3>
                <p className="mt-1 text-xs capitalize text-[#e8c98c]">{pattern.status === "confirmed" ? "Confirmed by you" : pattern.status === "rejected" ? "Rejected by you" : "Draft — not used by AI"}</p>
              </div>
              <button type="button" disabled={busy} onClick={() => revise(pattern)} className="text-xs underline underline-offset-4 text-[#f1d99f]">Edit</button>
            </div>
            <details className="mt-3 text-sm text-[#dce7de]">
              <summary className="cursor-pointer text-[#ecd49d]">Review the evidence and interpretations</summary>
              <div className="mt-3 space-y-2 text-sm leading-6">
                <p><strong>Observed:</strong> {pattern.observed_situation}</p>
                <p><strong>Interpreted:</strong> {pattern.interpretation}</p>
                <p><strong>Response:</strong> {pattern.response}</p>
                <p><strong>Alternative:</strong> {pattern.alternative_interpretation}</p>
                <p><strong>Evidence:</strong> {pattern.evidence}</p>
              </div>
            </details>
            <div className="mt-4 flex flex-wrap gap-2">
              {pattern.status !== "confirmed" &&
                <button type="button" disabled={busy}
                  onClick={() => void act("PATCH",{id:pattern.id,status:"confirmed"})}
                  className="rounded-lg border border-emerald-400/65 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-50">
                  Confirm for future coaching
                </button>}
              {pattern.status !== "rejected" &&
                <button type="button" disabled={busy}
                  onClick={() => void act("PATCH",{id:pattern.id,status:"rejected"})}
                  className="rounded-lg border border-[#d8bd85]/40 px-3 py-2 text-xs text-[#f4ddb4] disabled:opacity-50">
                  Reject interpretation
                </button>}
              <button type="button" disabled={busy}
                onClick={() => { if (window.confirm("Permanently delete this reflection?")) void act("DELETE",{id:pattern.id}); }}
                className="rounded-lg border border-red-400/50 px-3 py-2 text-xs text-red-200 disabled:opacity-50">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#c8d7cb]">Confirmed reflections may inform future coaching only when personal memory is enabled. Revision removes confirmation until you reconfirm. Rejected reflections are excluded.</p>
    </section>
  );
}
