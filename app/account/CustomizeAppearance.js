"use client";

import { useEffect, useState } from "react";

const APPEARANCE_KEY = "virtus_appearance";

function applyAppearance(value) {
  localStorage.setItem(APPEARANCE_KEY, value);
  document.documentElement.setAttribute("data-virtus-appearance", value);
  window.dispatchEvent(
    new CustomEvent("virtus-appearance-change", { detail: value })
  );
}

export default function CustomizeAppearance() {
  const [appearance, setAppearance] = useState("dark");

  useEffect(() => {
    const savedAppearance = localStorage.getItem(APPEARANCE_KEY);

    if (savedAppearance === "light" || savedAppearance === "dark") {
      setAppearance(savedAppearance);
      document.documentElement.setAttribute(
        "data-virtus-appearance",
        savedAppearance
      );
    } else {
      document.documentElement.setAttribute("data-virtus-appearance", "dark");
    }
  }, []);

  function chooseAppearance(value) {
    setAppearance(value);
    applyAppearance(value);
  }

  return (
    <div className="rounded-3xl border border-sky-900/20 bg-zinc-950/35 p-5 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-300/50">
          Customize
        </p>
        <h3 className="mt-2 text-lg font-semibold text-sky-100">
          Appearance
        </h3>
        <p className="mt-1 text-sm virtus-theme-muted">
          Choose how Virtus looks on your device.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => chooseAppearance("dark")}
          className={`rounded-2xl border p-4 text-left transition ${
            appearance === "dark"
              ? "border-sky-600/60 bg-sky-950/30 shadow-sm shadow-sky-950/20"
              : "border-zinc-800 bg-zinc-950/30 hover:border-sky-800/40 hover:bg-zinc-950/50"
          }`}
        >
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 h-3 w-20 rounded-full bg-sky-400/70" />
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-zinc-100/90" />
              <div className="h-2 w-4/5 rounded-full bg-zinc-400/80" />
              <div className="h-2 w-3/5 rounded-full bg-zinc-600/80" />
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-sky-100">
            Virtus Dark
          </p>
          <p className="mt-1 text-sm leading-6 virtus-theme-muted">
            Premium dark grey, white writing, and sky-blue accents.
          </p>
        </button>

        <button
          type="button"
          onClick={() => chooseAppearance("light")}
          className={`rounded-2xl border p-4 text-left transition ${
            appearance === "light"
              ? "border-sky-500/70 bg-sky-950/20 shadow-sm shadow-sky-950/10"
              : "border-zinc-800 bg-zinc-950/30 hover:border-sky-800/40 hover:bg-zinc-950/50"
          }`}
        >
          <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4">
            <div className="mb-3 h-3 w-20 rounded-full bg-sky-500/80" />
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-zinc-900/90" />
              <div className="h-2 w-4/5 rounded-full bg-zinc-500/80" />
              <div className="h-2 w-3/5 rounded-full bg-zinc-300/90" />
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-sky-100">
            Virtus Light
          </p>
          <p className="mt-1 text-sm leading-6 virtus-theme-muted">
            Light clarity, dark readable writing, and soft sky-blue accents.
          </p>
        </button>
      </div>
    </div>
  );
}
