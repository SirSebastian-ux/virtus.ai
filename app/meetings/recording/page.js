"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  deleteMeetingRecording,
  getMeetingRecording,
  listMeetingRecordings,
} from "./localRecordingStore";

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildSimpleMeetingNotes(recording) {
  const transcript = String(recording?.transcript || "").trim();
  const chatMessages = Array.isArray(recording?.chatMessages)
    ? recording.chatMessages
    : [];

  if (!transcript && !chatMessages.length) {
    return {
      overview: "No transcript or chat text was captured for this recording yet.",
      takeaways: ["Review the video manually and add notes after watching."],
      actions: ["Watch the recording and write the key decisions."],
    };
  }

  const transcriptPreview = transcript
    ? transcript.split(/\s+/).slice(0, 70).join(" ")
    : "The meeting has no transcript text yet.";

  const actions = chatMessages
    .map((message) => String(message?.text || "").trim())
    .filter((text) => /\b(action|todo|next|send|prepare|finish|follow|deadline|task)\b/i.test(text))
    .slice(0, 5);

  return {
    overview: transcriptPreview,
    takeaways: [
      "The full video and audio are available for review.",
      transcript ? "A transcript was captured from the available audio stream." : "Transcript text was not captured yet.",
      chatMessages.length
        ? "Meeting chat messages were saved with the recording."
        : "No meeting chat messages were added during this session.",
    ],
    actions: actions.length ? actions : ["Review the transcript and define the next action manually."],
  };
}

export default function MeetingRecordingReviewPage() {
  const [recordingId] = useState(() => {
    if (typeof window === "undefined") return "";

    const params = new URLSearchParams(window.location.search);
    return params.get("recordingId") || "";
  });
  const [recording, setRecording] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [activeTab, setActiveTab] = useState("notes");
  const [status, setStatus] = useState("Loading recording...");


  useEffect(() => {
    let objectUrl = "";

    async function loadRecording() {
      try {
        const availableRecordings = await listMeetingRecordings();
        setRecordings(availableRecordings);

        if (!recordingId) {
          setStatus(
            availableRecordings.length
              ? "Choose a recording from the list."
              : "No local meeting recordings found yet."
          );
          return;
        }

        const savedRecording = await getMeetingRecording(recordingId);

        if (!savedRecording) {
          setStatus("Recording was not found in this browser.");
          return;
        }

        setRecording(savedRecording);

        if (savedRecording.videoBlob?.size) {
          objectUrl = URL.createObjectURL(savedRecording.videoBlob);
          setVideoUrl(objectUrl);
        }

        setStatus("Recording loaded.");
      } catch (error) {
        setStatus(error?.message || "Could not load recording.");
      }
    }

    loadRecording();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [recordingId]);

  const notes = useMemo(() => buildSimpleMeetingNotes(recording), [recording]);

  async function handleDeleteRecording() {
    if (!recordingId) return;

    await deleteMeetingRecording(recordingId);
    window.location.href = "/meetings/recording";
  }

  function downloadTranscript() {
    if (!recording) return;

    const safeRoomId = recording.roomId || "local-room";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const chatText = (recording.chatMessages || [])
      .map((message) => `${message.name}: ${message.text}`)
      .join("\n");

    const fileText = [
      recording.title || "Virtus Meeting Recording",
      `Room: ${safeRoomId}`,
      `Created: ${recording.createdAt || ""}`,
      `Duration: ${formatDuration(recording.durationSeconds)}`,
      "",
      "Transcript:",
      recording.transcript || "No transcript captured.",
      "",
      "Meeting Chat:",
      chatText || "No chat messages.",
    ].join("\n");

    const blob = new Blob([fileText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `virtus-meeting-transcript-${safeRoomId}-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/meetings"
              className="rounded-full border border-sky-900/40 bg-black/50 px-4 py-2 text-sm text-sky-100"
            >
              Back to Meetings
            </Link>
            <Link
              href="/meetings/room"
              className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200"
            >
              New Recording
            </Link>
          </div>

          <p className="rounded-full border border-zinc-800 bg-black/50 px-4 py-2 text-xs text-zinc-400">
            {status}
          </p>
        </div>

        {!recording && recordings.length > 0 && (
          <section className="mt-6 rounded-3xl border border-sky-900/25 bg-black/35 p-5">
            <h1 className="text-2xl font-semibold text-sky-100">
              Local Meeting Recordings
            </h1>
            <div className="mt-4 grid gap-3">
              {recordings.map((item) => (
                <Link
                  key={item.id}
                  href={`/meetings/recording?recordingId=${item.id}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-200 hover:border-sky-700/40"
                >
                  <span className="block font-semibold text-sky-100">
                    {item.title || "Virtus Meeting Recording"}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {item.createdAt} - {formatDuration(item.durationSeconds)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {recording && (
          <section className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-black shadow-2xl shadow-sky-950/30">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    className="aspect-video w-full bg-black object-contain"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-sm text-zinc-500">
                    No video file found.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-black/55 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-sky-100">
                    Transcript
                  </h2>
                  <button
                    type="button"
                    onClick={downloadTranscript}
                    className="rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-zinc-200"
                  >
                    Download text
                  </button>
                </div>

                <div className="mt-4 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-300">
                  {recording.transcript || "No transcript captured yet."}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-100 p-5 text-zinc-950">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                    Virtus Meeting Review
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold">
                    {recording.title || "Meeting Recording"}
                  </h1>
                  <p className="mt-2 text-sm text-zinc-500">
                    {formatDuration(recording.durationSeconds)} - {recording.createdAt}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteRecording}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700"
                >
                  Delete
                </button>
              </div>

              <div className="mt-5 flex gap-2 border-b border-zinc-300">
                {["notes", "chat", "details"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium ${
                      activeTab === tab
                        ? "border-b-2 border-zinc-950 text-zinc-950"
                        : "text-zinc-500"
                    }`}
                  >
                    {tab === "notes" ? "Notes" : tab === "chat" ? "Chat" : "Details"}
                  </button>
                ))}
              </div>

              {activeTab === "notes" && (
                <div className="mt-6 space-y-6">
                  <section>
                    <h2 className="text-2xl font-semibold">General Summary</h2>
                    <p className="mt-3 border-t border-zinc-300 pt-4 text-base leading-7">
                      {notes.overview}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xl font-semibold">Key Takeaways</h3>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7">
                      {notes.takeaways.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xl font-semibold">Action Items</h3>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7">
                      {notes.actions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}

              {activeTab === "chat" && (
                <div className="mt-6 space-y-3">
                  {(recording.chatMessages || []).map((message, index) => (
                    <div
                      key={`${message.name}-${index}`}
                      className="rounded-2xl border border-zinc-300 bg-white p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {message.name}
                      </p>
                      <p className="mt-2 text-sm leading-6">{message.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "details" && (
                <div className="mt-6 space-y-3 text-sm leading-6 text-zinc-700">
                  <p>
                    <strong>Recording ID:</strong> {recording.id}
                  </p>
                  <p>
                    <strong>Room:</strong> {recording.roomId || "local-room"}
                  </p>
                  <p>
                    <strong>Created:</strong> {recording.createdAt}
                  </p>
                  <p>
                    <strong>Duration:</strong> {formatDuration(recording.durationSeconds)}
                  </p>
                  <p>
                    <strong>Storage:</strong> Saved locally in this browser.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
