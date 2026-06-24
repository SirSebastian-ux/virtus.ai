const DEFAULT_PERMISSION_PROFILES = [
  {
    name: "Owner",
    role: "owner",
    permissions: {
      "reports.view": true,
      "reports.review": true,
      "tasks.view": true,
      "tasks.manage": true,
      "urgent_issues.view": true,
      "urgent_issues.manage": true,
      "decisions.view": true,
      "decisions.manage": true,
      "employees.view": true,
      "employees.manage": true,
      "structure.view": true,
      "roles.manage": true,
      "invitations.request": true,
      "approvals.decide": true,
      "permissions.manage": true,
      "billing.view": true,
      "billing.manage": true,
    },
  },
  {
    name: "Director",
    role: "director",
    permissions: {
      "reports.view": true,
      "reports.review": true,
      "tasks.view": true,
      "tasks.manage": true,
      "urgent_issues.view": true,
      "urgent_issues.manage": true,
      "decisions.view": true,
      "decisions.manage": true,
      "employees.view": true,
      "employees.manage": true,
      "structure.view": true,
      "roles.manage": true,
      "invitations.request": true,
      "approvals.decide": true,
      "permissions.manage": false,
      "billing.view": true,
      "billing.manage": false,
    },
  },
  {
    name: "Senior Manager",
    role: "senior_manager",
    permissions: {
      "reports.view": true,
      "reports.review": true,
      "tasks.view": true,
      "tasks.manage": true,
      "urgent_issues.view": true,
      "urgent_issues.manage": true,
      "decisions.view": true,
      "decisions.manage": false,
      "employees.view": true,
      "employees.manage": true,
      "structure.view": true,
      "roles.manage": false,
      "invitations.request": true,
      "approvals.decide": true,
      "permissions.manage": false,
      "billing.view": false,
      "billing.manage": false,
    },
  },
  {
    name: "Department Manager",
    role: "department_manager",
    permissions: {
      "reports.view": true,
      "reports.review": true,
      "tasks.view": true,
      "tasks.manage": true,
      "urgent_issues.view": true,
      "urgent_issues.manage": true,
      "decisions.view": true,
      "decisions.manage": false,
      "employees.view": true,
      "employees.manage": false,
      "structure.view": true,
      "roles.manage": false,
      "invitations.request": true,
      "approvals.decide": true,
      "permissions.manage": false,
      "billing.view": false,
      "billing.manage": false,
    },
  },
  {
    name: "Supervisor",
    role: "supervisor",
    permissions: {
      "reports.view": true,
      "reports.review": true,
      "tasks.view": true,
      "tasks.manage": true,
      "urgent_issues.view": true,
      "urgent_issues.manage": false,
      "decisions.view": true,
      "decisions.manage": false,
      "employees.view": true,
      "employees.manage": false,
      "structure.view": true,
      "roles.manage": false,
      "invitations.request": true,
      "approvals.decide": false,
      "permissions.manage": false,
      "billing.view": false,
      "billing.manage": false,
    },
  },
  {
    name: "Employee",
    role: "employee",
    permissions: {
      "reports.view": true,
      "reports.review": false,
      "tasks.view": true,
      "tasks.manage": false,
      "urgent_issues.view": true,
      "urgent_issues.manage": false,
      "decisions.view": false,
      "decisions.manage": false,
      "employees.view": false,
      "employees.manage": false,
      "structure.view": false,
      "roles.manage": false,
      "invitations.request": false,
      "approvals.decide": false,
      "permissions.manage": false,
      "billing.view": false,
      "billing.manage": false,
    },
  },
];

export async function bootstrapWorkspace({
  admin,
  workspaceId,
  ownerUserId,
  ownerEmail,
  ownerName = "Workspace Owner",
  managementDepartmentId = null,
  createOwnerEmployee = false,
}) {
  let ownerEmployeeId = null;

  if (createOwnerEmployee) {
    const { data: existingEmployee, error: existingEmployeeError } = await admin
      .from("employees")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", ownerUserId)
      .maybeSingle();

    if (existingEmployeeError) {
      throw existingEmployeeError;
    }

    ownerEmployeeId = existingEmployee?.id || null;

    if (!ownerEmployeeId) {
      const { data: ownerEmployee, error: ownerEmployeeError } = await admin
        .from("employees")
        .insert({
          workspace_id: workspaceId,
          user_id: ownerUserId,
          department_id: managementDepartmentId,
          full_name: ownerName,
          email: ownerEmail,
          position_title: "Owner",
          employment_status: "active",
          created_by: ownerUserId,
        })
        .select("id")
        .single();

      if (ownerEmployeeError) {
        throw ownerEmployeeError;
      }

      ownerEmployeeId = ownerEmployee.id;
    }
  }

  const { data: existingRoleAssignment, error: existingRoleError } = await admin
    .from("operations_role_assignments")
    .select("id, employee_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", ownerUserId)
    .eq("role", "owner")
    .eq("status", "active")
    .maybeSingle();

  if (existingRoleError) {
    throw existingRoleError;
  }

  if (!existingRoleAssignment) {
    const { error: roleError } = await admin
      .from("operations_role_assignments")
      .insert({
        workspace_id: workspaceId,
        user_id: ownerUserId,
        employee_id: ownerEmployeeId,
        role: "owner",
        department_id: managementDepartmentId,
        scope_type: "company",
        status: "active",
        created_by: ownerUserId,
        approved_by: ownerUserId,
        approved_at: new Date().toISOString(),
      });

    if (roleError) {
      throw roleError;
    }
  } else {
    ownerEmployeeId = existingRoleAssignment.employee_id || ownerEmployeeId;
  }

  const profiles = DEFAULT_PERMISSION_PROFILES.map((profile) => ({
    workspace_id: workspaceId,
    name: profile.name,
    role: profile.role,
    permissions: profile.permissions,
    is_default: true,
    created_by: ownerUserId,
  }));

  const { error: profilesError } = await admin
    .from("operations_permission_profiles")
    .upsert(profiles, {
      onConflict: "workspace_id,name",
      ignoreDuplicates: true,
    });

  if (profilesError) {
    throw profilesError;
  }

  return {
    ownerEmployeeId,
    permissionProfilesCreated: profiles.length,
  };
}
