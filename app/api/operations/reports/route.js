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

    const { data, error } = await admin
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
