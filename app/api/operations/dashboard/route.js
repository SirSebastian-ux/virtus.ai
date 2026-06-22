import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

function cleanText(value) {
  return String(value || "").trim();
}

async function countRows(query) {
  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}

function applyScope(query, accessContext, column = "department_id") {
  if (accessContext.scopeType === "company") {
    return query;
  }

  if (accessContext.scopeType === "department" && accessContext.departmentId) {
    return query.eq(column, accessContext.departmentId);
  }

  if (accessContext.scopeType === "self" && accessContext.employeeId) {
    return query.eq("employee_id", accessContext.employeeId);
  }

  return query;
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

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    const { data: membership, error: membershipError } = await admin
      .from("workspace_members")
      .select("role,status")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const { data: roleAssignment, error: roleError } = await admin
      .from("operations_role_assignments")
      .select("role, department_id, employee_id, scope_type")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    const accessContext = {
      role: roleAssignment?.role || membership.role || "employee",
      scopeType: roleAssignment?.scope_type || "self",
      departmentId: roleAssignment?.department_id || null,
      employeeId: roleAssignment?.employee_id || null,
    };

    const today = new Date().toISOString().slice(0, 10);

    const employeesQuery = applyScope(
      admin
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("employment_status", "active"),
      accessContext
    );

    const tasksQuery = applyScope(
      admin
        .from("operations_tasks")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .neq("status", "completed"),
      accessContext,
      "department_id"
    );

    const urgentIssuesQuery = applyScope(
      admin
        .from("operations_urgent_issues")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .neq("status", "resolved"),
      accessContext,
      "department_id"
    );

    const decisionsQuery = applyScope(
      admin
        .from("operations_decision_queue")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "pending"),
      accessContext,
      "department_id"
    );

    const reportsQuery = applyScope(
      admin
        .from("operations_reports")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("report_date", today),
      accessContext,
      "department_id"
    );

    const [
      activeEmployees,
      openTasks,
      openUrgentIssues,
      pendingDecisions,
      todayReports,
    ] = await Promise.all([
      countRows(employeesQuery),
      countRows(tasksQuery),
      countRows(urgentIssuesQuery),
      countRows(decisionsQuery),
      countRows(reportsQuery),
    ]);

    return NextResponse.json({
      accessContext,
      metrics: {
        workspaceId,
        activeEmployees,
        openTasks,
        openUrgentIssues,
        pendingDecisions,
        todayReports,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
