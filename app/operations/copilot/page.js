"use client";

import Link from "next/link";
import { useState } from "react";

const suggestedQuestions = [
  "What are the biggest risks today?",
  "What decisions need leadership attention?",
  "Which tasks are overdue?",
  "Show me critical alerts.",
  "How many reports were submitted today?",
];

export default function OperationsCopilotPage() {
  const [workspaceId, setWorkspaceId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("virtus_operations_workspace_id") || "";
  });
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [intent, setIntent] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [sources, setSources] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function askCopilot(event) {
    event?.preventDefault();

    const cleanWorkspaceId = workspaceId.trim();
    const cleanQuestion = question.trim();

    if (!cleanWorkspaceId || !cleanQuestion) {
      setStatusMessage("Workspace ID and question are required.");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      window.localStorage.setItem("virtus_operations_workspace_id", cleanWorkspaceId);

      const response = await fetch("/api/operations/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          workspaceId: cleanWorkspaceId,
          question: cleanQuestion,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to ask Operations Copilot.");
      }

      setAnswer(payload.answer || "");
      setIntent(payload.intent || "");
      setMetrics(payload.metrics || null);
      setSources(payload.sources || []);
      setRecommendations(payload.recommendations || []);
    } catch (error) {
      setStatusMessage(error.message);
      setAnswer("");
      setIntent("");
      setMetrics(null);
      setSources([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  function askSuggested(nextQuestion) {
    setQuestion(nextQuestion);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <Link href="/operations" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            ← Back to Operations
          </Link>

          <div className="mt-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
              Operations AI Copilot
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
              Conversational executive intelligence
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              Ask operational questions and receive answers grounded in reports, tasks, urgent issues,
              decision queues, and management alerts.
            </p>
          </div>
        </header>

        {statusMessage ? (
          <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            {statusMessage}
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={askCopilot} className="rounded-3xl border border-white/10 bg-white/10 p-6">
            <h2 className="text-xl font-bold text-white">Ask the Copilot</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Start with executive questions about risk, decisions, tasks, alerts, or daily reporting.
            </p>

            <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Workspace ID
            </label>
            <input
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
              placeholder="Workspace UUID"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-slate-950 outline-none"
            />

            <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Question
            </label>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask: What are the biggest risks today?"
              rows={6}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-slate-950 outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200 disabled:opacity-60"
            >
              {loading ? "Thinking..." : "Ask Copilot"}
            </button>

            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Suggested Questions
              </p>
              {suggestedQuestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => askSuggested(item)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-900"
                >
                  {item}
                </button>
              ))}
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/10 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Copilot Answer</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Grounded in current Operations Intelligence data.
                </p>
              </div>

              {intent ? (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
                  Intent: {intent}
                </span>
              ) : null}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm leading-7 text-slate-200">
                {answer || "Ask a question to generate an operational answer."}
              </p>
            </div>

            {recommendations.length ? (
              <div className="mt-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                  Recommendations
                </h3>
                <div className="mt-3 space-y-2">
                  {recommendations.map((item, index) => (
                    <p key={index} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-300">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {metrics ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Object.entries(metrics).map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                    <p className="text-xs text-slate-500">{key.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {sources.length ? (
              <div className="mt-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                  Sources
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sources.map((source) => (
                    <span key={source} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}
