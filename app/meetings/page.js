"use client";

import Link from "next/link";
import { useState } from "react";

const platforms = ["Zoom", "Google Meet", "Microsoft Teams"];

export default function MeetingsLobbyPage() {
  const [meetingLink, setMeetingLink] = useState("");
  const [virtusLink, setVirtusLink] = useState("");

  async function createVirtusMeetingLink() {
    const response = await fetch("/api/meetings", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Meeting could not be created.");
      return;
    }

    const link = `${window.location.origin}${data.meetingLink}`;
    setVirtusLink(link);
  }

  async function copyVirtusMeetingLink() {
    if (!virtusLink) return;
    await navigator.clipboard.writeText(virtusLink);
  }

  function enterVirtusRoom() {
    if (virtusLink) {
      window.location.href = virtusLink;
      return;
    }

    window.location.href = "/meetings/room";
  }

  function joinExternalMeeting() {
    const cleanLink = meetingLink.trim();

    if (!cleanLink) return;

    if (cleanLink.startsWith("https://") || cleanLink.startsWith("http://")) {
      window.open(cleanLink, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex rounded-full border border-sky-900/40 bg-sky-950/20 px-4 py-2 text-sm text-sky-100"
        >
          Back to Virtus AI
        </Link>

        <section className="mt-8 rounded-3xl border border-sky-900/30 bg-black/35 p-6 shadow-2xl shadow-sky-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/70">
            Virtus Meetings Lobby
          </p>

          <h1 className="mt-4 text-4xl font-semibold text-sky-100 md:text-6xl">
            Join or Create a Meeting
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
            Paste a Zoom, Google Meet, or Microsoft Teams link, or enter the Virtus room foundation.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
              placeholder="Paste Zoom, Google Meet, or Teams link here..."
              className="w-full rounded-2xl border border-sky-900/30 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            />

            <button
              type="button"
              onClick={joinExternalMeeting}
              className="rounded-2xl border border-sky-700/40 bg-sky-950/35 px-5 py-3 text-sm font-medium text-sky-100"
            >
              Join External Meeting
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={createVirtusMeetingLink}
              className="rounded-2xl border border-sky-700/40 bg-sky-950/35 px-5 py-3 text-sm font-medium text-sky-100"
            >
              Create Virtus Meeting Link
            </button>

            <button
              type="button"
              onClick={copyVirtusMeetingLink}
              disabled={!virtusLink}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-3 text-sm font-medium text-zinc-300 disabled:opacity-50"
            >
              Copy Link
            </button>

            <button
              type="button"
              onClick={enterVirtusRoom}
              className="rounded-2xl border border-sky-700/40 bg-sky-950/35 px-5 py-3 text-sm font-medium text-sky-100"
            >
              Enter Virtus Meeting Room
            </button>
          </div>

          {virtusLink && (
            <p className="mt-4 break-all rounded-2xl border border-sky-900/25 bg-zinc-950/70 px-4 py-3 text-sm text-sky-100/80">
              {virtusLink}
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {platforms.map((platform) => (
            <div
              key={platform}
              className="rounded-3xl border border-sky-900/25 bg-black/30 p-4"
            >
              <h2 className="text-xl font-semibold text-sky-100">{platform}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                External meeting support foundation. Later Virtus can connect calendars,
                reminders, summaries, and meeting records.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
