import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function mapCaptureNote(note) {
  return {
    id: note.id,
    title: note.title,
    noteType: note.note_type,
    content: note.content,
    source: note.source,
    analysisChatId: note.analysis_chat_id,
    memoryStatus: note.memory_status,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ notes: [] }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("capture_notes")
      .select(
        "id, title, note_type, content, source, analysis_chat_id, memory_status, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      notes: (data || []).map(mapCaptureNote),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    const content = cleanText(body?.content);
    const title = cleanText(body?.title, "Untitled Capture").slice(0, 120);
    const noteType = cleanText(body?.noteType, "General Note").slice(0, 80);
    const source = cleanText(body?.source, "text") === "voice" ? "voice" : "text";

    if (!content) {
      return NextResponse.json({ error: "Note content is required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("capture_notes")
      .insert({
        user_id: user.id,
        title,
        note_type: noteType,
        content,
        source,
        memory_status: "not_reviewed",
      })
      .select(
        "id, title, note_type, content, source, analysis_chat_id, memory_status, created_at, updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      note: mapCaptureNote(data),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    const noteId = cleanText(body?.id);
    const content = cleanText(body?.content);
    const title = cleanText(body?.title, "Untitled Capture").slice(0, 120);
    const noteType = cleanText(body?.noteType, "General Note").slice(0, 80);
    const source = cleanText(body?.source, "text") === "voice" ? "voice" : "text";

    if (!noteId) {
      return NextResponse.json({ error: "Missing note id." }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "Note content is required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("capture_notes")
      .update({
        title,
        note_type: noteType,
        content,
        source,
      })
      .eq("id", noteId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .select(
        "id, title, note_type, content, source, analysis_chat_id, memory_status, created_at, updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      note: mapCaptureNote(data),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const noteId = cleanText(body?.id);

    if (!noteId) {
      return NextResponse.json({ error: "Missing note id." }, { status: 400 });
    }

    const { error } = await supabase
      .from("capture_notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", noteId)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
