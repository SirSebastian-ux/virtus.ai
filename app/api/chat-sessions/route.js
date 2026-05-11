import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

function cleanChatTitleFromMessage(content) {
  const cleaned = String(content || "")
    .replace(/File ID:\s*[a-zA-Z0-9_-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  return cleaned.length > 48 ? `${cleaned.slice(0, 48).trim()}...` : cleaned;
}

function isWeakChatTitle(title) {
  const normalized = String(title || "").trim().toLowerCase();

  return (
    !normalized ||
    normalized === "new chat" ||
    normalized === "file workspace" ||
    normalized === "executive file studio" ||
    normalized.startsWith("uploaded file:")
  );
}

export async function GET() {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return Response.json({
        isAuthenticated: false,
        sessions: [],
      });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        {
          isAuthenticated: true,
          sessions: [],
        },
        { status: 500 }
      );
    }

    const sessions = data || [];
    const weakSessionIds = sessions
      .filter((session) => isWeakChatTitle(session.title))
      .map((session) => session.id);

    let rebuiltTitlesByChatId = {};

    if (weakSessionIds.length > 0) {
      const { data: firstUserMessages } = await supabase
        .from("conversations")
        .select("chat_id, content, created_at")
        .eq("user_id", user.id)
        .eq("role", "user")
        .in("chat_id", weakSessionIds)
        .order("created_at", { ascending: true });

      for (const message of firstUserMessages || []) {
        if (rebuiltTitlesByChatId[message.chat_id]) continue;

        const rebuiltTitle = cleanChatTitleFromMessage(message.content);

        if (rebuiltTitle) {
          rebuiltTitlesByChatId[message.chat_id] = rebuiltTitle;
        }
      }
    }

    const sessionsWithCleanTitles = sessions.map((session) => {
      const rebuiltTitle = rebuiltTitlesByChatId[session.id];

      return {
        ...session,
        title: rebuiltTitle || session.title || "New chat",
      };
    });

    return Response.json({
      isAuthenticated: true,
      sessions: sessionsWithCleanTitles,
    });
  } catch (error) {
    return Response.json(
      {
        isAuthenticated: false,
        sessions: [],
      },
      { status: 500 }
    );
  }
}
