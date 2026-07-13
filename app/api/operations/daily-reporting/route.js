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

    const accessContext = await getAccessContext(admin, user.id, workspaceId, membership.role);

    let reportsQuery = admin
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
      .eq("report_date", reportDate)
      .order("created_at", { ascending: false });

    if (!canViewCompany(accessContext.role)) {
      if (accessContext.departmentId && accessContext.role !== "employee") {
        reportsQuery = reportsQuery.eq("department_id", accessContext.departmentId);
      } else if (accessContext.employeeId) {
        reportsQuery = reportsQuery.eq("employee_id", accessContext.employeeId);
      }
    }

    const { data: reports, error: reportsError } = await reportsQuery;

    if (reportsError) {
      return NextResponse.json({ error: reportsError.message }, { status: 500 });
    }

    const [
      activeEmployees,
      submittedReports,
      reviewedReports,
      activeDepartments,
      departmentsResult,
    ] = await Promise.all([
      countRows(
        admin
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("employment_status", "active")
      ),

      countRows(
        admin
          .from("operations_reports")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("report_date", reportDate)
      ),

      countRows(
        admin
          .from("operations_reports")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("report_date", reportDate)
          .eq("review_status", "reviewed")
      ),

      countRows(
        admin
          .from("departments")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "active")
      ),

      admin
        .from("departments")
        .select("id,name")
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .order("name", { ascending: true }),
    ]);

    if (departmentsResult.error) {
      return NextResponse.json({ error: departmentsResult.error.message }, { status: 500 });
    }

    const submittedDepartmentIds = new Set(
      (reports || []).map((report) => report.department_id).filter(Boolean)
    );

    const missingDepartmentReports = (departmentsResult.data || []).filter(
      (department) => !submittedDepartmentIds.has(department.id)
    );

    return NextResponse.json({
      workspaceId,
      reportDate,
      accessContext,
      metrics: {
        activeEmployees,
        submittedReports,
        reviewedReports,
        unreviewedReports: Math.max(submittedReports - reviewedReports, 0),
        activeDepartments,
        departmentsMissingReports: missingDepartmentReports.length,
      },
      reports: (reports || []).map((report) => ({
        id: report.id,
        workspaceId: report.workspace_id,
        employeeId: report.employee_id,
        employeeName: report.employees?.full_name || null,
        employeeEmail: report.employees?.email || null,
        positionTitle: report.employees?.position_title || null,
        departmentId: report.department_id,
        departmentName: report.departments?.name || null,
        rawReport: report.raw_report,
        reportDate: report.report_date,
        source: report.source,
        aiSummary: report.ai_summary,
        aiExtracted: report.ai_extracted || {},
        reviewStatus: report.review_status || "submitted",
        reviewedBy: report.reviewed_by,
        reviewedAt: report.reviewed_at,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      })),
      missingDepartmentReports,
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
    const departmentId = cleanText(body?.departmentId) || null;
    const employeeId = cleanText(body?.employeeId) || null;

    if (!workspaceId || !rawReport) {
      return NextResponse.json(
        { error: "workspaceId and rawReport are required." },
        { status: 400 }
      );
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

    const reportEmployeeId = employeeId || accessContext.employeeId;
    const reportDepartmentId = departmentId || accessContext.departmentId;
    const today = new Date().toISOString().split("T")[0];

    // Check for duplicate report for same employee on same day
    if (reportEmployeeId) {
      const { data: existingReport, error: duplicateCheckError } = await admin
        .from("operations_reports")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("employee_id", reportEmployeeId)
        .eq("report_date", today)
        .maybeSingle();

      if (duplicateCheckError) {
        return NextResponse.json({ error: duplicateCheckError.message }, { status: 500 });
      }

      if (existingReport) {
        return NextResponse.json(
          { error: "A daily report has already been submitted for this date." },
          { status: 409 }
        );
      }
    }

    const insertPayload = {
      workspace_id: workspaceId,
      employee_id: reportEmployeeId,
      department_id: reportDepartmentId,
      raw_report: rawReport,
      source: "daily_reporting",
      ai_summary: null,
      ai_extracted: {},
      review_status: "submitted",
      created_by: user.id,
    };

    const { data: report, error: insertError } = await admin
      .from("operations_reports")
      .insert(insertPayload)
      .select("id,workspace_id,employee_id,department_id,report_date,review_status,created_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "operations_daily_report.submitted",
      entity_table: "operations_reports",
      entity_id: report.id,
      previous_data: null,
      new_data: insertPayload,
      metadata: {
        source: "operations_daily_reporting_api",
        accessContext,
      },
    });

    return NextResponse.json({
      ok: true,
      report: {
        id: report.id,
        workspaceId: report.workspace_id,
        employeeId: report.employee_id,
        departmentId: report.department_id,
        reportDate: report.report_date,
        reviewStatus: report.review_status,
        createdAt: report.created_at,
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
    const reviewStatus = normalizeReviewStatus(body?.reviewStatus);

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required." }, { status: 400 });
    }

    const { data: existingReport, error: existingError } = await admin
      .from("operations_reports")
      .select("id,workspace_id,department_id,employee_id,review_status")
      .eq("id", reportId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, existingReport.workspace_id);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const wsValidation = await validateWorkspaceMutationAllowed(admin, existingReport.workspace_id);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    const accessContext = await getAccessContext(
      admin,
      user.id,
      existingReport.workspace_id,
      membership.role
    );

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
