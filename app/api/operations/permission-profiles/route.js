import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  DEFAULT_PERMISSION_KEYS,
  normalizePermissions,
} from "@/lib/operations/permissions";
import { canManagePermissions } from "@/lib/operations/access";

const ALLOWED_ROLES = new Set([
  "owner",
  "director",
  "senior_manager",
  "department_manager",
  "supervisor",
  "employee",
]);

function cleanText(value) {
  return String(value || "").trim();
}

async function requireWorkspaceMember(admin, userId, workspaceId) {
  const { data, error } = await admin
    .from("workspace_members")
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function mapPermissionProfile(item) {
  return {
    id: item.id,
    workspaceId: item.workspace_id,
    name: item.name,
    role: item.role,
    permissions: normalizePermissions(item.permissions),
    isDefault: item.is_default,
    createdBy: item.created_by,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export async function GET(req) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ permissionProfiles: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = cleanText(searchParams.get("workspaceId"));

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const { data, error } = await admin
      .from("operations_permission_profiles")
      .select(
        "id, workspace_id, name, role, permissions, is_default, created_by, created_at, updated_at"
      )
      .eq("workspace_id", workspaceId)
      .order("role", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      permissionKeys: DEFAULT_PERMISSION_KEYS,
      permissionProfiles: (data || []).map(mapPermissionProfile),
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

    const workspaceId = cleanText(body?.workspaceId);
    const name = cleanText(body?.name);
    const role = cleanText(body?.role);
    const isDefault = Boolean(body?.isDefault);
    const permissions = normalizePermissions(body?.permissions);

    if (!workspaceId || !name || !role) {
      return NextResponse.json(
        { error: "workspaceId, name, and role are required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    if (!canManagePermissions(membership.role)) {
      return NextResponse.json(
        { error: "Permission management access denied." },
        { status: 403 }
      );
    }

    if (isDefault) {
      await admin
        .from("operations_permission_profiles")
        .update({ is_default: false })
        .eq("workspace_id", workspaceId)
        .eq("role", role);
    }

    const { data, error } = await admin
      .from("operations_permission_profiles")
      .insert({
        workspace_id: workspaceId,
        name,
        role,
        permissions,
        is_default: isDefault,
        created_by: user.id,
      })
      .select(
        "id, workspace_id, name, role, permissions, is_default, created_by, created_at, updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "permission_profile.created",
      entity_table: "operations_permission_profiles",
      entity_id: data.id,
      new_data: data,
      metadata: {
        source: "operations_permission_profiles_api",
      },
    });

    return NextResponse.json({
      ok: true,
      permissionProfile: mapPermissionProfile(data),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

