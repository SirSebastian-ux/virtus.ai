"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { saveMeetingRecording } from "../recording/localRecordingStore";

const reactions = [
  { label: "Like", icon: "\uD83D\uDC4D" },
  { label: "Clap", icon: "\uD83D\uDC4F" },
  { label: "Heart", icon: "\u2764\uFE0F" },
  { label: "Smile", icon: "\uD83D\uDE0A" },
  { label: "Fire", icon: "\uD83D\uDD25" },
  { label: "Thanks", icon: "\uD83D\uDE4F" },
];

function formatRecordingTime(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getSupportedMediaRecorderType(types) {
  if (typeof MediaRecorder === "undefined") return "";

  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export default function MeetingsRoomPage() {
  const mainVideoRef = useRef(null);
  const selfVideoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const recordingMediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const recordingTimerRef = useRef(null);

  const recordingCanvasRef = useRef(null);
  const recordingAnimationRef = useRef(null);
  const recordingMixedStreamRef = useRef(null);
  const recordingAudioContextRef = useRef(null);
  const recordingScreenVideoRef = useRef(null);
  const recordingCameraVideoRef = useRef(null);

  const transcriptRecorderRef = useRef(null);
  const transcriptChunksRef = useRef([]);
  const transcriptBusyRef = useRef(false);
  const transcriptTextRef = useRef("");
  const transcriptMimeTypeRef = useRef("");
  const transcriptResolveRef = useRef(null);

  const [mediaStatus, setMediaStatus] = useState("Ready.");
  const [roomId, setRoomId] = useState("");
  const [roomStatus, setRoomStatus] = useState("Checking room...");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState("Recording ready.");
  const [meetingTranscript, setMeetingTranscript] = useState("");
  const [transcriptStatus, setTranscriptStatus] = useState("Transcript ready.");
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
    const currentRoomId =
      new URLSearchParams(window.location.search).get("room") || "";

    setRoomId(currentRoomId);
    setRoomStatus(
      currentRoomId
        ? "Checking room..."
        : "Local preview room. No shared room link detected."
    );
  }, []);

  useEffect(() => {
    async function protectMeetingRoom() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));

        if (!data?.isAuthenticated) {
          const nextPath = `${window.location.pathname}${window.location.search}`;
          window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
        }
      } catch {
        const nextPath = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
      }
    }

    protectMeetingRoom();
  }, []);
  useEffect(() => {
    if (activeView === "none" && mainVideoRef.current) {
      mainVideoRef.current.srcObject = null;
    }
  }, [activeView]);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (selfVideoRef.current) selfVideoRef.current.srcObject = stream;

      if (mainVideoRef.current && activeView !== "screen") {
        mainVideoRef.current.srcObject = null;
      }

      if (activeView !== "screen") {
        setActiveView("none");
      }

      setCameraOn(true);
      setMicOn(true);
      setMediaStatus("Camera and microphone are active. Your preview is visible.");

      return stream;
    } catch {
      setMediaStatus("Camera or microphone permission was blocked.");
      return null;
    }
  }

  function toggleCamera() {
    const videoTrack = streamRef.current?.getVideoTracks?.()[0];

    if (!videoTrack) {
      startCameraAndMic().then((stream) => {
        const currentStream = streamRef.current || stream;

        if (selfVideoRef.current && currentStream) {
          selfVideoRef.current.srcObject = currentStream;
        }

        if (micOn && mainVideoRef.current && currentStream) {
          mainVideoRef.current.srcObject = currentStream;
          setActiveView("camera");
        } else {
          if (mainVideoRef.current) mainVideoRef.current.srcObject = null;
          setActiveView("none");
        }

        setCameraOn(true);
        setMediaStatus(
          micOn
            ? "Camera is on. Active speaker is shown on the big screen."
            : "Camera preview is active in the small You window."
        );
      });

      return;
    }

    if (videoTrack.enabled) {
      videoTrack.enabled = false;

      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = null;
      }

      if (activeView === "camera" && mainVideoRef.current) {
        mainVideoRef.current.srcObject = null;
        setActiveView("none");
      }

      setCameraOn(false);
      setMediaStatus(
        micOn
          ? "Camera is off. Microphone remains on."
          : "Camera is off. You remain in the meeting background."
      );

      return;
    }

    videoTrack.enabled = true;

    if (selfVideoRef.current && streamRef.current) {
      selfVideoRef.current.srcObject = streamRef.current;
    }

    if (micOn && mainVideoRef.current && streamRef.current) {
      mainVideoRef.current.srcObject = streamRef.current;
      setActiveView("camera");
    } else {
      if (mainVideoRef.current) mainVideoRef.current.srcObject = null;
      setActiveView("none");
    }

    setCameraOn(true);
    setMediaStatus(
      micOn
        ? "Camera is on. Active speaker is shown on the big screen."
        : "Camera preview is active in the small You window."
    );
  }

  async function toggleMic() {
    let startedMedia = false;
    let currentStream = streamRef.current;
    let audioTrack = currentStream?.getAudioTracks?.()[0];
    let videoTrack = currentStream?.getVideoTracks?.()[0];

    if (!audioTrack || !videoTrack) {
      const stream = await startCameraAndMic();

      startedMedia = true;
      currentStream = streamRef.current || stream;
      audioTrack = currentStream?.getAudioTracks?.()[0];
      videoTrack = currentStream?.getVideoTracks?.()[0];

      if (!audioTrack) {
        setMediaStatus("Microphone permission was blocked.");
        return;
      }
    }

    if (selfVideoRef.current && currentStream) {
      selfVideoRef.current.srcObject = currentStream;
    }

    if (audioTrack.enabled && !startedMedia) {
      audioTrack.enabled = false;

      if (activeView === "camera" && mainVideoRef.current) {
        mainVideoRef.current.srcObject = null;
        setActiveView("none");
      }

      setMicOn(false);
      setMediaStatus("Microphone is off. You remain visible only in the small You window.");
      return;
    }

    audioTrack.enabled = true;

    if (videoTrack?.enabled) {
      setCameraOn(true);

      if (mainVideoRef.current && currentStream) {
        mainVideoRef.current.srcObject = currentStream;
      }

      setActiveView("camera");
      setMediaStatus("Microphone is on. Active speaker is shown on the big screen.");
    } else {
      if (mainVideoRef.current) mainVideoRef.current.srcObject = null;

      setActiveView("none");
      setCameraOn(false);
      setMediaStatus("Microphone is on. Camera is off, so you stay in the background.");
    }

    setMicOn(true);
  }

  async function startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;

      if (mainVideoRef.current) mainVideoRef.current.srcObject = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];

      if (screenTrack) {
        screenTrack.onended = () => {
          setScreenOn(false);
          setActiveView("none");
          if (mainVideoRef.current) {
            mainVideoRef.current.srcObject = null;
          }
          setMediaStatus("Screen sharing stopped. Camera preview remains in the small You window.");
        };
      }

      setScreenOn(true);
      setActiveView("screen");
      setMediaStatus(
        screenStream.getAudioTracks().length
          ? "Screen sharing is active with audio."
          : "Screen sharing is active. If you need meeting audio, share a tab/window with audio enabled."
      );

      return screenStream;
    } catch {
      setMediaStatus("Screen share cancelled or blocked.");
      return null;
    }
  }

  function createHiddenVideo(stream) {
    const video = document.createElement("video");

    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;

    video.play().catch(() => {});

    return video;
  }

  function stopCompositeRecordingResources() {
    if (recordingAnimationRef.current) {
      cancelAnimationFrame(recordingAnimationRef.current);
      recordingAnimationRef.current = null;
    }

    recordingMixedStreamRef.current?.getTracks?.().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });

    recordingMixedStreamRef.current = null;
    recordingCanvasRef.current = null;
    recordingScreenVideoRef.current = null;
    recordingCameraVideoRef.current = null;

    const audioContext = recordingAudioContextRef.current;
    recordingAudioContextRef.current = null;

    if (audioContext?.close) {
      audioContext.close().catch(() => {});
    }
  }

  function addAudioTracksToDestination(audioContext, destination, stream) {
    const audioTracks = stream?.getAudioTracks?.() || [];

    if (!audioTracks.length) return;

    const audioStream = new MediaStream(audioTracks);
    const source = audioContext.createMediaStreamSource(audioStream);

    source.connect(destination);
  }

  async function buildCompositeRecordingStream() {
    let cameraStream = streamRef.current;

    if (!cameraStream?.getTracks?.().length) {
      cameraStream = await startCameraAndMic();
    }

    const screenStream = screenStreamRef.current;
    const hasScreenVideo = Boolean(screenStream?.getVideoTracks?.().length);
    const hasCameraVideo = Boolean(cameraStream?.getVideoTracks?.().length);

    if (!hasScreenVideo && !hasCameraVideo) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;

    const context = canvas.getContext("2d");

    if (!context) return null;

    const screenVideo = hasScreenVideo ? createHiddenVideo(screenStream) : null;
    const cameraVideo = hasCameraVideo ? createHiddenVideo(cameraStream) : null;

    recordingCanvasRef.current = canvas;
    recordingScreenVideoRef.current = screenVideo;
    recordingCameraVideoRef.current = cameraVideo;

    function drawFrame() {
      context.fillStyle = "#000000";
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (screenVideo?.videoWidth) {
        context.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

        if (cameraVideo?.videoWidth) {
          const insetWidth = 280;
          const insetHeight = 158;
          const insetX = canvas.width - insetWidth - 28;
          const insetY = canvas.height - insetHeight - 28;

          context.fillStyle = "rgba(0,0,0,0.65)";
          context.fillRect(insetX - 8, insetY - 8, insetWidth + 16, insetHeight + 16);
          context.drawImage(cameraVideo, insetX, insetY, insetWidth, insetHeight);
        }
      } else if (cameraVideo?.videoWidth) {
        context.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
      } else {
        context.fillStyle = "#0f172a";
        context.font = "32px sans-serif";
        context.fillText("Virtus Meeting Recording", 80, 120);
      }

      recordingAnimationRef.current = requestAnimationFrame(drawFrame);
    }

    drawFrame();

    const canvasStream = canvas.captureStream(30);
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    addAudioTracksToDestination(audioContext, destination, cameraStream);
    addAudioTracksToDestination(audioContext, destination, screenStream);

    recordingAudioContextRef.current = audioContext;

    const mixedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...destination.stream.getAudioTracks(),
    ]);

    recordingMixedStreamRef.current = mixedStream;

    return mixedStream;
  }

  function appendTranscript(text) {
    const cleanText = String(text || "").replace(/\s+/g, " ").trim();

    if (!cleanText) return;

    transcriptTextRef.current = `${transcriptTextRef.current} ${cleanText}`
      .replace(/\s+/g, " ")
      .trim();

    setMeetingTranscript(transcriptTextRef.current);
  }

  async function processTranscriptChunks(force = false) {
    if (transcriptBusyRef.current) return;

    const minimumChunks = force ? 1 : 10;

    if (transcriptChunksRef.current.length < minimumChunks) return;

    const sectionChunks = force
      ? transcriptChunksRef.current.slice()
      : transcriptChunksRef.current.slice(0, 10);

    transcriptChunksRef.current = force
      ? []
      : transcriptChunksRef.current.slice(10);

    transcriptBusyRef.current = true;

    try {
      const mimeType =
        transcriptMimeTypeRef.current ||
        sectionChunks[0]?.type ||
        "audio/webm";
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      const audioBlob = new Blob(sectionChunks, { type: mimeType });

      if (!audioBlob.size) return;

      const audioFile = new File(
        [audioBlob],
        `virtus-meeting-transcript-section.${extension}`,
        { type: mimeType }
      );

      const formData = new FormData();
      formData.append("audio", audioFile);

      const response = await fetch("/api/capture/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Could not transcribe meeting audio.");
      }

      appendTranscript(data?.text || "");
      setTranscriptStatus("Transcript section saved.");
    } catch {
      setTranscriptStatus("Transcript section failed. Recording continues.");
    } finally {
      transcriptBusyRef.current = false;

      if (transcriptChunksRef.current.length >= 10) {
        void processTranscriptChunks(false);
      }
    }
  }

  function startTranscriptRecorder(recordingStream) {
    const audioTracks = recordingStream?.getAudioTracks?.() || [];

    if (!audioTracks.length || typeof MediaRecorder === "undefined") {
      setTranscriptStatus("No audio track available for transcript.");
      return;
    }

    const audioStream = new MediaStream(audioTracks);
    const mimeType = getSupportedMediaRecorderType([
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ]);

    const transcriptRecorder = new MediaRecorder(
      audioStream,
      mimeType ? { mimeType } : {}
    );

    transcriptChunksRef.current = [];
    transcriptMimeTypeRef.current = mimeType || "audio/webm";
    transcriptRecorderRef.current = transcriptRecorder;

    transcriptRecorder.ondataavailable = (event) => {
      if (!event.data || event.data.size <= 0) return;

      transcriptChunksRef.current.push(event.data);
      transcriptMimeTypeRef.current = event.data.type || mimeType || "audio/webm";

      void processTranscriptChunks(false);
    };

    transcriptRecorder.onstart = () => {
      setTranscriptStatus("Live transcript is recording protected audio sections.");
    };

    transcriptRecorder.onstop = async () => {
      await processTranscriptChunks(true);

      transcriptRecorderRef.current = null;
      setTranscriptStatus("Transcript finalized.");

      if (transcriptResolveRef.current) {
        transcriptResolveRef.current(transcriptTextRef.current);
        transcriptResolveRef.current = null;
      }
    };

    transcriptRecorder.onerror = () => {
      setTranscriptStatus("Transcript recorder had a problem.");
    };

    transcriptRecorder.start(3000);
  }

  function stopTranscriptRecorder() {
    const transcriptRecorder = transcriptRecorderRef.current;

    if (!transcriptRecorder || transcriptRecorder.state === "inactive") {
      return Promise.resolve(transcriptTextRef.current);
    }

    return new Promise((resolve) => {
      transcriptResolveRef.current = resolve;

      try {
        transcriptRecorder.requestData?.();
      } catch {}

      try {
        transcriptRecorder.stop();
      } catch {
        transcriptResolveRef.current = null;
        resolve(transcriptTextRef.current);
      }
    });
  }

  async function startMeetingRecording() {
    if (recordingMediaRecorderRef.current?.state === "recording") return;

    if (typeof MediaRecorder === "undefined") {
      setRecordingStatus("Recording is not supported in this browser.");
      return;
    }

    try {
      const recordingStream = await buildCompositeRecordingStream();

      if (!recordingStream) {
        setRecordingStatus("Start camera/microphone or screen share before recording.");
        return;
      }

      const mimeType = getSupportedMediaRecorderType([
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ]);

      const recorder = new MediaRecorder(
        recordingStream,
        mimeType ? { mimeType } : {}
      );

      recordingChunksRef.current = [];
      transcriptTextRef.current = "";
      setMeetingTranscript("");
      setRecordingSeconds(0);
      recordingStartedAtRef.current = Date.now();
      recordingMediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        startTranscriptRecorder(recordingStream);
        setRecording(true);
        setRecordingStatus(
          screenStreamRef.current
            ? "Recording screen, camera, audio, and transcript."
            : "Recording camera, microphone, and transcript."
        );

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }

        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((seconds) => seconds + 1);
        }, 1000);
      };

      recorder.onstop = async () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        const finalTranscript = await stopTranscriptRecorder();

        setRecording(false);
        setRecordingStatus("Saving recording for review page...");

        const durationSeconds = Math.max(
          0,
          Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
        );

        const videoBlob = new Blob(recordingChunksRef.current, {
          type: mimeType || "video/webm",
        });

        const recordingId = crypto.randomUUID();

        await saveMeetingRecording({
          id: recordingId,
          title: `Virtus Meeting ${new Date().toLocaleString()}`,
          roomId: roomId || "local-room",
          createdAt: new Date().toISOString(),
          durationSeconds,
          videoBlob,
          transcript: finalTranscript || transcriptTextRef.current,
          chatMessages,
        });

        recordingMediaRecorderRef.current = null;
        recordingChunksRef.current = [];

        stopCompositeRecordingResources();

        const recordingUrl = `/meetings/recording?recordingId=${recordingId}`;
        const reviewWindow = window.open(recordingUrl, "_blank", "noopener,noreferrer");

        setRecordingStatus(
          reviewWindow
            ? "Recording saved. Review opened in a new tab."
            : "Recording saved. Your browser blocked the review tab."
        );
      };

      recorder.onerror = () => {
        setRecordingStatus("Recording had a problem. Stop and try again.");
      };

      recorder.start(1000);
    } catch {
      setRecording(false);
      setRecordingStatus("Could not start meeting recording.");
      stopCompositeRecordingResources();
    }
  }

  function stopMeetingRecording() {
    const recorder = recordingMediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      return;
    }

    try {
      recorder.requestData?.();
    } catch {}

    try {
      recorder.stop();
      setRecordingStatus("Recording stopped. Preparing review page...");
    } catch {
      setRecordingStatus("Could not stop recording cleanly.");
    }
  }

  function stopAllMedia() {
    if (recordingMediaRecorderRef.current?.state === "recording") {
      stopMeetingRecording();
    }

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
    setChatMessages((current) => [
      ...current,
      { name: "You", text: chatMessage.trim() },
    ]);
    setChatMessage("");
  }

  function sendReaction(reaction) {
    setLastReaction(reaction);
    setTimeout(() => setLastReaction(null), 1800);
    setReactionOpen(false);
    setChatMessages((current) => [
      ...current,
      { name: "You", text: `Reacted: ${reaction.label}` },
    ]);
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black text-zinc-100">
      <div className="absolute left-4 top-4 z-40">
        <Link href="/meetings" className="rounded-full border border-sky-900/40 bg-black/70 px-4 py-2 text-sm text-sky-100 backdrop-blur">
          Back to Meetings
        </Link>
      </div>

      <div className="absolute left-5 top-20 z-30 hidden flex-col gap-3 xl:flex">
        {["Participant", "Participant", "Participant", "Participant"].map((label, index) => (
          <div
            key={`left-${label}-${index}`}
            className="flex h-32 w-56 items-center justify-center rounded-3xl border border-sky-900/30 bg-zinc-950/75 text-xs font-medium uppercase tracking-[0.22em] text-sky-200/35 shadow-2xl shadow-black/40 backdrop-blur"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="absolute right-5 top-20 z-30 hidden flex-col gap-3 xl:flex">
        {["Participant", "Participant", "Participant"].map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="flex h-32 w-56 items-center justify-center rounded-3xl border border-sky-900/30 bg-zinc-950/75 text-xs font-medium uppercase tracking-[0.22em] text-sky-200/35 shadow-2xl shadow-black/40 backdrop-blur"
          >
            {label}
          </div>
        ))}

        <div className="relative h-32 w-56 overflow-hidden rounded-3xl border border-sky-700/40 bg-black/80 shadow-2xl shadow-sky-950/40">
          {handRaised && (
            <div className="absolute left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/50 bg-amber-950/70 text-lg shadow-lg shadow-amber-950/40 backdrop-blur">
              {"\u270B"}
            </div>
          )}

          <div className="absolute bottom-2 left-2 z-20 rounded-full border border-sky-700/40 bg-black/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100 backdrop-blur">
            You
          </div>

          <video ref={selfVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        </div>
      </div>

      <section className="relative mx-auto h-full w-[78vw] max-w-[1280px]">
                <video
          ref={mainVideoRef}
          autoPlay
          muted
          playsInline
          className={activeView === "none" ? "hidden" : "h-full w-full object-contain"}
        />

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
                Full-screen meeting room. Record camera, microphone, screen, audio, transcript, and chat.
              </p>
              <p className="mt-4 rounded-2xl border border-sky-900/20 bg-sky-950/20 px-4 py-2 text-sm text-sky-100/80">
                {roomStatus} - {mediaStatus}
              </p>
              <p className="mt-3 rounded-2xl border border-zinc-800 bg-black/50 px-4 py-2 text-xs text-zinc-400">
                {recordingStatus}
              </p>
              <p className="mt-3 rounded-2xl border border-zinc-800 bg-black/50 px-4 py-2 text-xs text-zinc-400">
                {transcriptStatus}
              </p>
              {roomId && <p className="mt-3 break-all text-xs text-zinc-500">Room ID: {roomId}</p>}
            </div>
          </div>
        )}

        {meetingTranscript && (
          <div className="absolute bottom-24 left-6 z-40 max-h-40 w-[420px] overflow-y-auto rounded-3xl border border-sky-900/30 bg-black/80 p-4 text-xs leading-5 text-zinc-300 shadow-2xl shadow-sky-950/40 backdrop-blur">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/70">
              Live Transcript
            </p>
            {meetingTranscript}
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

      {reactionOpen && (
        <div className="absolute bottom-24 left-1/2 z-50 grid -translate-x-1/2 grid-cols-6 gap-2 rounded-3xl border border-sky-900/30 bg-black/85 p-3 shadow-2xl shadow-sky-950/60 backdrop-blur">
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
          {cameraOn ? "camera" : "camera off"}
        </button>
        <button type="button" onClick={toggleMic} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          {micOn ? "mic" : "mic off"}
        </button>
        <button type="button" onClick={startScreenShare} className="rounded-full border border-sky-900/30 bg-zinc-950 px-4 py-2 text-xs text-sky-100">
          {screenOn ? "sharing" : "share"}
        </button>
        <button
          type="button"
          onClick={recording ? stopMeetingRecording : startMeetingRecording}
          className={`rounded-full border px-4 py-2 text-xs ${
            recording
              ? "border-red-500/50 bg-red-950/60 text-red-100"
              : "border-sky-700/40 bg-sky-950/40 text-sky-100"
          }`}
        >
          {recording ? `stop rec ${formatRecordingTime(recordingSeconds)}` : "record"}
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
