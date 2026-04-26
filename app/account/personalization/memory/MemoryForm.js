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

export default function MemoryForm({
  initialMemoryEnabled = true,
  initialChatHistoryEnabled = true,
  initialRecordHistoryEnabled = true,
}) {
  const [memoryEnabled, setMemoryEnabled] = useState(initialMemoryEnabled);
  const [chatHistoryEnabled, setChatHistoryEnabled] = useState(
    initialChatHistoryEnabled
  );
  const [recordHistoryEnabled, setRecordHistoryEnabled] = useState(
    initialRecordHistoryEnabled
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSave() {
    setSaving(true);
    setStatus("");

    const res = await fetch("/api/account/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memoryEnabled,
        chatHistoryEnabled,
        recordHistoryEnabled,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setStatus(data.error || "Failed to save memory settings.");
    } else {
      setStatus("Memory settings saved.");
    }

    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <ToggleRow
        title="Save and use memory"
        description="Allow Virtus to remember durable details about you."
        checked={memoryEnabled}
        onChange={setMemoryEnabled}
      />

      <ToggleRow
        title="Use chat history"
        description="Allow Virtus to use earlier messages from the current conversation."
        checked={chatHistoryEnabled}
        onChange={setChatHistoryEnabled}
      />

      <ToggleRow
        title="Record new history"
        description="Allow Virtus to save new durable profile details when appropriate."
        checked={recordHistoryEnabled}
        onChange={setRecordHistoryEnabled}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl border border-sky-900/30 bg-sky-950/20 px-4 py-2 text-sm text-sky-200 transition hover:border-sky-800/40 hover:bg-sky-950/35 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save memory settings"}
        </button>

        {status ? <p className="text-sm text-sky-300/70">{status}</p> : null}
      </div>
    </div>
  );
}