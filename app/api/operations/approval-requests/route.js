import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";
import { sendOperationsInvitationEmail } from "@/lib/operations/invitation-delivery";

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

function canDecideApproval(role) {
  return ["owner", "admin", "manager", "director", "senior_manager", "department_manager"].includes(role);
}

function mapApprovalRequest(item) {
  const invitation = item.invitation || null;

  return {
    id: item.id,
    workspaceId: item.workspace_id,
    requestType: item.request_type,
    relatedTable: item.related_table,
    relatedId: item.related_id,
    title: item.title,
    description: item.description,
    status: item.status,
    requestedBy: item.requested_by,
    decidedBy: item.decided_by,
    decidedAt: item.decided_at,
    decisionNotes: item.decision_notes,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    invitation: invitation
      ? {
          id: invitation.id,
          email: invitation.email,
          invitedName: invitation.invited_name,
          requestedRole: invitation.requested_role,
          requestedScopeType: invitation.requested_scope_type,
          departmentId: invitation.department_id,
          departmentName: invitation.departments?.name || null,
          reportsToEmployeeId: invitation.reports_to_employee_id,
          reportsToEmployeeName: invitation.manager?.full_name || null,
          status: invitation.status,
          requestedBy: invitation.requested_by,
          approvedBy: invitation.approved_by,
          approvedAt: invitation.approved_at,
          createdAt: invitation.created_at,
        }
      : null,
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
      return NextResponse.json({ approvalRequests: [] }, { status: 401 });
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
      .from("operations_approval_requests")
      .select(
        `
        id,
        workspace_id,
        request_type,
        related_table,
        related_id,
        title,
        description,
        status,
        requested_by,
        decided_by,
        decided_at,
        decision_notes,
        created_at,
        updated_at
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const invitationIds = (data || [])
      .filter((item) => item.related_table === "operations_invitations" && item.related_id)
      .map((item) => item.related_id);

    let invitationMap = new Map();

    if (invitationIds.length > 0) {
      const { data: invitations, error: invitationsError } = await admin
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
          created_at,
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
        .in("id", invitationIds);

      if (invitationsError) {
        return NextResponse.json({ error: invitationsError.message }, { status: 500 });
      }

      invitationMap = new Map((invitations || []).map((item) => [item.id, item]));
    }

    return NextResponse.json({
      approvalRequests: (data || []).map((item) =>
        mapApprovalRequest({
          ...item,
          invitation:
            item.related_table === "operations_invitations"
              ? invitationMap.get(item.related_id) || null
              : null,
        })
      ),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
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
    const requestId = cleanText(body?.requestId);
    const action = cleanText(body?.action).toLowerCase();
    const decisionNotes = cleanText(body?.decisionNotes);

    if (!workspaceId || !requestId || !action) {
      return NextResponse.json(
        { error: "workspaceId, requestId, and action are required." },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    if (!canDecideApproval(membership.role)) {
      return NextResponse.json({ error: "Approval access denied." }, { status: 403 });
    }

    const wsValidation = await validateWorkspaceMutationAllowed(admin, workspaceId);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    const { data: existingRequest, error: readError } = await admin
      .from("operations_approval_requests")
      .select(
        "id, workspace_id, request_type, related_table, related_id, title, status"
      )
      .eq("id", requestId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }

    if (!existingRequest) {
      return NextResponse.json({ error: "Approval request not found." }, { status: 404 });
    }

    if (
      existingRequest.request_type === "invitation" &&
      membership.role !== "owner"
    ) {
      return NextResponse.json(
        { error: "Only the workspace owner can approve invitations." },
        { status: 403 }
      );
    }

    if (existingRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending approval requests can be decided." },
        { status: 400 }
      );
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const decidedAt = new Date().toISOString();

    const { data: approvalRequest, error: updateError } = await admin
      .from("operations_approval_requests")
      .update({
        status: nextStatus,
        decided_by: user.id,
        decided_at: decidedAt,
        decision_notes: decisionNotes || null,
      })
      .eq("id", requestId)
      .eq("workspace_id", workspaceId)
      .select(
        "id, workspace_id, request_type, related_table, related_id, title, description, status, requested_by, decided_by, decided_at, decision_notes, created_at, updated_at"
      )
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    let invitation = null;

    if (
      existingRequest.related_table === "operations_invitations" &&
      existingRequest.related_id
    ) {
      const invitationUpdate =
        action === "approve"
          ? {
              status: "approved",
              approved_by: user.id,
              approved_at: decidedAt,
            }
          : {
              status: "rejected",
            };

      const { data: updatedInvitation, error: invitationError } = await admin
        .from("operations_invitations")
        .update(invitationUpdate)
        .eq("id", existingRequest.related_id)
        .eq("workspace_id", workspaceId)
        .select(
          "id, workspace_id, email, invited_name, requested_role, requested_scope_type, department_id, reports_to_employee_id, status, requested_by, approved_by, approved_at, auth_user_id, sent_at, delivery_attempts, delivery_error, expires_at, created_at, updated_at"
        )
        .single();

      if (invitationError) {
        return NextResponse.json({ error: invitationError.message }, { status: 500 });
      }

      invitation = updatedInvitation;

      if (action === "approve") {
        const { data: workspace, error: workspaceError } = await admin
          .from("workspaces")
          .select("name")
          .eq("id", workspaceId)
          .maybeSingle();

        if (workspaceError) {
          return NextResponse.json(
            { error: workspaceError.message },
            { status: 500 }
          );
        }

        try {
          const delivery = await sendOperationsInvitationEmail({
            admin,
            invitation: updatedInvitation,
            workspaceName: workspace?.name || "",
          });

          invitation = delivery.invitation;
        } catch (deliveryError) {
          await admin.from("operations_activity_logs").insert({
            workspace_id: workspaceId,
            actor_user_id: user.id,
            action: "invitation.delivery_failed",
            entity_table: "operations_invitations",
            entity_id: updatedInvitation.id,
            new_data: {
              invitationId: updatedInvitation.id,
              email: updatedInvitation.email,
            },
            metadata: {
              source: "operations_approval_requests_api",
              error: cleanText(deliveryError.message).slice(0, 1000),
            },
          });

          return NextResponse.json(
            {
              error:
                "The invitation was approved, but the email could not be sent. It can be retried.",
              details: deliveryError.message,
              invitationId: updatedInvitation.id,
            },
            { status: 502 }
          );
        }
      }
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: `approval_request.${nextStatus}`,
      entity_table: "operations_approval_requests",
      entity_id: approvalRequest.id,
      previous_data: existingRequest,
      new_data: {
        approvalRequest,
        invitation,
      },
      metadata: {
        source: "operations_approval_requests_api",
      },
    });

    return NextResponse.json({
      ok: true,
      approvalRequest: mapApprovalRequest({
        ...approvalRequest,
        invitation,
      }),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
