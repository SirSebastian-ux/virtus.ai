"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const reactions = [
  { label: "Like", icon: "\uD83D\uDC4D" },
  { label: "Clap", icon: "\uD83D\uDC4F" },
  { label: "Heart", icon: "\u2764\uFE0F" },
  { label: "Smile", icon: "\uD83D\uDE0A" },
  { label: "Fire", icon: "\uD83D\uDD25" },
  { label: "Thanks", icon: "\uD83D\uDE4F" },
];

export default function MeetingsRoomPage() {
  const mainVideoRef = useRef(null);
  const selfVideoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [mediaStatus, setMediaStatus] = useState("Ready.");
  const [roomId] = useState(() => {
    if (typeof window === "undefined") return "";

    return new URLSearchParams(window.location.search).get("room") || "";
  });
  const [roomStatus, setRoomStatus] = useState(() => {
    if (typeof window === "undefined") return "Checking room...";

    const currentRoomId =
      new URLSearchParams(window.location.search).get("room") || "";

    return currentRoomId
      ? "Checking room..."
      : "Local preview room. No shared room link detected.";
  });
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [lastReaction, setLastReaction] = useState(null);
  const [activeView, setActiveView] = useState("none");
  const [chatMessages, setChatMessages] = useState([
    { name: "Virtus", text: "Meeting room opened locally." },
  ]);

  useEffect(() => {
    if (!roomId) return;

    async function loadRoom() {
      try {
        const response = await fetch(`/api/meetings?roomId=${roomId}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data.room) {
          setRoomStatus("Meeting room was not found or access is not available.");
          return;
        }

        setRoomStatus("Connected to Virtus room.");
      } catch {
        setRoomStatus("Could not check this meeting room.");
      }
    }

    loadRoom();
  }, [roomId]);

  async function startCameraAndMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      if (selfVideoRef.current) selfVideoRef.current.srcObject = stream;
      if (mainVideoRef.current && activeView !== "screen") mainVideoRef.current.srcObject = stream;

      setCameraOn(true);
      setMicOn(true);
      setActiveView("camera");
      setMediaStatus("Camera and microphone are active.");
    } catch {
      setMediaStatus("Camera or microphone permission was blocked.");
    }
  }

  function toggleCamera() {
    const videoTrack = streamRef.current?.getVideoTracks?.()[0];

    if (!videoTrack) {
      startCameraAndMic();
      return;
    }

    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);
  }

  function toggleMic() {
    const audioTrack = streamRef.current?.getAudioTracks?.()[0];

    if (!audioTrack) {
      startCameraAndMic();
      return;
    }

    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);

    if (!audioTrack.enabled) {
      setActiveView("none");
      if (mainVideoRef.current) mainVideoRef.current.srcObject = null;
      setMediaStatus("Microphone is muted. You are not the active speaker.");
      return;
    }

    if (streamRef.current && mainVideoRef.current) {
      mainVideoRef.current.srcObject = streamRef.current;
      setActiveView("camera");
    }

    setMediaStatus("Microphone is on.");
  }

  async function startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = screenStream;

      if (mainVideoRef.current) mainVideoRef.current.srcObject = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];

      if (screenTrack) {
        screenTrack.onended = () => {
          setScreenOn(false);
          setActiveView(streamRef.current && micOn ? "camera" : "none");
          if (mainVideoRef.current) mainVideoRef.current.srcObject = streamRef.current && micOn ? streamRef.current : null;
          setMediaStatus("Screen sharing stopped.");
        };
      }

      setScreenOn(true);
      setActiveView("screen");
      setMediaStatus("Screen sharing is active.");
    } catch {
      setMediaStatus("Screen share cancelled or blocked.");
    }
  }

  function stopAllMedia() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;
    screenStreamRef.current = null;

    if (mainVideoRef.current) mainVideoRef.current.srcObject = null;
    if (selfVideoRef.current) selfVideoRef.current.srcObject = null;

    setCameraOn(false);
    setMicOn(false);
    setScreenOn(false);
    setActiveView("none");
    setMediaStatus("All media stopped.");
  }

  function sendChatMessage() {
    if (!chatMessage.trim()) return;
    setChatMessages((current) => [...current, { name: "You", text: chatMessage.trim() }]);
    setChatMessage("");
  }

  function sendReaction(reaction) {
    setLastReaction(reaction);
    setTimeout(() => setLastReaction(null), 1800);
    setReactionOpen(false);
    setChatMessages((current) => [...current, { name: "You", text: `Reacted: ${reaction.label}` }]);
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black text-zinc-100">
      <div className="absolute left-4 top-4 z-40">
        <Link href="/meetings" className="rounded-full border border-sky-900/40 bg-black/70 px-4 py-2 text-sm text-sky-100 backdrop-blur">
          Back to Meetings
        </Link>
      </div>

      <div className="absolute left-4 top-28 z-30 flex flex-col gap-4">
  <div className="h-24 w-32 rounded-2xl border border-sky-900/30 bg-black/70"></div>
  <div className="h-24 w-32 rounded-2xl border border-sky-900/30 bg-black/70"></div>
  <div className="h-24 w-32 rounded-2xl border border-sky-900/30 bg-black/70"></div>
  <div className="relative h-24 w-32 overflow-hidden rounded-2xl border border-sky-900/30 bg-black/70">
  {handRaised && (
    <div className="absolute left-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/50 bg-amber-950/70 text-lg shadow-lg shadow-amber-950/40 backdrop-blur">
      {"\u270B"}
    </div>
  )}
  <video ref={selfVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
</div>
</div>

      <div className="absolute right-4 top-28 z-30 flex flex-col gap-4">
  <div className="h-24 w-32 rounded-2xl border border-sky-900/30 bg-black/70"></div>
  <div className="h-24 w-32 rounded-2xl border border-sky-900/30 bg-black/70"></div>
  <div className="h-24 w-32 rounded-2xl border border-sky-900/30 bg-black/70"></div>
  <div className="relative h-24 w-32 overflow-hidden rounded-2xl border border-sky-900/30 bg-black/70">
  {handRaised && (
    <div className="absolute left-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/50 bg-amber-950/70 text-lg shadow-lg shadow-amber-950/40 backdrop-blur">
      {"\u270B"}
    </div>
  )}
  <video ref={selfVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
</div>
</div>

      <section className="relative mx-auto h-full w-[78vw] max-w-[1280px]">
        <video ref={mainVideoRef} autoPlay muted playsInline className="h-full w-full object-contain" />

        {handRaised && activeView !== "none" && (
          <div className="absolute left-28 top-10 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/50 bg-amber-950/70 text-2xl shadow-2xl shadow-amber-950/40 backdrop-blur">
            {"\u270B"}
          </div>
        )}

        {activeView === "none" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-xl rounded-3xl border border-sky-900/30 bg-black/75 p-6 text-center shadow-2xl shadow-sky-950/30 backdrop-blur">
              <p className="text-3xl font-semibold text-sky-100">Virtus Meetings</p>
              <p className="mt-2 text-sm text-zinc-400">
                Full-screen meeting room. The active speaker or shared screen will appear here.
              </p>
              <p className="mt-4 rounded-2xl border border-sky-900/20 bg-sky-950/20 px-4 py-2 text-sm text-sky-100/80">
                {roomStatus} - {mediaStatus}
              </p>
              {roomId && <p className="mt-3 break-all text-xs text-zinc-500">Room ID: {roomId}</p>}
            </div>
          </div>
        )}

        

        {lastReaction && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 animate-[virtusReactionFloat_1.8s_ease-out_forwards] text-5xl drop-shadow-[0_0_22px_rgba(56,189,248,0.65)]">
            {lastReaction.icon}
          </div>
        )}
      </section>

      {chatOpen && (
        <aside className="absolute bottom-24 right-5 top-20 z-40 w-[360px] rounded-3xl border border-sky-900/30 bg-black/85 p-4 shadow-2xl shadow-sky-950/50 backdrop-blur">
          <h2 className="text-lg font-semibold text-sky-100">Messages</h2>
          <div className="mt-4 h-[calc(100%-105px)] space-y-3 overflow-y-auto rounded-2xl border border-sky-900/20 bg-zinc-950/60 p-3">
            {chatMessages.map((item, index) => (
              <div key={`${item.name}-${index}`} className="rounded-2xl border border-zinc-800/70 bg-black/35 p-3">
                <p className="text-xs font-semibold text-sky-300">{item.name}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-300">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={chatMessage}
              onChange={(event) => setChatMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendChatMessage();
              }}
              placeholder="Message..."
              className="min-w-0 flex-1 rounded-2xl border border-sky-900/30 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            />
            <button type="button" onClick={sendChatMessage} className="rounded-2xl border border-sky-700/40 bg-sky-950/50 px-4 py-3 text-sm font-medium text-sky-100">
              Send
            </button>
          </div>
        </aside>
      )}

      {reactionOpen && (
        <div className="absolute bottom-24 left-1/2 z-40 grid -translate-x-1/2 grid-cols-6 gap-2 rounded-3xl border border-sky-900/30 bg-black/85 p-3 shadow-2xl shadow-sky-950/50 backdrop-blur">
          {reactions.map((reaction) => (
            <button
              key={reaction.label}
              type="button"
              onClick={() => sendReaction(reaction)}
              className="rounded-2xl border border-sky-900/30 bg-zinc-950/70 px-3 py-2 text-lg transition hover:border-sky-600/50 hover:bg-sky-950/40"
              title={reaction.label}
            >
              {reaction.icon}
            </button>
          ))}
        </div>
      )}

      <div className="absolute bottom-5 left-1/2 z-50 flex max-w-[96vw] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-full border border-sky-900/30 bg-black/80 p-2 shadow-2xl shadow-sky-950/60 backdrop-blur">
        <button type="button" onClick={toggleCamera} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          {cameraOn ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="13" height="12" rx="2" />
              <path d="m16 10 5-3v10l-5-3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="13" height="12" rx="2" />
              <path d="m16 10 5-3v10l-5-3" />
              <path d="M4 4l16 16" />
            </svg>
          )}
        </button>
        <button type="button" onClick={toggleMic} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          {micOn ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <path d="M12 19v3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 5 2.2" />
              <path d="M19 10v2a7 7 0 0 1-.7 3" />
              <path d="M12 19v3" />
              <path d="M4 4l16 16" />
            </svg>
          )}
        </button>
        <button type="button" onClick={startScreenShare} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          {screenOn ? "sharing" : "share"}
        </button>
        <button type="button" onClick={() => setChatOpen((current) => !current)} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          {"\uD83D\uDCAC"}
        </button>
        <button type="button" onClick={() => setReactionOpen((current) => !current)} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          {"\uD83D\uDE0A"}
        </button>
        <button type="button" onClick={() => setHandRaised((current) => !current)} className="rounded-full border border-amber-600/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
          {"\u270B"}
        </button>
        <button type="button" onClick={stopAllMedia} className="rounded-full border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          Stop
        </button>
      </div>

      <style jsx global>{`
        @keyframes virtusReactionFloat {
          0% {
            opacity: 0;
            transform: translate(-50%, 80px) scale(0.75);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, 20px) scale(1.05);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -45vh) scale(1.25);
          }
        }
      `}</style>
    </main>
  );
}
