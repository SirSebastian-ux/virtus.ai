import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

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


import {
  canViewCompanyData,
  canViewDepartmentData,
  canViewTeamData,
} from "@/lib/operations/access";

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

  return {
    role,
    employeeId: data?.employee_id || null,
    departmentId: data?.department_id || null,
    reportsToEmployeeId: data?.reports_to_employee_id || null,
    scopeType: data?.scope_type || "self",
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
    const employeeId = cleanText(body?.employeeId);
    const departmentId = cleanText(body?.departmentId);
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

    const { data: report, error: reportError } = await admin
      .from("operations_reports")
      .insert({
        workspace_id: workspaceId,
        employee_id: employeeId || null,
        department_id: departmentId || null,
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
        employee_id: employeeId || null,
        department_id: departmentId || null,
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



