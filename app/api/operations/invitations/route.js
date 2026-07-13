import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";

const ALLOWED_ROLES = new Set([
  "owner",
  "director",
  "senior_manager",
  "department_manager",
  "supervisor",
  "employee",
]);

const ALLOWED_SCOPE_TYPES = new Set(["company", "department", "team", "self"]);

function cleanText(value) {
  return String(value || "").trim();
}

function cleanEmail(value) {
  return cleanText(value).toLowerCase();
}

async function requireWorkspaceMember(admin, userId, workspaceId) {
  const { data, error } = await admin
    .from("workspace_members")
    .select("role, status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function validateDepartment(admin, workspaceId, departmentId) {
  if (!departmentId) return true;

  const { data, error } = await admin
    .from("departments")
    .select("id")
    .eq("id", departmentId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function validateEmployee(admin, workspaceId, employeeId) {
  if (!employeeId) return true;

  const { data, error } = await admin
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

function canRequestInvitation(membershipRole) {
  return ["owner", "admin", "manager"].includes(membershipRole);
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
      return NextResponse.json({ invitations: [] }, { status: 401 });
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
      .from("operations_invitations")
      .select(
        `
        id,
        workspace_id,
        email,
        invited_name,
        requested_role,
        requested_scope_type,
        department_id,
        reports_to_employee_id,
        status,
        requested_by,
        approved_by,
        approved_at,
        accepted_by,
        accepted_at,
        expires_at,
        created_at,
        updated_at,
        departments:department_id (
          id,
          name
        ),
        manager:reports_to_employee_id (
          id,
          full_name,
          email,
          position_title
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      invitations: (data || []).map((item) => ({
        id: item.id,
        workspaceId: item.workspace_id,
        email: item.email,
        invitedName: item.invited_name,
        requestedRole: item.requested_role,
        requestedScopeType: item.requested_scope_type,
        departmentId: item.department_id,
        departmentName: item.departments?.name || null,
        reportsToEmployeeId: item.reports_to_employee_id,
        reportsToEmployeeName: item.manager?.full_name || null,
        status: item.status,
        requestedBy: item.requested_by,
        approvedBy: item.approved_by,
        approvedAt: item.approved_at,
        acceptedBy: item.accepted_by,
        acceptedAt: item.accepted_at,
        expiresAt: item.expires_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
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

    const workspaceId = cleanText(body?.workspaceId);
    const email = cleanEmail(body?.email);
    const invitedName = cleanText(body?.invitedName);
    const requestedRole = cleanText(body?.requestedRole || "employee");
    const requestedScopeType = cleanText(body?.requestedScopeType || "self");
    const departmentId = cleanText(body?.departmentId);
    const reportsToEmployeeId = cleanText(body?.reportsToEmployeeId);

    if (!workspaceId || !email || !requestedRole || !requestedScopeType) {
      return NextResponse.json(
        {
          error:
            "workspaceId, email, requestedRole, and requestedScopeType are required.",
        },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    if (!ALLOWED_ROLES.has(requestedRole)) {
      return NextResponse.json({ error: "Invalid requestedRole." }, { status: 400 });
    }

    if (!ALLOWED_SCOPE_TYPES.has(requestedScopeType)) {
      return NextResponse.json(
        { error: "Invalid requestedScopeType." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    if (!canRequestInvitation(membership.role)) {
      return NextResponse.json(
        { error: "Invitation request access denied." },
        { status: 403 }
      );
    }

    const wsValidation = await validateWorkspaceMutationAllowed(admin, workspaceId);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    const validDepartment = await validateDepartment(admin, workspaceId, departmentId);

    if (!validDepartment) {
      return NextResponse.json({ error: "Invalid department." }, { status: 400 });
    }

    const validManager = await validateEmployee(admin, workspaceId, reportsToEmployeeId);

    if (!validManager) {
      return NextResponse.json({ error: "Invalid reporting manager." }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const { data: invitation, error: invitationError } = await admin
      .from("operations_invitations")
      .insert({
        workspace_id: workspaceId,
        email,
        invited_name: invitedName || null,
        requested_role: requestedRole,
        requested_scope_type: requestedScopeType,
        department_id: departmentId || null,
        reports_to_employee_id: reportsToEmployeeId || null,
        status: "pending_approval",
        requested_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select(
        "id, workspace_id, email, invited_name, requested_role, requested_scope_type, department_id, reports_to_employee_id, status, requested_by, created_at, updated_at"
      )
      .single();

    if (invitationError) {
      return NextResponse.json({ error: invitationError.message }, { status: 500 });
    }

    const { data: approvalRequest, error: approvalError } = await admin
      .from("operations_approval_requests")
      .insert({
        workspace_id: workspaceId,
        request_type: "invitation",
        related_table: "operations_invitations",
        related_id: invitation.id,
        title: `Approve invitation for ${email}`,
        description: `${invitedName || email} was requested as ${requestedRole} with ${requestedScopeType} scope.`,
        status: "pending",
        requested_by: user.id,
      })
      .select("id, status, created_at")
      .single();

    if (approvalError) {
      return NextResponse.json({ error: approvalError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "invitation.requested",
      entity_table: "operations_invitations",
      entity_id: invitation.id,
      new_data: {
        invitation,
        approvalRequest,
      },
      metadata: {
        source: "operations_invitations_api",
      },
    });

    return NextResponse.json({
      ok: true,
      invitation: {
        id: invitation.id,
        workspaceId: invitation.workspace_id,
        email: invitation.email,
        invitedName: invitation.invited_name,
        requestedRole: invitation.requested_role,
        requestedScopeType: invitation.requested_scope_type,
        departmentId: invitation.department_id,
        reportsToEmployeeId: invitation.reports_to_employee_id,
        status: invitation.status,
        requestedBy: invitation.requested_by,
        createdAt: invitation.created_at,
        updatedAt: invitation.updated_at,
      },
      approvalRequest: {
        id: approvalRequest.id,
        status: approvalRequest.status,
        createdAt: approvalRequest.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
