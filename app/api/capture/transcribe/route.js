import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const CAPTURE_TRANSCRIPTION_PROMPT = [
  "You are transcribing a private Virtus AI Capture recording.",
  "Transcribe only the words actually spoken in the audio.",
  "Do not add assistant names, brand names, summaries, explanations, titles, greetings, or closing phrases.",
  "Do not write ChatGPT, OpenAI, thank you for watching, subscribe, or similar filler unless those exact words are clearly spoken.",
  "Keep the original language and natural punctuation.",
].join(" ");

function cleanCaptureTranscriptText(value) {
  let text = String(value || "").trim();

  if (!text) return "";

  const blockedStandaloneLines = new Set([
    "chatgpt",
    "openai",
    "thank you for watching",
    "thanks for watching",
    "subscribe",
    "please subscribe",
  ]);

  text = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => {
      const normalized = line
        .toLowerCase()
        .replace(/[.!?,;:'"“”‘’()\[\]-]+/g, "")
        .replace(/\s+/g, " ")
        .trim();

      return !blockedStandaloneLines.has(normalized);
    })
    .join("\n")
    .trim();

  text = text
    .replace(/^(chatgpt|openai)[.!?,;:\s-]+/i, "")
    .replace(/[\s-]+(chatgpt|openai)[.!?,;:\s]*$/i, "")
    .trim();

  return text;
}

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio");
    const language = String(formData.get("language") || "").trim();

    if (!audioFile || typeof audioFile.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "No audio file was received." },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Audio chunk is too large. Please record a shorter section." },
        { status: 413 }
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
      prompt: CAPTURE_TRANSCRIPTION_PROMPT,
      ...(language ? { language } : {}),
    });

    return NextResponse.json({
      text: cleanCaptureTranscriptText(transcription?.text || ""),
    });
  } catch (error) {
    console.error("Capture transcription error:", error);

    return NextResponse.json(
      { error: "Could not transcribe the audio." },
      { status: 500 }
    );
  }
}