"use client";

import { useState } from "react";

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-sky-900/20 bg-black/25 px-4 py-4 text-left shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-zinc-950/55"
    >
      <div>
        <p className="text-sm font-medium text-sky-100">{title}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-400">{description}</p>
      </div>

      <div
        className={`h-6 w-11 rounded-full border p-1 transition ${
          checked
            ? "border-sky-700/60 bg-sky-900/50"
            : "border-zinc-700 bg-zinc-800/70"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full transition ${
            checked
              ? "translate-x-5 bg-sky-200"
              : "translate-x-0 bg-zinc-400"
          }`}
        />
      </div>
    </button>
  );
}

export default function ReasoningPreferencesForm({
  initialPrefersExplicitUncertainty = true,
  initialAskBeforePsychologicalInference = true,
  initialAskBeforeSpiritualInference = true,
  initialAllowPatternChallengeWithoutConfirmation = true,
  initialPreferredDirectness = "direct",
  initialDomainsRequiringExtraCaution = ["psychology", "spirituality"],
}) {
  const [prefersExplicitUncertainty, setPrefersExplicitUncertainty] = useState(
    initialPrefersExplicitUncertainty
  );
  const [
    askBeforePsychologicalInference,
    setAskBeforePsychologicalInference,
  ] = useState(initialAskBeforePsychologicalInference);
  const [askBeforeSpiritualInference, setAskBeforeSpiritualInference] =
    useState(initialAskBeforeSpiritualInference);
  const [
    allowPatternChallengeWithoutConfirmation,
    setAllowPatternChallengeWithoutConfirmation,
  ] = useState(initialAllowPatternChallengeWithoutConfirmation);
  const [preferredDirectness, setPreferredDirectness] = useState(
    initialPreferredDirectness
  );
  const [domainsText, setDomainsText] = useState(
    Array.isArray(initialDomainsRequiringExtraCaution)
      ? initialDomainsRequiringExtraCaution.join(", ")
      : "psychology, spirituality"
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSave() {
    setSaving(true);
    setStatus("");

    const domainsRequiringExtraCaution = domainsText
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const res = await fetch("/api/account/reasoning-preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefersExplicitUncertainty,
        askBeforePsychologicalInference,
        askBeforeSpiritualInference,
        allowPatternChallengeWithoutConfirmation,
        preferredDirectness,
        domainsRequiringExtraCaution,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setStatus(data.error || "Failed to save reasoning settings.");
    } else {
      setStatus("Reasoning settings saved.");
    }

    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <ToggleRow
        title="Use explicit uncertainty"
        description="Virtus will separate facts from interpretations and avoid sounding certain when something is only inferred."
        checked={prefersExplicitUncertainty}
        onChange={setPrefersExplicitUncertainty}
      />

      <ToggleRow
        title="Ask before psychological inference"
        description="Virtus will be more careful before making deep psychological interpretations."
        checked={askBeforePsychologicalInference}
        onChange={setAskBeforePsychologicalInference}
      />

      <ToggleRow
        title="Ask before spiritual inference"
        description="Virtus will be more careful before making deep spiritual interpretations."
        checked={askBeforeSpiritualInference}
        onChange={setAskBeforeSpiritualInference}
      />

      <ToggleRow
        title="Allow pattern challenge"
        description="Virtus may challenge visible patterns without waiting for full confirmation, but still must not present guesses as facts."
        checked={allowPatternChallengeWithoutConfirmation}
        onChange={setAllowPatternChallengeWithoutConfirmation}
      />

      <div className="rounded-2xl border border-sky-900/20 bg-black/25 px-4 py-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-300/50">
          Preferred directness
        </p>

        <select
          value={preferredDirectness}
          onChange={(e) => setPreferredDirectness(e.target.value)}
          className="mt-3 w-full rounded-2xl border border-sky-900/25 bg-zinc-950/45 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-800/50 focus:bg-zinc-950/65"
        >
          <option value="gentle">Gentle</option>
          <option value="balanced">Balanced</option>
          <option value="direct">Direct</option>
          <option value="strong">Strong</option>
        </select>
      </div>

      <div className="rounded-2xl border border-sky-900/20 bg-black/25 px-4 py-4 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-300/50">
          Domains requiring extra caution
        </p>

        <input
          value={domainsText}
          onChange={(e) => setDomainsText(e.target.value)}
          placeholder="psychology, spirituality, trauma"
          className="mt-3 w-full rounded-2xl border border-sky-900/25 bg-zinc-950/45 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-sky-800/50 focus:bg-zinc-950/65"
        />

        <p className="mt-2 text-xs leading-5 text-zinc-500">
          Separate domains with commas.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl border border-sky-900/30 bg-sky-950/20 px-4 py-2 text-sm text-sky-200 transition hover:border-sky-800/40 hover:bg-sky-950/35 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save reasoning settings"}
        </button>

        {status ? <p className="text-sm text-sky-300/70">{status}</p> : null}
      </div>
    </div>
  );
}