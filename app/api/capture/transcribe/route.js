import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

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
      ...(language ? { language } : {}),
    });

    return NextResponse.json({
      text: transcription?.text || "",
    });
  } catch (error) {
    console.error("Capture transcription error:", error);

    return NextResponse.json(
      { error: "Could not transcribe the audio." },
      { status: 500 }
    );
  }
}