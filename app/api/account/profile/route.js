import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
   const nickname = (body?.nickname || "").trim();
const occupation = (body?.occupation || "").trim();
const about = (body?.about || "").trim();
const preferences = (body?.preferences || "").trim();
const responseStyle = (body?.responseStyle || "").trim();
const customInstructions = (body?.customInstructions || "").trim();
const memoryEnabled = body?.memoryEnabled;
const chatHistoryEnabled = body?.chatHistoryEnabled;
const recordHistoryEnabled = body?.recordHistoryEnabled;

    const { error } = await supabase
      .from("profiles")
      .update({
  nickname,
  occupation,
  about,
  preferences,
  response_style: responseStyle,
  custom_instructions: customInstructions,
  ...(typeof memoryEnabled === "boolean" ? { memory_enabled: memoryEnabled } : {}),
  ...(typeof chatHistoryEnabled === "boolean" ? { chat_history_enabled: chatHistoryEnabled } : {}),
  ...(typeof recordHistoryEnabled === "boolean" ? { record_history_enabled: recordHistoryEnabled } : {}),
})
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      nickname,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Something went wrong.",
      },
      { status: 500 }
    );
  }
}