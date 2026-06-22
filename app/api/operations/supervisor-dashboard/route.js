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

async function getAccessContext(admin, userId, workspaceId, membershipRole) {
  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("employee_id,role,department_id,reports_to_employee_id,scope_type,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    role: data?.role || membershipRole || "employee",
    employeeId: data?.employee_id || null,
    departmentId: data?.department_id || null,
    reportsToEmployeeId: data?.reports_to_employee_id || null,
    scopeType: data?.scope_type || "self",
  };
}

async function getTeamEmployeeIds(admin, workspaceId, supervisorEmployeeId) {
  if (!supervisorEmployeeId) return [];

  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("employee_id")
    .eq("workspace_id", workspaceId)
    .eq("reports_to_employee_id", supervisorEmployeeId)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  return (data || []).map((item) => item.employee_id).filter(Boolean);
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

    const accessContext = await getAccessContext(
      admin,
      user.id,
      workspaceId,
      membership.role
    );

    const today = new Date().toISOString().slice(0, 10);
    const teamEmployeeIds = await getTeamEmployeeIds(
      admin,
      workspaceId,
      accessContext.employeeId
    );

    const visibleEmployeeIds = accessContext.employeeId
      ? [accessContext.employeeId, ...teamEmployeeIds]
      : teamEmployeeIds;

    if (visibleEmployeeIds.length === 0) {
      return NextResponse.json({
        workspaceId,
        accessContext,
        metrics: {
          teamMembers: 0,
          openTasks: 0,
          overdueTasks: 0,
          urgentIssues: 0,
          criticalIssues: 0,
          todayReports: 0,
          pendingDecisions: 0,
        },
        teamMembers: [],
        tasks: [],
        urgentIssues: [],
        reports: [],
        pendingDecisions: [],
      });
    }

    const [
      teamMembersResult,
      tasksResult,
      urgentIssuesResult,
      reportsResult,
      decisionsResult,
      openTasks,
      overdueTasks,
      urgentIssues,
      criticalIssues,
      todayReports,
      pendingDecisions,
    ] = await Promise.all([
      admin
        .from("employees")
        .select("id,full_name,email,position_title,department_id")
        .eq("workspace_id", workspaceId)
        .in("id", visibleEmployeeIds)
        .order("full_name", { ascending: true }),

      admin
        .from("operations_tasks")
        .select("id,title,status,priority,due_date,assigned_employee_id,created_at")
        .eq("workspace_id", workspaceId)
        .in("assigned_employee_id", visibleEmployeeIds)
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(12),

      admin
        .from("operations_urgent_issues")
        .select("id,title,severity,status,employee_id,created_at")
        .eq("workspace_id", workspaceId)
        .in("employee_id", visibleEmployeeIds)
        .neq("status", "resolved")
        .neq("status", "closed")
        .order("created_at", { ascending: false })
        .limit(12),

      admin
        .from("operations_reports")
        .select("id,employee_id,report_date,ai_summary,created_at")
        .eq("workspace_id", workspaceId)
        .in("employee_id", visibleEmployeeIds)
        .eq("report_date", today)
        .order("created_at", { ascending: false })
        .limit(12),

      admin
        .from("operations_decision_queue")
        .select("id,title,priority,status,requested_by_employee_id,created_at")
        .eq("workspace_id", workspaceId)
        .in("requested_by_employee_id", visibleEmployeeIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(12),

      countRows(
        admin
          .from("operations_tasks")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("assigned_employee_id", visibleEmployeeIds)
          .neq("status", "completed")
      ),

      countRows(
        admin
          .from("operations_tasks")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("assigned_employee_id", visibleEmployeeIds)
          .neq("status", "completed")
          .lt("due_date", today)
      ),

      countRows(
        admin
          .from("operations_urgent_issues")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("employee_id", visibleEmployeeIds)
          .neq("status", "resolved")
          .neq("status", "closed")
      ),

      countRows(
        admin
          .from("operations_urgent_issues")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("employee_id", visibleEmployeeIds)
          .eq("severity", "critical")
          .neq("status", "resolved")
          .neq("status", "closed")
      ),

      countRows(
        admin
          .from("operations_reports")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("employee_id", visibleEmployeeIds)
          .eq("report_date", today)
      ),

      countRows(
        admin
          .from("operations_decision_queue")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("requested_by_employee_id", visibleEmployeeIds)
          .eq("status", "pending")
      ),
    ]);

    for (const result of [
      teamMembersResult,
      tasksResult,
      urgentIssuesResult,
      reportsResult,
      decisionsResult,
    ]) {
      if (result.error) throw new Error(result.error.message);
    }

    return NextResponse.json({
      workspaceId,
      accessContext,
      metrics: {
        teamMembers: teamMembersResult.data?.length || 0,
        openTasks,
        overdueTasks,
        urgentIssues,
        criticalIssues,
        todayReports,
        pendingDecisions,
      },
      teamMembers: teamMembersResult.data || [],
      tasks: tasksResult.data || [],
      urgentIssues: urgentIssuesResult.data || [],
      reports: reportsResult.data || [],
      pendingDecisions: decisionsResult.data || [],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
