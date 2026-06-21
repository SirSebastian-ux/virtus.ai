import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  canViewCompanyData,
  canViewDepartmentData,
  canViewTeamData,
} from "@/lib/operations/access";

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

  if (error) {
    throw new Error(error.message);
  }

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

  if (error) {
    throw new Error(error.message);
  }

  const role = data?.role || membershipRole || "employee";

  return {
    role,
    employeeId: data?.employee_id || null,
    departmentId: data?.department_id || null,
    reportsToEmployeeId: data?.reports_to_employee_id || null,
    scopeType: data?.scope_type || "self",
  };
}

async function getTeamEmployeeIds(admin, workspaceId, managerEmployeeId) {
  if (!managerEmployeeId) return [];

  const { data, error } = await admin
    .from("operations_role_assignments")
    .select("employee_id")
    .eq("workspace_id", workspaceId)
    .eq("reports_to_employee_id", managerEmployeeId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item) => item.employee_id).filter(Boolean);
}

function applyPaymentAccessFilter(query, accessContext, teamEmployeeIds = []) {
  if (canViewCompanyData(accessContext.role)) {
    return query;
  }

  if (canViewDepartmentData(accessContext.role) && accessContext.departmentId) {
    return query.eq("department_id", accessContext.departmentId);
  }

  if (canViewTeamData(accessContext.role) && accessContext.employeeId) {
    return query.in(
      "employee_id",
      [accessContext.employeeId, ...teamEmployeeIds]
    );
  }

  if (accessContext.employeeId) {
    return query.eq("employee_id", accessContext.employeeId);
  }

  return query.eq(
    "employee_id",
    "00000000-0000-0000-0000-000000000000"
  );
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
      return NextResponse.json({ payments: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = cleanText(searchParams.get("workspaceId"));

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(
      admin,
      user.id,
      workspaceId
    );

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

    const teamEmployeeIds = await getTeamEmployeeIds(
      admin,
      workspaceId,
      accessContext.employeeId
    );

    let query = admin
      .from("operations_payments")
      .select(
        `
        id,
        workspace_id,
        department_id,
        employee_id,
        amount,
        currency,
        payment_method,
        payer_name,
        reference,
        status,
        source_report_id,
        created_by,
        confirmed_by,
        confirmed_at,
        created_at,
        updated_at,
        employees (
          id,
          full_name,
          email
        ),
        departments (
          id,
          name
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    query = applyPaymentAccessFilter(
      query,
      accessContext,
      teamEmployeeIds
    );

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accessContext,
      payments: (data || []).map((payment) => ({
        id: payment.id,
        workspaceId: payment.workspace_id,
        departmentId: payment.department_id,
        departmentName: payment.departments?.name || null,
        employeeId: payment.employee_id,
        employeeName: payment.employees?.full_name || null,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.payment_method,
        payerName: payment.payer_name,
        reference: payment.reference,
        status: payment.status,
        sourceReportId: payment.source_report_id,
        createdBy: payment.created_by,
        confirmedBy: payment.confirmed_by,
        confirmedAt: payment.confirmed_at,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}





