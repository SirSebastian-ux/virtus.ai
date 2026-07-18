import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

function cleanText(value) {
  return String(value || "").trim();
}

function cleanEmail(value) {
  return cleanText(value).toLowerCase();
}

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id || !user?.email) {
    return null;
  }

  return user;
}

async function getInvitation(admin, invitationId) {
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
      accepted_by,
      accepted_at,
      expires_at,
      created_at,
      workspaces:workspace_id (
        id,
        name,
        status
      ),
      departments:department_id (
        id,
        name
      ),
      manager:reports_to_employee_id (
        id,
        full_name,
        position_title
      )
    `
    )
    .eq("id", invitationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function mapInvitation(invitation) {
  return {
    id: invitation.id,
    workspaceId: invitation.workspace_id,
    workspaceName:
      invitation.workspaces?.name || "Company workspace",
    email: invitation.email,
    invitedName: invitation.invited_name,
    requestedRole: invitation.requested_role,
    requestedScopeType: invitation.requested_scope_type,
    departmentId: invitation.department_id,
    departmentName: invitation.departments?.name || null,
    reportsToEmployeeId: invitation.reports_to_employee_id,
    reportsToEmployeeName:
      invitation.manager?.full_name || null,
    status: invitation.status,
    acceptedAt: invitation.accepted_at,
    expiresAt: invitation.expires_at,
    createdAt: invitation.created_at,
  };
}

function invitationAccessError(invitation, user) {
  if (!invitation) {
    return {
      error: "Invitation not found.",
      status: 404,
    };
  }

  if (cleanEmail(invitation.email) !== cleanEmail(user.email)) {
    return {
      error:
        "This invitation belongs to a different email address.",
      status: 403,
    };
  }

  return null;
}

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const invitationId = cleanText(
      searchParams.get("invitationId")
    );

    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const invitation = await getInvitation(admin, invitationId);
    const accessError = invitationAccessError(invitation, user);

    if (accessError) {
      return NextResponse.json(
        { error: accessError.error },
        { status: accessError.status }
      );
    }

    if (
      invitation.status !== "accepted" &&
      invitation.expires_at &&
      new Date(invitation.expires_at).getTime() <= Date.now()
    ) {
      await admin
        .from("operations_invitations")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      invitation.status = "expired";
    }

    return NextResponse.json({
      invitation: mapInvitation(invitation),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const invitationId = cleanText(body?.invitationId);

    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const invitation = await getInvitation(admin, invitationId);
    const accessError = invitationAccessError(invitation, user);

    if (accessError) {
      return NextResponse.json(
        { error: accessError.error },
        { status: accessError.status }
      );
    }

    if (
      invitation.status === "accepted" &&
      invitation.accepted_by === user.id
    ) {
      const { data: employee } = await admin
        .from("employees")
        .select("id")
        .eq("workspace_id", invitation.workspace_id)
        .eq("user_id", user.id)
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        alreadyAccepted: true,
        workspace: {
          id: invitation.workspace_id,
          name:
            invitation.workspaces?.name ||
            "Company workspace",
        },
        employeeId: employee?.id || null,
      });
    }

    if (!["approved", "sent"].includes(invitation.status)) {
      const messages = {
        pending_approval:
          "This invitation is still waiting for owner approval.",
        rejected: "This invitation was rejected.",
        cancelled: "This invitation was cancelled.",
        expired: "This invitation has expired.",
      };

      return NextResponse.json(
        {
          error:
            messages[invitation.status] ||
            "This invitation cannot be accepted.",
        },
        {
          status:
            invitation.status === "expired" ? 410 : 409,
        }
      );
    }

    if (
      invitation.expires_at &&
      new Date(invitation.expires_at).getTime() <= Date.now()
    ) {
      await admin
        .from("operations_invitations")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "This invitation has expired." },
        { status: 410 }
      );
    }

    const userName =
      cleanText(user.user_metadata?.full_name) ||
      cleanText(user.user_metadata?.name) ||
      invitation.invited_name ||
      user.email;

    const { data: acceptance, error: acceptanceError } =
      await admin.rpc("accept_operations_invitation", {
        target_invitation_id: invitation.id,
        target_user_id: user.id,
        target_user_email: user.email,
        target_user_name: userName,
      });

    if (acceptanceError) {
      return NextResponse.json(
        { error: acceptanceError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      alreadyAccepted: false,
      workspace: {
        id: acceptance.workspaceId,
        name:
          invitation.workspaces?.name ||
          "Company workspace",
      },
      employeeId: acceptance.employeeId,
      roleAssignmentId: acceptance.roleAssignmentId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}