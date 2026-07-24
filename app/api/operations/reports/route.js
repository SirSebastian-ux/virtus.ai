import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  canViewCompanyData,
  canViewDepartmentData,
  canViewTeamData,
} from "@/lib/operations/access";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";
import {
  hasPermission,
  normalizePermissions,
} from "@/lib/operations/permissions";

function cleanText(value) {
  return String(value || "").trim();
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

async function getAccessContext(admin, userId, workspaceId, membershipRole) {
  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("employee_id, role, department_id, reports_to_employee_id, scope_type, status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const role = data?.role || membershipRole || "employee";

  const { data: defaultProfile, error: profileError } = await admin
    .from("operations_permission_profiles")
    .select("permissions")
    .eq("workspace_id", workspaceId)
    .eq("role", role)
    .eq("is_default", true)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: overrides, error: overridesError } = await admin
    .from("operations_user_permissions")
    .select("permission_key, permission_value")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (overridesError) {
    throw new Error(overridesError.message);
  }

  const permissions = normalizePermissions(defaultProfile?.permissions);

  (overrides || []).forEach((item) => {
    permissions[item.permission_key] = Boolean(item.permission_value);
  });

  return {
    role,
    employeeId: data?.employee_id || null,
    departmentId: data?.department_id || null,
    reportsToEmployeeId: data?.reports_to_employee_id || null,
    scopeType: data?.scope_type || "self",
    permissions,
  };
}

async function getTeamEmployeeIds(admin, workspaceId, managerEmployeeId) {
  if (!managerEmployeeId) return [];

  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("employee_id")
    .eq("workspace_id", workspaceId)
    .eq("reports_to_employee_id", managerEmployeeId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item) => item.employee_id).filter(Boolean);
}

