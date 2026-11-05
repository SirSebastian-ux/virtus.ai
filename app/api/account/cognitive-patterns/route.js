import { createClient } from "@/lib/supabase-server";
import { validateCognitivePattern, validatePatternDecision } from "@/lib/virtus-cognitive-patterns.mjs";

const response = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
async function identify() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user?.id) return { db, user: null };
  return { db, user };
}
export async function GET() {
  const { db, user } = await identify();
  if (!user) return response({ error: "Please sign in." }, 401);
  const { data, error } = await db.from("virtus_cognitive_patterns")
    .select("id,title,observed_situation,interpretation,response,alternative_interpretation,evidence,status,confirmed_at,created_at,updated_at")
    .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(60);
  if (error) return response({ error: "Could not load private reflections." }, 503);
  return response({ patterns: data || [], note: "These are client-authored hypotheses, not psychological diagnoses." });
}
export async function POST(request) {
  const { db, user } = await identify();
  if (!user) return response({ error: "Please sign in." }, 401);
  const raw = await request.json().catch(() => null);
  const validated = validateCognitivePattern(raw);
  if (validated.error) return response({ error: validated.error }, 400);
  const { count, error: countError } = await db.from("virtus_cognitive_patterns")
    .select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (countError) return response({ error: "Could not verify reflection limit." }, 503);
  if ((count || 0) >= 60) return response({ error: "Maximum 60 reflections. You can reject or revise existing reflections." }, 409);
  const { data, error } = await db.from("virtus_cognitive_patterns")
    .insert({ ...validated.value, user_id: user.id, status: "proposed", confirmed_at: null })
    .select("id").single();
  if (error) return response({ error: "Could not save reflection." }, 500);
  return response({ id: data.id, status: "proposed", created: true }, 201);
}
export async function PATCH(request) {
  const { db, user } = await identify();
  if (!user) return response({ error: "Please sign in." }, 401);
  const raw = await request.json().catch(() => null);
  if (raw?.type === "revise") {
    const idResult = validatePatternDecision({ id: raw?.id, status: "proposed" });
    if (idResult.error) return response({ error: idResult.error }, 400);
    const revision = validateCognitivePattern(raw);
    if (revision.error) return response({ error: revision.error }, 400);
    // Every revision requires an explicit new confirmation before AI may use it.
    const { data, error } = await db.from("virtus_cognitive_patterns")
      .update({ ...revision.value, status: "proposed", confirmed_at: null, updated_at: new Date().toISOString() })
      .eq("user_id", user.id).eq("id", idResult.value.id)
      .select("id").maybeSingle();
    if (error) return response({ error: "Could not revise reflection." }, 500);
    if (!data) return response({ error: "Reflection not found." }, 404);
    return response({ updated: true, status: "proposed" });
  }
  const parsed = validatePatternDecision(raw);
  if (parsed.error) return response({ error: parsed.error }, 400);
  const { data, error } = await db.from("virtus_cognitive_patterns")
    .update({
      status: parsed.value.status,
      confirmed_at: parsed.value.status === "confirmed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id).eq("id", parsed.value.id)
    .select("id,status").maybeSingle();
  if (error) return response({ error: "Could not update reflection." }, 500);
  if (!data) return response({ error: "Reflection not found." }, 404);
  return response({ updated: true, status: data.status });
}
export async function DELETE(request) {
  const { db, user } = await identify();
  if (!user) return response({ error: "Please sign in." }, 401);
  const raw = await request.json().catch(() => null);
  const parsed = validatePatternDecision({ id: raw?.id, status: "rejected" });
  if (parsed.error) return response({ error: parsed.error }, 400);
  const { data, error } = await db.from("virtus_cognitive_patterns")
    .delete().eq("user_id", user.id).eq("id", parsed.value.id).select("id").maybeSingle();
  if (error) return response({ error: "Could not delete reflection." }, 500);
  return response({ deleted: Boolean(data) });
}
