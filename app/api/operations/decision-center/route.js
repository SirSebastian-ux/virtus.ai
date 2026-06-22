import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

function cleanText(value) {
  return String(value || "").trim();
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

function canViewDecisionCenter(role) {
  return ["owner", "director", "senior_manager", "department_manager", "supervisor"].includes(role);
}

function canViewCompany(role) {
  return ["owner", "director"].includes(role);
}

function canViewDepartment(role) {
  return ["senior_manager", "department_manager", "supervisor"].includes(role);
}

function applyDepartmentScope(query, accessContext) {
  if (canViewCompany(accessContext.role)) return query;

  if (canViewDepartment(accessContext.role) && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  return query.eq("department_id", "00000000-0000-0000-0000-000000000000");
}

function priorityScore(item) {
  if (item.type === "critical_alert") return 100;
  if (item.type === "urgent_decision") return 90;
  if (item.type === "high_decision") return 80;
  if (item.type === "overdue_task") return 70;
  if (item.type === "urgent_issue") return 65;
  if (item.type === "missing_report") return 50;
  return 40;
}

function mapPriorityItem(item) {
  return {
    ...item,
    score: priorityScore(item),
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
    const today = new Date().toISOString().slice(0, 10);

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const accessContext = await getAccessContext(admin, user.id, workspaceId, membership.role);

    if (!canViewDecisionCenter(accessContext.role)) {
      return NextResponse.json({ error: "Decision Center access denied." }, { status: 403 });
    }

    let alertsQuery = admin
      .from("operations_management_alerts")
      .select("id,department_id,alert_type,title,message,severity,status,created_at")
      .eq("workspace_id", workspaceId)
      .in("status", ["open", "acknowledged", "investigating"])
      .in("severity", ["critical", "high"])
      .order("created_at", { ascending: false })
      .limit(20);

    alertsQuery = applyDepartmentScope(alertsQuery, accessContext);

    const { data: alerts, error: alertsError } = await alertsQuery;

    if (alertsError) throw new Error(alertsError.message);

    let decisionsQuery = admin
      .from("operations_decision_queue")
      .select("id,department_id,decision_type,title,description,status,priority,assigned_to,created_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(20);

    decisionsQuery = applyDepartmentScope(decisionsQuery, accessContext);

    const { data: decisions, error: decisionsError } = await decisionsQuery;

    if (decisionsError) throw new Error(decisionsError.message);

    let tasksQuery = admin
      .from("operations_tasks")
      .select("id,department_id,title,description,status,priority,due_date,created_at")
      .eq("workspace_id", workspaceId)
      .lt("due_date", today)
      .not("status", "in", '("completed","done","closed")')
      .order("due_date", { ascending: true })
      .limit(20);

    tasksQuery = applyDepartmentScope(tasksQuery, accessContext);

    const { data: overdueTasks, error: tasksError } = await tasksQuery;

    if (tasksError) throw new Error(tasksError.message);

    let urgentIssuesQuery = admin
      .from("operations_urgent_issues")
      .select("id,department_id,title,description,severity,status,created_at")
      .eq("workspace_id", workspaceId)
      .not("status", "in", '("resolved","closed")')
      .order("created_at", { ascending: false })
      .limit(20);

    urgentIssuesQuery = applyDepartmentScope(urgentIssuesQuery, accessContext);

    const { data: urgentIssues, error: urgentIssuesError } = await urgentIssuesQuery;

    if (urgentIssuesError) throw new Error(urgentIssuesError.message);

    const priorityItems = [
      ...(alerts || []).map((alert) =>
        mapPriorityItem({
          id: alert.id,
          type: alert.severity === "critical" ? "critical_alert" : "high_alert",
          title: alert.title,
          description: alert.message,
          severity: alert.severity,
          status: alert.status,
          source: "management_alerts",
          createdAt: alert.created_at,
        })
      ),
      ...(decisions || []).map((decision) =>
        mapPriorityItem({
          id: decision.id,
          type: decision.priority === "urgent" ? "urgent_decision" : "high_decision",
          title: decision.title,
          description: decision.description,
          severity: decision.priority === "urgent" ? "critical" : "high",
          status: decision.status,
          source: "decision_queue",
          createdAt: decision.created_at,
        })
      ),
      ...(overdueTasks || []).map((task) =>
        mapPriorityItem({
          id: task.id,
          type: "overdue_task",
          title: task.title,
          description: task.description || `Task was due on ${task.due_date}.`,
          severity: task.priority === "urgent" || task.priority === "high" ? "high" : "medium",
          status: task.status,
          source: "tasks",
          createdAt: task.created_at,
        })
      ),
      ...(urgentIssues || []).map((issue) =>
        mapPriorityItem({
          id: issue.id,
          type: "urgent_issue",
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          status: issue.status,
          source: "urgent_issues",
          createdAt: issue.created_at,
        })
      ),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({
      accessContext,
      metrics: {
        criticalAlerts: (alerts || []).filter((alert) => alert.severity === "critical").length,
        highAlerts: (alerts || []).filter((alert) => alert.severity === "high").length,
        pendingDecisions: (decisions || []).length,
        overdueTasks: (overdueTasks || []).length,
        openUrgentIssues: (urgentIssues || []).length,
        executivePriorities: priorityItems.length,
      },
      alerts: alerts || [],
      decisions: decisions || [],
      overdueTasks: overdueTasks || [],
      urgentIssues: urgentIssues || [],
      executivePriorities: priorityItems,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
