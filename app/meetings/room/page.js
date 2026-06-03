"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  createLocalVideoTrack,
} from "livekit-client";

export default function MeetingsRoomPage() {
  const mainVideoRef = useRef(null);
  const selfVideoRef = useRef(null);
  const roomRef = useRef(null);
  const participantIdentityRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now())
  );
  const localVideoTrackRef = useRef(null);
  const localAudioTrackRef = useRef(null);

  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("Preparing meeting room...");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { name: "Virtus", text: "LiveKit meeting room ready." },
  ]);

  useEffect(() => {
    const currentRoomId =
      new URLSearchParams(window.location.search).get("room") || "";

    setRoomId(currentRoomId);
    setStatus(
      currentRoomId
        ? "Joining executive meeting room..."
        : "Missing room ID. Please open a meeting link."
    );
  }, []);

  useEffect(() => {
    if (!roomId) return;

    let mounted = true;

    async function connectRoom() {
      try {
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = await authResponse.json().catch(() => ({}));

        if (!authData?.isAuthenticated) {
          const nextPath = `${window.location.pathname}${window.location.search}`;
          window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
          return;
        }

        const tokenResponse = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: roomId,
            participantName: authData?.email || "Virtus Participant",
            participantIdentity: participantIdentityRef.current,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          throw new Error(tokenData.error || "Could not create LiveKit token.");
        }

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = room;

        room.on(RoomEvent.ParticipantConnected, refreshParticipants);
        room.on(RoomEvent.ParticipantDisconnected, refreshParticipants);
        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, refreshParticipants);
        room.on(RoomEvent.DataReceived, handleDataReceived);

        await room.connect(tokenData.url, tokenData.token);

        if (!mounted) return;

        setStatus("Connected to LiveKit executive room.");
        refreshParticipants();
      } catch (error) {
        setStatus(error.message || "Could not join LiveKit room.");
      }
    }

    connectRoom();

    return () => {
      mounted = false;

      localVideoTrackRef.current?.stop();
      localAudioTrackRef.current?.stop();

      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [roomId]);

  function refreshParticipants() {
    const room = roomRef.current;
    if (!room) return;

    const remoteParticipants = Array.from(room.remoteParticipants.values()).map(
      (participant) => ({
        sid: participant.sid,
        identity: participant.identity,
        name: participant.name || participant.identity || "Participant",
      })
    );

    setParticipants(remoteParticipants);
  }

  function handleTrackSubscribed(track, publication, participant) {
    if (track.kind !== Track.Kind.Video) {
      refreshParticipants();
      return;
    }

    if (mainVideoRef.current) {
      track.attach(mainVideoRef.current);
    }

    setStatus(`${participant.name || participant.identity || "Participant"} is on screen.`);
    refreshParticipants();
  }

  function handleDataReceived(payload, participant) {
    try {
      const text = new TextDecoder().decode(payload);
      const data = JSON.parse(text);

      if (data.type === "chat" && data.text) {
        setChatMessages((current) => [
          ...current,
          {
            name: participant?.name || participant?.identity || "Guest",
            text: data.text,
          },
        ]);
      }
    } catch {}
  }

  async function toggleCamera() {
    const room = roomRef.current;
    if (!room) return;

    if (cameraOn) {
      if (localVideoTrackRef.current) {
        await room.localParticipant.unpublishTrack(localVideoTrackRef.current);
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current = null;
      }

      if (selfVideoRef.current) selfVideoRef.current.srcObject = null;
      setCameraOn(false);
      return;
    }

    const videoTrack = await createLocalVideoTrack();
    localVideoTrackRef.current = videoTrack;

    if (selfVideoRef.current) {
      videoTrack.attach(selfVideoRef.current);
    }

    await room.localParticipant.publishTrack(videoTrack);
    setCameraOn(true);
  }

  async function toggleMic() {
    const room = roomRef.current;
    if (!room) return;

    if (micOn) {
      if (localAudioTrackRef.current) {
        await room.localParticipant.unpublishTrack(localAudioTrackRef.current);
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current = null;
      }

      setMicOn(false);
      return;
    }

    const audioTrack = await createLocalAudioTrack();
    localAudioTrackRef.current = audioTrack;

    await room.localParticipant.publishTrack(audioTrack);
    setMicOn(true);
  }

  async function toggleScreenShare() {
    const room = roomRef.current;
    if (!room) return;

    await room.localParticipant.setScreenShareEnabled(!screenOn);
    setScreenOn((current) => !current);
  }

  async function sendChatMessage() {
    const text = chatMessage.trim();
    if (!text || !roomRef.current) return;

    setChatMessages((current) => [...current, { name: "You", text }]);
    setChatMessage("");

    const payload = new TextEncoder().encode(
      JSON.stringify({
        type: "chat",
        text,
      })
    );

    await roomRef.current.localParticipant.publishData(payload, {
      reliable: true,
    });
  }

  return (
    <main className="relative min-h-screen bg-black text-zinc-100">
      <div className="absolute left-4 top-4 z-40">
        <Link href="/meetings" className="rounded-full border border-sky-900/40 bg-black/70 px-4 py-2 text-sm text-sky-100 backdrop-blur">
          Back to Meetings
        </Link>
      </div>

      <section className="mx-auto flex min-h-screen max-w-7xl flex-col gap-5 px-5 pb-28 pt-20">
        <div className="rounded-3xl border border-sky-900/30 bg-zinc-950/70 p-5 shadow-2xl shadow-sky-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/70">
            Virtus AI Executive Meeting
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-sky-100">
            Live Meeting Room
          </h1>
          <p className="mt-2 break-all text-sm text-zinc-400">
            {status} {roomId ? `Room: ${roomId}` : ""}
          </p>
        </div>

        <div className="grid flex-1 gap-5 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-sky-900/30 bg-black shadow-2xl shadow-sky-950/30">
            <video ref={mainVideoRef} autoPlay playsInline className="h-[58vh] w-full bg-black object-contain" />
          </div>

          <aside className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-sky-700/40 bg-black/80 shadow-2xl shadow-sky-950/40">
              <video ref={selfVideoRef} autoPlay muted playsInline className="h-48 w-full object-cover" />
              <div className="border-t border-sky-900/30 px-4 py-3 text-sm text-sky-100">
                You
              </div>
            </div>

            <div className="rounded-3xl border border-sky-900/30 bg-zinc-950/80 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300/70">
                Participants ({participants.length + 1})
              </h2>
              <div className="mt-3 space-y-2">
                <p className="rounded-2xl bg-black/60 px-4 py-3 text-sm text-zinc-300">
                  You
                </p>
                {participants.map((participant) => (
                  <p key={participant.sid} className="rounded-2xl bg-black/60 px-4 py-3 text-sm text-zinc-300">
                    {participant.name}
                  </p>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {chatOpen && (
        <aside className="absolute bottom-24 right-5 top-20 z-40 w-[360px] rounded-3xl border border-sky-900/30 bg-black/85 p-4 shadow-2xl shadow-sky-950/50 backdrop-blur">
          <h2 className="text-lg font-semibold text-sky-100">Messages</h2>
          <div className="mt-4 h-[calc(100%-105px)] space-y-3 overflow-y-auto rounded-2xl border border-sky-900/20 bg-zinc-950/60 p-3">
            {chatMessages.map((message, index) => (
              <div key={`${message.name}-${index}`} className="rounded-2xl bg-black/70 p-3 text-sm text-zinc-300">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/60">{message.name}</p>
                <p className="mt-1 leading-6">{message.text}</p>
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
              className="min-w-0 flex-1 rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 outline-none"
            />
            <button type="button" onClick={sendChatMessage} className="rounded-full border border-sky-700/40 bg-sky-950/40 px-4 py-2 text-sm text-sky-100">
              Send
            </button>
          </div>
        </aside>
      )}

      <div className="fixed bottom-5 left-1/2 z-50 flex max-w-[96vw] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-full border border-sky-900/30 bg-black/80 p-2 shadow-2xl shadow-sky-950/60 backdrop-blur">
        <button type="button" onClick={toggleCamera} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          {cameraOn ? "camera" : "camera off"}
        </button>
        <button type="button" onClick={toggleMic} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          {micOn ? "mic" : "mic off"}
        </button>
        <button type="button" onClick={toggleScreenShare} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          {screenOn ? "sharing" : "share"}
        </button>
        <button type="button" onClick={() => setChatOpen((current) => !current)} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          chat
        </button>
      </div>
    </main>
  );
}

