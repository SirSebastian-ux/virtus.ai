import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

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

async function updateBillableEmployeeCount(admin, workspaceId) {
  const { count, error } = await admin
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("employment_status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const { error: billingError } = await admin
    .from("workspace_billing_profiles")
    .update({
      billable_employee_count: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);

  if (billingError) {
    throw new Error(billingError.message);
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
      return NextResponse.json({ employees: [] }, { status: 401 });
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

    const { data: employees, error } = await admin
      .from("employees")
      .select(
        `
        id,
        workspace_id,
        user_id,
        department_id,
        full_name,
        email,
        position_title,
        employment_status,
        created_at,
        updated_at,
        departments (
          id,
          name
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: departments, error: departmentsError } = await admin
      .from("departments")
      .select("id, name, status")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("name", { ascending: true });

    if (departmentsError) {
      return NextResponse.json({ error: departmentsError.message }, { status: 500 });
    }

    const { data: billingProfile } = await admin
      .from("workspace_billing_profiles")
      .select("billable_employee_count, included_employee_seats, billing_mode, billing_status")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    return NextResponse.json({
      employees: (employees || []).map((employee) => ({
        id: employee.id,
        workspaceId: employee.workspace_id,
        userId: employee.user_id,
        departmentId: employee.department_id,
        departmentName: employee.departments?.name || null,
        fullName: employee.full_name,
        email: employee.email,
        positionTitle: employee.position_title,
        employmentStatus: employee.employment_status,
        createdAt: employee.created_at,
        updatedAt: employee.updated_at,
      })),
      departments: departments || [],
      billingProfile: billingProfile || null,
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
    const fullName = cleanText(body?.fullName);
    const email = cleanText(body?.email).toLowerCase();
    const positionTitle = cleanText(body?.positionTitle);
    const departmentId = cleanText(body?.departmentId);
    const role = cleanText(body?.role || "employee");

    if (!workspaceId || !fullName) {
      return NextResponse.json(
        { error: "workspaceId and fullName are required." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
      return NextResponse.json({ error: "Manager access required." }, { status: 403 });
    }

    if (departmentId) {
      const { data: department, error: departmentError } = await admin
        .from("departments")
        .select("id")
        .eq("id", departmentId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (departmentError) {
        return NextResponse.json({ error: departmentError.message }, { status: 500 });
      }

      if (!department) {
        return NextResponse.json({ error: "Invalid department." }, { status: 400 });
      }
    }

    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .insert({
        workspace_id: workspaceId,
        department_id: departmentId || null,
        full_name: fullName,
        email: email || null,
        position_title: positionTitle || role,
        employment_status: "active",
        created_by: user.id,
      })
      .select("id, workspace_id, department_id, full_name, email, position_title, employment_status, created_at, updated_at")
      .single();

    if (employeeError) {
      return NextResponse.json({ error: employeeError.message }, { status: 500 });
    }

    const billableEmployeeCount = await updateBillableEmployeeCount(admin, workspaceId);

    await admin.from("operations_activity_logs").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "employee.created",
      entity_table: "employees",
      entity_id: employee.id,
      new_data: {
        full_name: fullName,
        email: email || null,
        position_title: positionTitle || role,
        department_id: departmentId || null,
      },
      metadata: {
        source: "operations_employees_api",
      },
    });

    return NextResponse.json({
      ok: true,
      employee: {
        id: employee.id,
        workspaceId: employee.workspace_id,
        departmentId: employee.department_id,
        fullName: employee.full_name,
        email: employee.email,
        positionTitle: employee.position_title,
        employmentStatus: employee.employment_status,
        createdAt: employee.created_at,
        updatedAt: employee.updated_at,
      },
      billableEmployeeCount,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
