import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";
import { sendOperationsInvitationEmail } from "@/lib/operations/invitation-delivery";

const ALLOWED_ROLES = new Set([
  "owner",
  "director",
  "senior_manager",
  "department_manager",
  "supervisor",
  "employee",
]);

const INVITATION_REQUEST_ROLES = new Set([
  "owner",
  "director",
  "senior_manager",
  "department_manager",
  "supervisor",
]);

const ALLOWED_SCOPE_TYPES = new Set([
  "company",
  "department",
  "team",
  "self",
]);

const ACTIVE_INVITATION_STATUSES = [
  "pending_approval",
  "approved",
  "sent",
];

function cleanText(value) {
  return String(value || "").trim();
}

function cleanEmail(value) {
  return cleanText(value).toLowerCase();
}

function mapInvitation(item) {
  return {
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
    authUserId: item.auth_user_id,
    sentAt: item.sent_at,
    deliveryAttempts: item.delivery_attempts || 0,
    deliveryError: item.delivery_error,
    expiresAt: item.expires_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
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
    .eq("status", "active")
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
    .eq("employment_status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
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

    const membership = await requireWorkspaceMember(
      admin,
      user.id,
      workspaceId
    );

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
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
        auth_user_id,
        sent_at,
        delivery_attempts,
        delivery_error,
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
      invitations: (data || []).map(mapInvitation),
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
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const workspaceId = cleanText(body?.workspaceId);
    const email = cleanEmail(body?.email);
    const invitedName = cleanText(body?.invitedName);
    const requestedRole = cleanText(
      body?.requestedRole || "employee"
    );
    const requestedScopeType = cleanText(
      body?.requestedScopeType || "self"
    );
    const departmentId = cleanText(body?.departmentId);
    const reportsToEmployeeId = cleanText(
      body?.reportsToEmployeeId
    );

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
      return NextResponse.json(
        { error: "Invalid email." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.has(requestedRole)) {
      return NextResponse.json(
        { error: "Invalid requestedRole." },
        { status: 400 }
      );
    }

    if (!ALLOWED_SCOPE_TYPES.has(requestedScopeType)) {
      return NextResponse.json(
        { error: "Invalid requestedScopeType." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(
      admin,
      user.id,
      workspaceId
    );

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    if (!INVITATION_REQUEST_ROLES.has(membership.role)) {
      return NextResponse.json(
        { error: "Invitation request access denied." },
        { status: 403 }
      );
    }

    const workspaceValidation =
      await validateWorkspaceMutationAllowed(admin, workspaceId);

    if (!workspaceValidation.allowed) {
      return NextResponse.json(
        { error: workspaceValidation.message },
        { status: workspaceValidation.status }
      );
    }

    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .select("id, name, owner_user_id")
      .eq("id", workspaceId)
      .maybeSingle();

    if (workspaceError) {
      return NextResponse.json(
        { error: workspaceError.message },
        { status: 500 }
      );
    }

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 404 }
      );
    }

    const validDepartment = await validateDepartment(
      admin,
      workspaceId,
      departmentId
    );

    if (!validDepartment) {
      return NextResponse.json(
        { error: "Invalid department." },
        { status: 400 }
      );
    }

    const validManager = await validateEmployee(
      admin,
      workspaceId,
      reportsToEmployeeId
    );

    if (!validManager) {
      return NextResponse.json(
        { error: "Invalid reporting manager." },
        { status: 400 }
      );
    }

    const { data: existingInvitation, error: existingError } =
      await admin
        .from("operations_invitations")
        .select("id, status")
        .eq("workspace_id", workspaceId)
        .ilike("email", email)
        .in("status", ACTIVE_INVITATION_STATUSES)
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    if (existingInvitation) {
      return NextResponse.json(
        {
          error:
            "An active invitation already exists for this email address.",
          invitationId: existingInvitation.id,
        },
        { status: 409 }
      );
    }

    const requesterIsOwner =
      membership.role === "owner" ||
      workspace.owner_user_id === user.id;

    const approvedAt = requesterIsOwner
      ? new Date().toISOString()
      : null;

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
        status: requesterIsOwner
          ? "approved"
          : "pending_approval",
        requested_by: user.id,
        approved_by: requesterIsOwner ? user.id : null,
        approved_at: approvedAt,
        expires_at: expiresAt.toISOString(),
      })
      .select(
        "id, workspace_id, email, invited_name, requested_role, requested_scope_type, department_id, reports_to_employee_id, status, requested_by, approved_by, approved_at, auth_user_id, sent_at, delivery_attempts, delivery_error, expires_at, created_at, updated_at"
      )
      .single();

    if (invitationError) {
      if (invitationError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "An active invitation already exists for this email address.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: invitationError.message },
        { status: 500 }
      );
    }

    const approvalStatus = requesterIsOwner
      ? "approved"
      : "pending";

    const { data: approvalRequest, error: approvalError } = await admin
      .from("operations_approval_requests")
      .insert({
        workspace_id: workspaceId,
        request_type: "invitation",
        related_table: "operations_invitations",
        related_id: invitation.id,
        title: `Approve invitation for ${email}`,
        description:
          `${invitedName || email} was requested as ` +
          `${requestedRole} with ${requestedScopeType} scope.`,
        status: approvalStatus,
        requested_by: user.id,
        assigned_approver: workspace.owner_user_id,
        decided_by: requesterIsOwner ? user.id : null,
        decided_at: approvedAt,
        decision_notes: requesterIsOwner
          ? "Automatically approved because the workspace owner created the invitation."
          : null,
      })
      .select("id, status, created_at")
      .single();

    if (approvalError) {
      await admin
        .from("operations_invitations")
        .delete()
        .eq("id", invitation.id)
        .eq("workspace_id", workspaceId);

      return NextResponse.json(
        { error: approvalError.message },
        { status: 500 }
      );
    }

    let finalInvitation = invitation;
    let deliveryMode = null;

    if (requesterIsOwner) {
      try {
        const delivery = await sendOperationsInvitationEmail({
          admin,
          invitation,
          workspaceName: workspace.name,
        });

        finalInvitation = delivery.invitation;
        deliveryMode = delivery.deliveryMode;
      } catch (deliveryError) {
        await admin.from("operations_activity_logs").insert({
          workspace_id: workspaceId,
          actor_user_id: user.id,
          action: "invitation.delivery_failed",
          entity_table: "operations_invitations",
          entity_id: invitation.id,
          new_data: {
            invitationId: invitation.id,
            email,
          },
          metadata: {
            source: "operations_invitations_api",
            error: cleanText(deliveryError.message).slice(0, 1000),
          },
        });

        return NextResponse.json(
          {
            error:
              "The invitation was approved, but the email could not be sent. It can be retried.",
            details: deliveryError.message,
            invitationId: invitation.id,
          },
          { status: 502 }
        );
      }
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: requesterIsOwner
        ? "invitation.sent"
        : "invitation.requested",
      entity_table: "operations_invitations",
      entity_id: invitation.id,
      new_data: {
        invitation: finalInvitation,
        approvalRequest,
      },
      metadata: {
        source: "operations_invitations_api",
        deliveryMode,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        invitation: mapInvitation(finalInvitation),
        approvalRequest: {
          id: approvalRequest.id,
          status: approvalRequest.status,
          createdAt: approvalRequest.created_at,
        },
        deliveryMode,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}