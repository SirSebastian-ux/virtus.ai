import {
  canViewCompanyData,
  canViewDepartmentData,
  canViewTeamData,
} from "@/lib/operations/access";

export async function getOperationsAccessContext(admin, userId, workspaceId, membershipRole) {
  const { data: roleAssignment, error: roleError } = await admin
    .from("operations_role_assignments")
    .select("employee_id,role,department_id,reports_to_employee_id,scope_type,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (roleError) throw new Error(roleError.message);

  let employeeId = roleAssignment?.employee_id || null;
  let departmentId = roleAssignment?.department_id || null;

  if (!employeeId || !departmentId) {
    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id,department_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (employeeError) throw new Error(employeeError.message);

    employeeId = employeeId || employee?.id || null;
    departmentId = departmentId || employee?.department_id || null;
  }

  const role = roleAssignment?.role || membershipRole || "employee";

  return {
    role,
    employeeId,
    departmentId,
    reportsToEmployeeId: roleAssignment?.reports_to_employee_id || null,
    scopeType: roleAssignment?.scope_type || "self",
    canViewCompany: canViewCompanyData(role),
    canViewDepartment: canViewDepartmentData(role),
    canViewTeam: canViewTeamData(role),
  };
}

export function applyDepartmentScope(query, accessContext) {
  if (accessContext.canViewCompany) return query;

  if (accessContext.canViewDepartment && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (accessContext.canViewTeam && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  return query.eq("department_id", "00000000-0000-0000-0000-000000000000");
}

export function applyEmployeeScope(query, accessContext, employeeColumn = "employee_id") {
  if (accessContext.canViewCompany) return query;

  if (accessContext.canViewDepartment && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (accessContext.canViewTeam && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (accessContext.employeeId) {
    return query.eq(employeeColumn, accessContext.employeeId);
  }

  return query.eq(employeeColumn, "00000000-0000-0000-0000-000000000000");
}
export async function getTeamEmployeeIds(
  admin,
  workspaceId,
  managerEmployeeId
) {
  if (!managerEmployeeId) return [];

  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("employee_id")
    .eq("workspace_id", workspaceId)
    .eq("reports_to_employee_id", managerEmployeeId)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  return (data || []).map((item) => item.employee_id).filter(Boolean);
}

export function applyTaskScope(
  query,
  accessContext,
  teamEmployeeIds = []
) {
  if (accessContext.canViewCompany) return query;

  if (
    accessContext.canViewDepartment &&
    accessContext.departmentId
  ) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (accessContext.canViewTeam && accessContext.employeeId) {
    const allowedEmployeeIds = Array.from(
      new Set(
        [accessContext.employeeId, ...teamEmployeeIds].filter(Boolean)
      )
    );

    return query.in("assigned_employee_id", allowedEmployeeIds);
  }

  if (accessContext.employeeId) {
    return query.eq(
      "assigned_employee_id",
      accessContext.employeeId
    );
  }

  return query.eq(
    "assigned_employee_id",
    "00000000-0000-0000-0000-000000000000"
  );
}
