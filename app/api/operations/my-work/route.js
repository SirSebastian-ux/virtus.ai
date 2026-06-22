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

async function getEmployeeContext(admin, userId, workspaceId, membershipRole) {
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
      .select("id")
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

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    const accessContext = await getEmployeeContext(
      admin,
      user.id,
      workspaceId,
      membership.role
    );

    if (!accessContext.employeeId) {
      return NextResponse.json({
        workspaceId,
        accessContext,
        metrics: {
          openTasks: 0,
          overdueTasks: 0,
          urgentIssues: 0,
          criticalIssues: 0,
          todayReports: 0,
          pendingDecisions: 0,
          recentActivity: 0,
        },
        employee: null,
        tasks: [],
        reports: [],
        urgentIssues: [],
        pendingDecisions: [],
        activity: [],
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id,full_name,email,position_title,department_id,employment_status")
      .eq("workspace_id", workspaceId)
      .eq("id", accessContext.employeeId)
      .maybeSingle();

    if (employeeError) {
      return NextResponse.json({ error: employeeError.message }, { status: 500 });
    }

    const [
      tasksResult,
      reportsResult,
      urgentIssuesResult,
      decisionsResult,
      activityResult,
      openTasks,
      overdueTasks,
      urgentIssues,
      criticalIssues,
      todayReports,
      pendingDecisions,
      recentActivity,
    ] = await Promise.all([
      admin
        .from("operations_tasks")
        .select("id,title,status,priority,due_date,created_at,updated_at")
        .eq("workspace_id", workspaceId)
        .eq("assigned_employee_id", accessContext.employeeId)
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(12),

      admin
        .from("operations_reports")
        .select("id,report_date,raw_report,ai_summary,created_at,updated_at")
        .eq("workspace_id", workspaceId)
        .eq("employee_id", accessContext.employeeId)
        .order("created_at", { ascending: false })
        .limit(12),

      admin
        .from("operations_urgent_issues")
        .select("id,title,description,severity,status,created_at,updated_at")
        .eq("workspace_id", workspaceId)
        .eq("employee_id", accessContext.employeeId)
        .neq("status", "resolved")
        .neq("status", "closed")
        .order("created_at", { ascending: false })
        .limit(12),

      admin
        .from("operations_decision_queue")
        .select("id,title,description,priority,status,created_at,updated_at")
        .eq("workspace_id", workspaceId)
        .eq("requested_by_employee_id", accessContext.employeeId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(12),

      admin
        .from("operations_activity_logs")
        .select("id,action,entity_table,entity_id,created_at")
        .eq("workspace_id", workspaceId)
        .eq("actor_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12),

      countRows(
        admin
          .from("operations_tasks")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("assigned_employee_id", accessContext.employeeId)
          .neq("status", "completed")
      ),

      countRows(
        admin
          .from("operations_tasks")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("assigned_employee_id", accessContext.employeeId)
          .neq("status", "completed")
          .lt("due_date", today)
      ),

      countRows(
        admin
          .from("operations_urgent_issues")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("employee_id", accessContext.employeeId)
          .neq("status", "resolved")
          .neq("status", "closed")
      ),

      countRows(
        admin
          .from("operations_urgent_issues")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("employee_id", accessContext.employeeId)
          .eq("severity", "critical")
          .neq("status", "resolved")
          .neq("status", "closed")
      ),

      countRows(
        admin
          .from("operations_reports")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("employee_id", accessContext.employeeId)
          .eq("report_date", today)
      ),

      countRows(
        admin
          .from("operations_decision_queue")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("requested_by_employee_id", accessContext.employeeId)
          .eq("status", "pending")
      ),

      countRows(
        admin
          .from("operations_activity_logs")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("actor_user_id", user.id)
      ),
    ]);

    for (const result of [
      tasksResult,
      reportsResult,
      urgentIssuesResult,
      decisionsResult,
      activityResult,
    ]) {
      if (result.error) throw new Error(result.error.message);
    }

    return NextResponse.json({
      workspaceId,
      accessContext,
      employee,
      metrics: {
        openTasks,
        overdueTasks,
        urgentIssues,
        criticalIssues,
        todayReports,
        pendingDecisions,
        recentActivity,
      },
      tasks: tasksResult.data || [],
      reports: reportsResult.data || [],
      urgentIssues: urgentIssuesResult.data || [],
      pendingDecisions: decisionsResult.data || [],
      activity: activityResult.data || [],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
