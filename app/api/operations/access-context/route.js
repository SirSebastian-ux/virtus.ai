import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  canApproveRequests,
  canManageDepartments,
  canManageEmployees,
  canManagePermissions,
  canViewCompanyData,
  canViewDepartmentData,
  canViewTeamData,
} from "@/lib/operations/access";
import { normalizePermissions } from "@/lib/operations/permissions";

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeRoleAssignment(item) {
  return {
    id: item.id,
    workspaceId: item.workspace_id,
    userId: item.user_id,
    employeeId: item.employee_id,
    role: item.role,
    departmentId: item.department_id,
    reportsToEmployeeId: item.reports_to_employee_id,
    scopeType: item.scope_type,
    status: item.status,
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
      return NextResponse.json({ accessContext: null }, { status: 401 });
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
      .select(
        "id, workspace_id, user_id, employee_id, role, department_id, reports_to_employee_id, scope_type, status"
      )
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    const role = roleAssignment?.role || membership.role || "employee";
    const scopeType = roleAssignment?.scope_type || "self";
    const departmentId = roleAssignment?.department_id || null;
    const employeeId = roleAssignment?.employee_id || null;

    const { data: defaultProfile, error: profileError } = await admin
      .from("operations_permission_profiles")
      .select("permissions")
      .eq("workspace_id", workspaceId)
      .eq("role", role)
      .eq("is_default", true)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { data: overrides, error: overridesError } = await admin
      .from("operations_user_permissions")
      .select("permission_key, permission_value")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id);

    if (overridesError) {
      return NextResponse.json({ error: overridesError.message }, { status: 500 });
    }

    const permissions = normalizePermissions(defaultProfile?.permissions);

    (overrides || []).forEach((item) => {
      permissions[item.permission_key] = Boolean(item.permission_value);
    });

    const accessContext = {
      workspaceId,
      userId: user.id,
      role,
      scopeType,
      departmentId,
      employeeId,
      roleAssignment: roleAssignment ? normalizeRoleAssignment(roleAssignment) : null,
      capabilities: {
        canApproveRequests: canApproveRequests(role),
        canManageDepartments: canManageDepartments(role),
        canManageEmployees: canManageEmployees(role),
        canManagePermissions: canManagePermissions(role),
        canViewCompanyData: canViewCompanyData(role),
        canViewDepartmentData: canViewDepartmentData(role),
        canViewTeamData: canViewTeamData(role),
      },
    };

    return NextResponse.json({ accessContext });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



