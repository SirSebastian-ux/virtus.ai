"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function MeetingsPrejoinPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);

  useEffect(() => {
    async function startPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        setCameraOn(true);
        setMicOn(true);
      } catch {
        setCameraOn(false);
        setMicOn(false);
      }
    }

    startPreview();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function toggleCamera() {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  }

  function toggleMic() {
    const track = streamRef.current?.getAudioTracks?.()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }

  function joinRoom() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room") || "";
    window.location.href = room ? `/meetings/room?room=${room}` : "/meetings/room";
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/meetings"
          className="inline-flex rounded-full border border-sky-900/40 bg-sky-950/20 px-4 py-2 text-sm text-sky-100"
        >
          Back to Meetings
        </Link>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div className="overflow-hidden rounded-3xl border border-sky-900/30 bg-black shadow-2xl shadow-sky-950/30">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-[420px] w-full object-cover"
            />

            <div className="flex items-center justify-center gap-4 bg-black/80 p-4">
              <button
                type="button"
                onClick={toggleMic}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-950"
                title={micOn ? "Mute microphone" : "Unmute microphone"}
              >
                {micOn ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <path d="M12 19v3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 5 2.2" />
                    <path d="M19 10v2a7 7 0 0 1-.7 3" />
                    <path d="M12 19v3" />
                    <path d="M4 4l16 16" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-950"
                title={cameraOn ? "Turn camera off" : "Turn camera on"}
              >
                {cameraOn ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="6" width="13" height="12" rx="2" />
                    <path d="m16 10 5-3v10l-5-3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="6" width="13" height="12" rx="2" />
                    <path d="m16 10 5-3v10l-5-3" />
                    <path d="M4 4l16 16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-sky-900/25 bg-black/35 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/70">
              Virtus Meeting Preview
            </p>

            <h1 className="mt-4 text-4xl font-semibold text-sky-100">
              Ready to join?
            </h1>

            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Check your camera and microphone before entering the Virtus meeting room.
            </p>

            <button
              type="button"
              onClick={joinRoom}
              className="mt-6 w-full rounded-2xl border border-sky-700/40 bg-sky-950/40 px-5 py-4 text-sm font-semibold text-sky-100"
            >
              Join Now
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
