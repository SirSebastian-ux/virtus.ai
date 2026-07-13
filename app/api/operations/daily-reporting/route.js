import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeReviewStatus(value) {
  const status = cleanText(value).toLowerCase();

  if (["submitted", "supervisor_reviewed", "manager_reviewed", "approved", "rejected"].includes(status)) {
    return status;
  }

  return "submitted";
}

async function countRows(query) {
  const { count, error } = await query;

  if (error) throw new Error(error.message);
  return count || 0;
}

async function requireWorkspaceMember(admin, userId, workspaceId) {
  const { data, error } = await admin
    .from("workspace_members")
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function getAccessContext(admin, userId, workspaceId, membershipRole) {
  const { data: roleAssignment, error: roleError } = await admin
    .from("operations_role_assignments")
    .select("employee_id,role,department_id,reports_to_employee_id,scope_type,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (roleError) throw new Error(roleError.message);

  let employeeId = roleAssignment?.employee_id || null;

  if (!employeeId) {
    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id,department_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (employeeError) throw new Error(employeeError.message);

    employeeId = employee?.id || null;
  }

  return {
    role: roleAssignment?.role || membershipRole || "employee",
    employeeId,
    departmentId: roleAssignment?.department_id || null,
    reportsToEmployeeId: roleAssignment?.reports_to_employee_id || null,
    scopeType: roleAssignment?.scope_type || "self",
  };
}

function canReviewReports(role) {
  return ["owner", "director", "senior_manager", "department_manager", "supervisor"].includes(role);
}

function canViewCompany(role) {
  return ["owner", "director"].includes(role);
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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = cleanText(searchParams.get("workspaceId"));
    const reportDate = cleanText(searchParams.get("reportDate")) || new Date().toISOString().slice(0, 10);

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const wsValidation = await validateWorkspaceMutationAllowed(admin, workspaceId);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    const accessContext = await getAccessContext(admin, user.id, workspaceId, membership.role);

    if (!canReviewReports(accessContext.role)) {
      return NextResponse.json({ error: "Report review access denied." }, { status: 403 });
    }

    const now = new Date().toISOString();

    const { data: updatedReport, error: updateError } = await admin
      .from("operations_reports")
      .update({
        review_status: reviewStatus,
        reviewed_by: user.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", reportId)
      .select("id,workspace_id,review_status,reviewed_by,reviewed_at,updated_at")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: existingReport.workspace_id,
      actor_user_id: user.id,
      action: "operations_daily_report.reviewed",
      entity_table: "operations_reports",
      entity_id: reportId,
      previous_data: {
        reviewStatus: existingReport.review_status,
      },
      new_data: {
        reviewStatus,
      },
      metadata: {
        source: "operations_daily_reporting_api",
        accessContext,
      },
    });

    return NextResponse.json({
      ok: true,
      report: {
        id: updatedReport.id,
        workspaceId: updatedReport.workspace_id,
        reviewStatus: updatedReport.review_status,
        reviewedBy: updatedReport.reviewed_by,
        reviewedAt: updatedReport.reviewed_at,
        updatedAt: updatedReport.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
