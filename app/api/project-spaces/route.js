import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getPlanPolicy } from "@/data/virtus-plan-policy";

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ projects: [] }, { status: 401 });
    }

    const { data, error } = await admin
      .from("project_spaces")
      .select("id, title, chat_id, chats_json, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      projects: (data || []).map((project) => ({
        id: project.id,
        title: project.title,
        chatId: project.chat_id,
        chats: Array.isArray(project.chats_json) ? project.chats_json : [],
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const project = body?.project;

    if (!project?.id || !project?.title) {
      return NextResponse.json({ error: "Missing project" }, { status: 400 });
    }

    const projectId = String(project.id);
    const cleanTitle = String(project.title).trim();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const planPolicy = getPlanPolicy(profile?.plan || "free");
    const projectScope = planPolicy.projectScope || {
      canUseProjects: false,
      maxProjects: 0,
    };

    if (projectScope.canUseProjects === false) {
      return NextResponse.json(
        { error: "Projects are not available on your current plan." },
        { status: 403 }
      );
    }

    const { data: existingProject, error: existingProjectError } = await admin
      .from("project_spaces")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", projectId)
      .maybeSingle();

    if (existingProjectError) {
      return NextResponse.json(
        { error: existingProjectError.message },
        { status: 500 }
      );
    }

    const maxProjects = projectScope.maxProjects;

    if (!existingProject && typeof maxProjects === "number") {
      const { count: existingProjectCount, error: countError } = await admin
        .from("project_spaces")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) {
        return NextResponse.json({ error: countError.message }, { status: 500 });
      }

      if ((existingProjectCount || 0) >= maxProjects) {
        return NextResponse.json(
          {
            error:
              planPolicy.plan === "free"
                ? "Free includes up to 3 projects. Upgrade to Plus for 5 projects or Premium / Virtus Prime for unlimited projects."
                : planPolicy.plan === "plus"
                ? "Plus includes up to 5 projects. Upgrade to Premium / Virtus Prime for unlimited projects."
                : "Your current plan has reached its project limit.",
          },
          { status: 403 }
        );
      }
    }

    const { error } = await admin.from("project_spaces").upsert(
      {
        id: projectId,
        user_id: user.id,
        title: cleanTitle,
        chat_id: project.chatId ? String(project.chatId) : null,
        chats_json: Array.isArray(project.chats) ? project.chats : [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const projectId = String(body?.projectId || "").trim();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const { error } = await admin
      .from("project_spaces")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