function applyReportAccessFilter(query, accessContext, teamEmployeeIds = []) {
  if (canViewCompanyData(accessContext.role)) {
    return query;
  }

  if (canViewDepartmentData(accessContext.role) && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (canViewTeamData(accessContext.role) && accessContext.employeeId) {
    const allowedEmployeeIds = [accessContext.employeeId, ...teamEmployeeIds];

    if (allowedEmployeeIds.length > 0) {
      return query.in("employee_id", allowedEmployeeIds);
    }
  }

  if (accessContext.employeeId) {
    return query.eq("employee_id", accessContext.employeeId);
  }

  return query.eq(
    "employee_id",
    "00000000-0000-0000-0000-000000000000"
  );
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
      return NextResponse.json({ reports: [] }, { status: 401 });
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
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      workspaceId,
      membership.role
    );

    if (!hasPermission(accessContext.permissions, "reports.view")) {
      return NextResponse.json(
        { error: "You do not have permission to view reports." },
        { status: 403 }
      );
    }

    const teamEmployeeIds = await getTeamEmployeeIds(
      admin,
      workspaceId,
      accessContext.employeeId
    );

    let query = admin
      .from("operations_reports")
      .select(
        `
        id,
        workspace_id,
        employee_id,
        department_id,
        raw_report,
        report_date,
        source,
        ai_summary,
        ai_extracted,
        review_status,
        reviewed_by,
        reviewed_at,
        created_by,
        created_at,
        updated_at,
        employees (
          id,
          full_name,
          email,
          position_title
        ),
        departments (
          id,
          name
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50);

    query = applyReportAccessFilter(
      query,
      accessContext,
      teamEmployeeIds
    );

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      reports: (data || []).map((report) => ({
        id: report.id,
        workspaceId: report.workspace_id,
        employeeId: report.employee_id,
        employeeName: report.employees?.full_name || null,
        departmentId: report.department_id,
        departmentName: report.departments?.name || null,
        rawReport: report.raw_report,
        reportDate: report.report_date,
        source: report.source,
        aiSummary: report.ai_summary,
        aiExtracted: report.ai_extracted || {},
        reviewStatus: report.review_status || "pending",
        reviewedBy: report.reviewed_by || null,
        reviewedAt: report.reviewed_at || null,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
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
    const rawReport = cleanText(body?.rawReport);

    if (!workspaceId || !rawReport) {
      return NextResponse.json(
        { error: "workspaceId and rawReport are required." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace access denied." },
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

    const accessContext = await getAccessContext(
      admin,
      user.id,
      workspaceId,
      membership.role
    );

    if (!accessContext.employeeId) {
      return NextResponse.json(
        { error: "No employee profile is linked to this account." },
        { status: 403 }
      );
    }

    const { data: submittingEmployee, error: submittingEmployeeError } =
      await admin
        .from("employees")
        .select("id, department_id")
        .eq("id", accessContext.employeeId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

    if (submittingEmployeeError) {
      return NextResponse.json(
        { error: submittingEmployeeError.message },
        { status: 500 }
      );
    }

    if (!submittingEmployee) {
      return NextResponse.json(
        { error: "Your employee profile was not found." },
        { status: 403 }
      );
    }

    const reportEmployeeId = submittingEmployee.id;
    const reportDepartmentId =
      accessContext.departmentId ||
      submittingEmployee.department_id ||
      null;

    const { data: report, error: reportError } = await admin
      .from("operations_reports")
      .insert({
        workspace_id: workspaceId,
        employee_id: reportEmployeeId,
        department_id: reportDepartmentId,
        raw_report: rawReport,
        source: "operations_chat",
        ai_summary: null,
        ai_extracted: {},
        created_by: user.id,
      })
      .select(
        "id, workspace_id, employee_id, department_id, raw_report, report_date, source, ai_summary, ai_extracted, created_at, updated_at"
      )
      .single();

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "operations_report.created",
      entity_table: "operations_reports",
      entity_id: report.id,
      new_data: {
        employee_id: reportEmployeeId,
        department_id: reportDepartmentId,
        raw_report: rawReport,
      },
      metadata: {
        source: "operations_chat",
      },
    });

    return NextResponse.json({
      ok: true,
      report: {
        id: report.id,
        workspaceId: report.workspace_id,
        employeeId: report.employee_id,
        departmentId: report.department_id,
        rawReport: report.raw_report,
        reportDate: report.report_date,
        source: report.source,
        aiSummary: report.ai_summary,
        aiExtracted: report.ai_extracted || {},
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      },
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
    const reportId = cleanText(body?.reportId);

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required." }, { status: 400 });
    }

    const { data: report, error: reportError } = await admin
      .from("operations_reports")
      .select("id, workspace_id, review_status")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, report.workspace_id);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      report.workspace_id,
      membership.role
    );

    if (!hasPermission(accessContext.permissions, "reports.review")) {
      return NextResponse.json(
        { error: "You do not have permission to review reports." },
        { status: 403 }
      );
    }

    const teamEmployeeIds = await getTeamEmployeeIds(
      admin,
      report.workspace_id,
      accessContext.employeeId
    );

    let reportAccessQuery = admin
      .from("operations_reports")
      .select("id")
      .eq("id", reportId)
      .eq("workspace_id", report.workspace_id);

    reportAccessQuery = applyReportAccessFilter(
      reportAccessQuery,
      accessContext,
      teamEmployeeIds
    );

    const { data: accessibleReport, error: accessError } =
      await reportAccessQuery.maybeSingle();

    if (accessError) {
      return NextResponse.json({ error: accessError.message }, { status: 500 });
    }

    if (!accessibleReport) {
      return NextResponse.json(
        { error: "Report access denied." },
        { status: 403 }
      );
    }

    const wsValidation = await validateWorkspaceMutationAllowed(admin, report.workspace_id);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    const { data: updatedReport, error: updateError } = await admin
      .from("operations_reports")
      .update({
        review_status: "reviewed",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select("id, workspace_id, review_status, reviewed_at")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: report.workspace_id,
      actor_user_id: user.id,
      action: "operations_report.reviewed",
      entity_table: "operations_reports",
      entity_id: reportId,
      previous_data: {
        review_status: report.review_status,
      },
      new_data: {
        review_status: "reviewed",
      },
      metadata: {
        source: "operations_reports_api",
      },
    });

    return NextResponse.json({
      ok: true,
      report: {
        id: updatedReport.id,
        workspaceId: updatedReport.workspace_id,
        reviewStatus: updatedReport.review_status,
        reviewedAt: updatedReport.reviewed_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



