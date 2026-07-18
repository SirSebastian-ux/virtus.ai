import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";

const POSITION_TYPES = new Set([
  "executive",
  "director",
  "manager",
  "supervisor",
  "individual_contributor",
  "custom",
]);

function cleanText(value) {
  return String(value || "").trim();
}

function accessRoleForPosition(positionType, departmentId) {
  if (positionType === "executive" || positionType === "director") {
    return "director";
  }

  if (positionType === "manager") {
    return departmentId ? "department_manager" : "senior_manager";
  }

  if (positionType === "supervisor") {
    return "supervisor";
  }

  if (positionType === "individual_contributor") {
    return "employee";
  }

  return null;
}

function mapPosition(position) {
  const employee = position.employees || null;
  const department = position.departments || null;

  return {
    id: position.id,
    workspaceId: position.workspace_id,
    departmentId: position.department_id,
    departmentName: department?.name || null,
    reportsToPositionId: position.reports_to_position_id,
    assignedEmployeeId: position.assigned_employee_id,
    assignedEmployee: employee
      ? {
          id: employee.id,
          fullName: employee.full_name,
          email: employee.email,
          positionTitle: employee.position_title,
          employmentStatus: employee.employment_status,
        }
      : null,
    title: position.title,
    systemKey: position.system_key,
    positionType: position.position_type,
    accessRole: position.access_role,
    isLeadership: position.is_leadership,
    status: position.status,
    sortOrder: position.sort_order,
    assignmentStatus: employee ? "assigned" : "not_assigned",
    createdAt: position.created_at,
    updatedAt: position.updated_at,
  };
}

