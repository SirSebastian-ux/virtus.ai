import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { extractOperationsFromReport } from "@/lib/operations-extraction";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";

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
    const reportId = cleanText(body?.reportId);

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required." }, { status: 400 });
    }

    const { data: report, error: reportError } = await admin
      .from("operations_reports")
      .select("id, workspace_id, employee_id, department_id, raw_report")
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

    const wsValidation = await validateWorkspaceMutationAllowed(admin, report.workspace_id);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    const extracted = extractOperationsFromReport(report.raw_report);

    const taskRows = extracted.tasks.map((task) => ({
      workspace_id: report.workspace_id,
      department_id: report.department_id,
      assigned_employee_id: report.employee_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      source_report_id: report.id,
      created_by: user.id,
    }));

    const urgentRows = extracted.urgentIssues.map((issue) => ({
      workspace_id: report.workspace_id,
      department_id: report.department_id,
      employee_id: report.employee_id,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      status: issue.status,
      source_report_id: report.id,
      created_by: user.id,
    }));

    const decisionRows = extracted.decisions.map((decision) => ({
      workspace_id: report.workspace_id,
      department_id: report.department_id,
      requested_by_employee_id: report.employee_id,
      decision_type: decision.decisionType,
      title: decision.title,
      description: decision.description,
      status: decision.status,
      priority: decision.priority,
      source_report_id: report.id,
      created_by: user.id,
    }));

    const cleanupTargets = [
      ["operations_tasks", "source_report_id"],
      ["operations_urgent_issues", "source_report_id"],
      ["operations_decision_queue", "source_report_id"],
    ];

    for (const [tableName, columnName] of cleanupTargets) {
      const { error: cleanupError } = await admin
        .from(tableName)
        .delete()
        .eq(columnName, report.id);

      if (cleanupError) {
        return NextResponse.json({ error: cleanupError.message }, { status: 500 });
      }
    }

    if (taskRows.length > 0) {
      const { error } = await admin.from("operations_tasks").insert(taskRows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (urgentRows.length > 0) {
      const { error } = await admin.from("operations_urgent_issues").insert(urgentRows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (decisionRows.length > 0) {
      const { error } = await admin.from("operations_decision_queue").insert(decisionRows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { error: updateError } = await admin
      .from("operations_reports")
      .update({
        ai_summary: extracted.summary || "No structured items detected.",
        ai_extracted: extracted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      extracted,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

