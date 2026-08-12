import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  applyTaskScope,
  getOperationsAccessContext,
  getTeamEmployeeIds,
} from "@/lib/operations/scope";

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

async function countRows(query) {
  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
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
      return NextResponse.json({ metrics: null }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = cleanText(searchParams.get("workspaceId"));

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required for operations metrics." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getOperationsAccessContext(
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

    let activeEmployeesQuery = admin
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("employment_status", "active");

    const canCountCompanyEmployees =
      accessContext.role === "owner" ||
      (accessContext.scopeType === "company" &&
        accessContext.canViewCompany);

    if (!canCountCompanyEmployees) {
      if (
        accessContext.scopeType === "department" &&
        accessContext.canViewDepartment &&
        accessContext.departmentId
      ) {
        activeEmployeesQuery = activeEmployeesQuery.eq(
          "department_id",
          accessContext.departmentId
        );
      } else if (
        accessContext.scopeType === "team" &&
        accessContext.canViewTeam &&
        teamEmployeeIds.length > 0
      ) {
        activeEmployeesQuery = activeEmployeesQuery.in(
          "id",
          teamEmployeeIds
        );
      } else {
        activeEmployeesQuery = activeEmployeesQuery.eq(
          "id",
          "00000000-0000-0000-0000-000000000000"
        );
      }
    }

    let openTasksQuery = admin
      .from("operations_tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .neq("status", "completed")
      .neq("status", "cancelled");

    openTasksQuery = applyTaskScope(
      openTasksQuery,
      accessContext,
      teamEmployeeIds
    );

    const today = new Date().toISOString().slice(0, 10);

    const [
      openTasks,
      pendingPayments,
      openUrgentIssues,
      pendingDecisions,
      todayReports,
      activeEmployees,
    ] = await Promise.all([
      countRows(openTasksQuery),
      countRows(
        admin
          .from("operations_payments")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .neq("status", "confirmed")
      ),
      countRows(
        admin
          .from("operations_urgent_issues")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .neq("status", "resolved")
      ),
      countRows(
        admin
          .from("operations_decision_queue")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "pending")
      ),
      countRows(
        admin
          .from("operations_reports")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("report_date", today)
          .eq("review_status", "unreviewed")
      ),
      countRows(activeEmployeesQuery),
    ]);

    return NextResponse.json({
      metrics: {
        workspaceId,
        openTasks,
        pendingPayments,
        openUrgentIssues,
        pendingDecisions,
        todayReports,
        activeEmployees,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