async function getWorkspaceContext(admin, userId, workspaceId) {
  const { data: membership, error: membershipError } = await admin
    .from("workspace_members")
    .select("role, status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select("id, name, owner_user_id, status")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  return { membership, workspace };
}

function canManageOrganization(membership, workspace, userId) {
  return Boolean(
    membership &&
      workspace &&
      (membership.role === "owner" || workspace.owner_user_id === userId)
  );
}

async function getActiveEmployee(admin, workspaceId, employeeId) {
  if (!employeeId) return null;

  const { data, error } = await admin
    .from("employees")
    .select("id, full_name, email, employment_status")
    .eq("id", employeeId)
    .eq("workspace_id", workspaceId)
    .eq("employment_status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getActiveDepartment(admin, workspaceId, departmentId) {
  if (!departmentId) return null;

  const { data, error } = await admin
    .from("departments")
    .select("id, name, status")
    .eq("id", departmentId)
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getActiveParentPosition(admin, workspaceId, positionId) {
  if (!positionId) return null;

  const { data, error } = await admin
    .from("organization_positions")
    .select("id, title, status")
    .eq("id", positionId)
    .eq("workspace_id", workspaceId)
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
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = cleanText(searchParams.get("workspaceId"));
    const leadershipOnly = searchParams.get("leadershipOnly") !== "false";

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    const { membership, workspace } = await getWorkspaceContext(
      admin,
      user.id,
      workspaceId
    );

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 404 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    let positionsQuery = admin
      .from("organization_positions")
      .select(
        `
        id,
        workspace_id,
        department_id,
        reports_to_position_id,
        assigned_employee_id,
        title,
        system_key,
        position_type,
        access_role,
        is_leadership,
        status,
        sort_order,
        created_at,
        updated_at,
        departments (
          id,
          name
        ),
        employees (
          id,
          full_name,
          email,
          position_title,
          employment_status
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });

    if (leadershipOnly) {
      positionsQuery = positionsQuery.eq("is_leadership", true);
    }

    const { data: positions, error: positionsError } = await positionsQuery;

    if (positionsError) {
      return NextResponse.json(
        { error: positionsError.message },
        { status: 500 }
      );
    }

    const { data: employees, error: employeesError } = await admin
      .from("employees")
      .select("id, full_name, email, position_title, employment_status")
      .eq("workspace_id", workspaceId)
      .eq("employment_status", "active")
      .order("full_name", { ascending: true });

    if (employeesError) {
      return NextResponse.json(
        { error: employeesError.message },
        { status: 500 }
      );
    }

    const { data: departments, error: departmentsError } = await admin
      .from("departments")
      .select("id, name, status")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("name", { ascending: true });

    if (departmentsError) {
      return NextResponse.json(
        { error: departmentsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        status: workspace.status,
        role: membership.role,
      },
      canManage: canManageOrganization(
        membership,
        workspace,
        user.id
      ),
      positions: (positions || []).map(mapPosition),
      employees: employees || [],
      departments: departments || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const workspaceId = cleanText(body?.workspaceId);
    const title = cleanText(body?.title);
    const positionType = cleanText(body?.positionType || "director");
    const departmentId = cleanText(body?.departmentId) || null;
    const reportsToPositionId =
      cleanText(body?.reportsToPositionId) || null;
    const assignedEmployeeId =
      cleanText(body?.assignedEmployeeId) || null;

    if (!workspaceId || !title) {
      return NextResponse.json(
        { error: "workspaceId and title are required." },
        { status: 400 }
      );
    }

    if (title.length > 160) {
      return NextResponse.json(
        { error: "Position title cannot exceed 160 characters." },
        { status: 400 }
      );
    }

    if (!POSITION_TYPES.has(positionType)) {
      return NextResponse.json(
        { error: "Invalid position type." },
        { status: 400 }
      );
    }

    const { membership, workspace } = await getWorkspaceContext(
      admin,
      user.id,
      workspaceId
    );

    if (
      !canManageOrganization(
        membership,
        workspace,
        user.id
      )
    ) {
      return NextResponse.json(
        { error: "Owner access required." },
        { status: 403 }
      );
    }

    const workspaceValidation = await validateWorkspaceMutationAllowed(
      admin,
      workspaceId
    );

    if (!workspaceValidation.allowed) {
      return NextResponse.json(
        { error: workspaceValidation.message },
        { status: workspaceValidation.status }
      );
    }

    if (departmentId) {
      const department = await getActiveDepartment(
        admin,
        workspaceId,
        departmentId
      );

      if (!department) {
        return NextResponse.json(
          { error: "Invalid department." },
          { status: 400 }
        );
      }
    }

    if (reportsToPositionId) {
      const parentPosition = await getActiveParentPosition(
        admin,
        workspaceId,
        reportsToPositionId
      );

      if (!parentPosition) {
        return NextResponse.json(
          { error: "Invalid reporting position." },
          { status: 400 }
        );
      }
    }

    if (assignedEmployeeId) {
      const employee = await getActiveEmployee(
        admin,
        workspaceId,
        assignedEmployeeId
      );

      if (!employee) {
        return NextResponse.json(
          { error: "Invalid active employee." },
          { status: 400 }
        );
      }
    }

    let duplicateQuery = admin
      .from("organization_positions")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .ilike("title", title);

    duplicateQuery = departmentId
      ? duplicateQuery.eq("department_id", departmentId)
      : duplicateQuery.is("department_id", null);

    const { data: duplicatePosition, error: duplicateError } =
      await duplicateQuery.limit(1).maybeSingle();

    if (duplicateError) {
      return NextResponse.json(
        { error: duplicateError.message },
        { status: 500 }
      );
    }

    if (duplicatePosition) {
      return NextResponse.json(
        { error: "This active position already exists." },
        { status: 409 }
      );
    }

    const { data: lastPosition, error: orderError } = await admin
      .from("organization_positions")
      .select("sort_order")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    const sortOrder = (lastPosition?.sort_order || 0) + 10;

    const { data: position, error: positionError } = await admin
      .from("organization_positions")
      .insert({
        workspace_id: workspaceId,
        department_id: departmentId,
        reports_to_position_id: reportsToPositionId,
        assigned_employee_id: assignedEmployeeId,
        title,
        position_type: positionType,
        access_role: accessRoleForPosition(
          positionType,
          departmentId
        ),
        is_leadership: true,
        status: "active",
        sort_order: sortOrder,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id, title")
      .single();

    if (positionError) {
      return NextResponse.json(
        { error: positionError.message },
        { status: 500 }
      );
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "organization_position.created",
      entity_table: "organization_positions",
      entity_id: position.id,
      new_data: {
        title,
        position_type: positionType,
        department_id: departmentId,
        reports_to_position_id: reportsToPositionId,
        assigned_employee_id: assignedEmployeeId,
      },
      metadata: {
        source: "operations_organization_positions_api",
      },
    });

    return NextResponse.json({
      ok: true,
      positionId: position.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const workspaceId = cleanText(body?.workspaceId);
    const positionId = cleanText(body?.positionId);
    const action = cleanText(body?.action);

    if (!workspaceId || !positionId || !action) {
      return NextResponse.json(
        { error: "workspaceId, positionId and action are required." },
        { status: 400 }
      );
    }

    const { membership, workspace } = await getWorkspaceContext(
      admin,
      user.id,
      workspaceId
    );

    if (
      !canManageOrganization(
        membership,
        workspace,
        user.id
      )
    ) {
      return NextResponse.json(
        { error: "Owner access required." },
        { status: 403 }
      );
    }

    const workspaceValidation = await validateWorkspaceMutationAllowed(
      admin,
      workspaceId
    );

    if (!workspaceValidation.allowed) {
      return NextResponse.json(
        { error: workspaceValidation.message },
        { status: workspaceValidation.status }
      );
    }

    const { data: currentPosition, error: currentPositionError } =
      await admin
        .from("organization_positions")
        .select(
          "id, title, system_key, assigned_employee_id, status"
        )
        .eq("id", positionId)
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .maybeSingle();

    if (currentPositionError) {
      return NextResponse.json(
        { error: currentPositionError.message },
        { status: 500 }
      );
    }

    if (!currentPosition) {
      return NextResponse.json(
        { error: "Active position not found." },
        { status: 404 }
      );
    }

    let updates;
    let activityAction;

    if (action === "assign") {
      const employeeId = cleanText(body?.employeeId);
      const employee = await getActiveEmployee(
        admin,
        workspaceId,
        employeeId
      );

      if (!employee) {
        return NextResponse.json(
          { error: "Invalid active employee." },
          { status: 400 }
        );
      }

      updates = {
        assigned_employee_id: employee.id,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };
      activityAction = "organization_position.assigned";
    } else if (action === "unassign") {
      updates = {
        assigned_employee_id: null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };
      activityAction = "organization_position.unassigned";
    } else if (action === "archive") {
      if (currentPosition.system_key) {
        return NextResponse.json(
          {
            error:
              "System-managed positions must be changed through Company Profile.",
          },
          { status: 409 }
        );
      }

      if (currentPosition.assigned_employee_id) {
        return NextResponse.json(
          {
            error:
              "Unassign the employee before archiving this position.",
          },
          { status: 409 }
        );
      }

      updates = {
        status: "archived",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };
      activityAction = "organization_position.archived";
    } else {
      return NextResponse.json(
        { error: "Invalid position action." },
        { status: 400 }
      );
    }

    const { data: updatedPosition, error: updateError } = await admin
      .from("organization_positions")
      .update(updates)
      .eq("id", positionId)
      .eq("workspace_id", workspaceId)
      .select("id, assigned_employee_id, status")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: activityAction,
      entity_table: "organization_positions",
      entity_id: positionId,
      previous_data: {
        assigned_employee_id: currentPosition.assigned_employee_id,
        status: currentPosition.status,
      },
      new_data: {
        assigned_employee_id: updatedPosition.assigned_employee_id,
        status: updatedPosition.status,
      },
      metadata: {
        source: "operations_organization_positions_api",
      },
    });

    return NextResponse.json({
      ok: true,
      positionId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}