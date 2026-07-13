import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { ROLE_LEVELS } from "@/lib/operations/access";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";

const ALLOWED_ROLES = new Set([
  "owner",
  "director",
  "senior_manager",
  "department_manager",
  "supervisor",
  "employee",
]);

const ALLOWED_SCOPE_TYPES = new Set(["company", "department", "team", "self"]);

// Role hierarchy: defines which roles can assign which roles
// Owner role assignments must go through dedicated ownership workflow
const ROLE_ASSIGNMENT_PERMISSIONS = {
  owner: new Set(["director", "senior_manager", "department_manager", "supervisor", "employee"]),
  director: new Set(["department_manager", "supervisor", "employee"]),
  senior_manager: new Set(["department_manager", "supervisor", "employee"]),
  department_manager: new Set(["supervisor", "employee"]),
  supervisor: new Set([]),
  employee: new Set([]),
};

// Role and scope_type compatibility: which scope_types are valid for each role
const ROLE_SCOPE_COMPATIBILITY = {
  owner: new Set(["company"]),
  director: new Set(["company", "department"]),
  senior_manager: new Set(["company", "department"]),
  department_manager: new Set(["department"]),
  supervisor: new Set(["team", "department"]),
  employee: new Set(["self"]),
};

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

async function validateDepartment(admin, workspaceId, departmentId) {
  if (!departmentId) return true;

  const { data, error } = await admin
    .from("departments")
    .select("id")
    .eq("id", departmentId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function validateEmployee(admin, workspaceId, employeeId) {
  if (!employeeId) return true;

  const { data, error } = await admin
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function resolveTargetUserId(admin, workspaceId, userId, employeeId) {
  // Determine target user_id from either direct userId or employee record
  let targetUserId = userId || null;
  let employeeUserId = null;

  if (employeeId) {
    const { data: employee, error } = await admin
      .from("employees")
      .select("user_id")
      .eq("id", employeeId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    employeeUserId = employee?.user_id || null;
  }

  // Detect conflict: both userId and employeeId supplied with different values
  if (userId && employeeUserId && userId !== employeeUserId) {
    return {
      valid: false,
      targetUserId: null,
      error: "userId and employeeId refer to different users. Provide only one.",
    };
  }

  // Use employee's user_id if not explicitly provided
  targetUserId = targetUserId || employeeUserId;

  return {
    valid: true,
    targetUserId,
    error: null,
  };
}

async function getRequestingUserOperationalRole(admin, userId, workspaceId) {
  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  // Load all active roles and find the highest level
  const roles = Array.isArray(data) ? data : [];
  
  let highestRole = null;
  let highestLevel = -1;

  for (const assignment of roles) {
    const role = assignment.role;
    const roleLevel = ROLE_LEVELS[role];

    // Ignore unknown or legacy roles
    if (roleLevel === undefined) {
      continue;
    }

    if (roleLevel > highestLevel) {
      highestLevel = roleLevel;
      highestRole = role;
    }
  }

  return highestRole;
}

function validateRoleHierarchy(requestingUserRole, targetRole, targetUserId, requestingUserId) {
  // Check if attempting to assign owner role through regular API
  if (targetRole === "owner") {
    return {
      valid: false,
      error: "Owner role assignments must be managed through dedicated ownership workflow.",
    };
  }

  // Check if requesting user has permission to assign target role
  if (!ROLE_ASSIGNMENT_PERMISSIONS[requestingUserRole]?.has(targetRole)) {
    return {
      valid: false,
      error: `Your role (${requestingUserRole}) cannot assign ${targetRole} role.`,
    };
  }

  // Prevent self-elevation: a user cannot assign themselves a role equal to or higher than current
  if (targetUserId && targetUserId === requestingUserId) {
    const requestingUserRoleLevel = ROLE_LEVELS[requestingUserRole] || 0;
    const targetRoleLevel = ROLE_LEVELS[targetRole] || 0;

    if (targetRoleLevel >= requestingUserRoleLevel) {
      return {
        valid: false,
        error: "You cannot assign yourself a role equal to or higher than your own.",
      };
    }
  }

  return { valid: true };
}

function validateRoleScopeCompatibility(role, scopeType) {
  if (!ROLE_SCOPE_COMPATIBILITY[role]?.has(scopeType)) {
    return {
      valid: false,
      error: `Role ${role} cannot have scope_type ${scopeType}. Valid scope types: ${Array.from(
        ROLE_SCOPE_COMPATIBILITY[role] || []
      ).join(", ")}.`,
    };
  }

  return { valid: true };
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
      return NextResponse.json({ roleAssignments: [] }, { status: 401 });
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
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const { data, error } = await admin
      .from("operations_role_assignments")
      .select(
        `
        id,
        workspace_id,
        user_id,
        employee_id,
        role,
        department_id,
        reports_to_employee_id,
        scope_type,
        status,
        created_by,
        approved_by,
        approved_at,
        created_at,
        updated_at,
        employees:employee_id (
          id,
          full_name,
          email,
          position_title
        ),
        departments:department_id (
          id,
          name
        ),
        manager:reports_to_employee_id (
          id,
          full_name,
          email,
          position_title
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      roleAssignments: (data || []).map((item) => ({
        id: item.id,
        workspaceId: item.workspace_id,
        userId: item.user_id,
        employeeId: item.employee_id,
        employeeName: item.employees?.full_name || null,
        employeeEmail: item.employees?.email || null,
        employeePositionTitle: item.employees?.position_title || null,
        role: item.role,
        departmentId: item.department_id,
        departmentName: item.departments?.name || null,
        reportsToEmployeeId: item.reports_to_employee_id,
        reportsToEmployeeName: item.manager?.full_name || null,
        scopeType: item.scope_type,
        status: item.status,
        createdBy: item.created_by,
        approvedBy: item.approved_by,
        approvedAt: item.approved_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
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
    const userId = cleanText(body?.userId);
    const employeeId = cleanText(body?.employeeId);
    const role = cleanText(body?.role || "employee");
    const departmentId = cleanText(body?.departmentId);
    const reportsToEmployeeId = cleanText(body?.reportsToEmployeeId);
    const scopeType = cleanText(body?.scopeType || "self");
    const status = cleanText(body?.status || "active");

    if (!workspaceId || !role || !scopeType) {
      return NextResponse.json(
        { error: "workspaceId, role, and scopeType are required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (!ALLOWED_SCOPE_TYPES.has(scopeType)) {
      return NextResponse.json({ error: "Invalid scopeType." }, { status: 400 });
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
      return NextResponse.json({ error: "Manager access required." }, { status: 403 });
    }

    const wsValidation = await validateWorkspaceMutationAllowed(admin, workspaceId);
    if (!wsValidation.allowed) {
      return NextResponse.json(
        { error: wsValidation.message },
        { status: wsValidation.status }
      );
    }

    // Resolve target user_id from either userId or employeeId
    const userResolution = await resolveTargetUserId(admin, workspaceId, userId, employeeId);

    if (!userResolution.valid) {
      return NextResponse.json({ error: userResolution.error }, { status: 400 });
    }

    const targetUserId = userResolution.targetUserId;

    // Get the requesting user's operational role
    const requestingUserOperationalRole = await getRequestingUserOperationalRole(
      admin,
      user.id,
      workspaceId
    );

    // Only operational roles (owner, director, senior_manager, department_manager) can assign roles
    // Supervisors and employees cannot
    if (
      !requestingUserOperationalRole ||
      !ROLE_ASSIGNMENT_PERMISSIONS[requestingUserOperationalRole]
    ) {
      return NextResponse.json(
        { error: "Your role does not have permission to assign roles." },
        { status: 403 }
      );
    }

    // Validate role hierarchy: check if requesting user can assign target role
    const hierarchyValidation = validateRoleHierarchy(
      requestingUserOperationalRole,
      role,
      targetUserId, // The target user who will get the role assignment
      user.id // The current user's ID
    );

    if (!hierarchyValidation.valid) {
      return NextResponse.json({ error: hierarchyValidation.error }, { status: 403 });
    }

    // Validate role/scope type compatibility
    const scopeCompatibilityValidation = validateRoleScopeCompatibility(role, scopeType);

    if (!scopeCompatibilityValidation.valid) {
      return NextResponse.json(
        { error: scopeCompatibilityValidation.error },
        { status: 400 }
      );
    }

    const validEmployee = await validateEmployee(admin, workspaceId, employeeId);

    if (!validEmployee) {
      return NextResponse.json({ error: "Invalid employee." }, { status: 400 });
    }

    const validManager = await validateEmployee(admin, workspaceId, reportsToEmployeeId);

    if (!validManager) {
      return NextResponse.json({ error: "Invalid reporting manager." }, { status: 400 });
    }

    const validDepartment = await validateDepartment(admin, workspaceId, departmentId);

    if (!validDepartment) {
      return NextResponse.json({ error: "Invalid department." }, { status: 400 });
    }

    const { data: roleAssignment, error } = await admin
      .from("operations_role_assignments")
      .insert({
        workspace_id: workspaceId,
        user_id: userId || null,
        employee_id: employeeId || null,
        role,
        department_id: departmentId || null,
        reports_to_employee_id: reportsToEmployeeId || null,
        scope_type: scopeType,
        status,
        created_by: user.id,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .select(
        "id, workspace_id, user_id, employee_id, role, department_id, reports_to_employee_id, scope_type, status, created_at, updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "role_assignment.created",
      entity_table: "operations_role_assignments",
      entity_id: roleAssignment.id,
      new_data: roleAssignment,
      metadata: {
        source: "operations_role_assignments_api",
      },
    });

    return NextResponse.json({
      ok: true,
      roleAssignment: {
        id: roleAssignment.id,
        workspaceId: roleAssignment.workspace_id,
        userId: roleAssignment.user_id,
        employeeId: roleAssignment.employee_id,
        role: roleAssignment.role,
        departmentId: roleAssignment.department_id,
        reportsToEmployeeId: roleAssignment.reports_to_employee_id,
        scopeType: roleAssignment.scope_type,
        status: roleAssignment.status,
        createdAt: roleAssignment.created_at,
        updatedAt: roleAssignment.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
