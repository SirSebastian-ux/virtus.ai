import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    answer: "Operations Copilot foundation is ready. Data-connected intelligence will be added next.",
    sources: [],
    recommendations: [],
  });
}
