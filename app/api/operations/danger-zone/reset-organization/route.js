import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { bootstrapWorkspace } from "@/lib/operations/bootstrap";

const DEFAULT_DEPARTMENTS = [
  "Management",
  "Operations",
  "Finance",
  "Sales",
  "Customer Support",
];

function cleanText(value) {
  return String(value || "").trim();
}

async function requireOwner(admin, userId, workspaceId) {
  const { data, error } = await admin
    .from("workspace_members")
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.role === "owner";
}

async function deleteWorkspaceRows(admin, tableName, workspaceId) {
  const { error } = await admin.from(tableName).delete().eq("workspace_id", workspaceId);

  if (error) throw new Error(`${tableName}: ${error.message}`);
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
    const confirmation = cleanText(body?.confirmation);

    if (!workspaceId || confirmation !== "RESET ORGANIZATION") {
      return NextResponse.json(
        { error: "workspaceId and confirmation are required." },
        { status: 400 }
      );
    }

    const isOwner = await requireOwner(admin, user.id, workspaceId);

    if (!isOwner) {
      return NextResponse.json({ error: "Owner access required." }, { status: 403 });
    }

    const operationalTables = [
      "operations_activity_logs",
      "operations_management_alerts",
      "operations_decision_queue",
      "operations_urgent_issues",
      "operations_tasks",
      "operations_daily_reports",
      "operations_reports",
      "operations_payments",
      "operations_approval_requests",
    ];

    for (const table of operationalTables) {
      await deleteWorkspaceRows(admin, table, workspaceId);
    }

    const organizationTables = [
      "operations_user_permissions",
      "operations_role_assignments",
      "operations_invitations",
      "employees",
      "departments",
    ];

    for (const table of organizationTables) {
      await deleteWorkspaceRows(admin, table, workspaceId);
    }

    const departments = DEFAULT_DEPARTMENTS.map((departmentName) => ({
      workspace_id: workspaceId,
      name: departmentName,
      status: "active",
    }));

    const { data: createdDepartments, error: departmentsError } = await admin
      .from("departments")
      .insert(departments)
      .select("id,name");

    if (departmentsError) throw new Error(departmentsError.message);

    const managementDepartment =
      (createdDepartments || []).find((department) => department.name === "Management") || null;

    await bootstrapWorkspace({
      admin,
      workspaceId,
      ownerUserId: user.id,
      ownerEmail: user.email,
      ownerName:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "Workspace Owner",
      managementDepartmentId: managementDepartment?.id || null,
    });

    return NextResponse.json({
      ok: true,
      message: "Organization has been reset and owner bootstrap has been recreated.",
      deletedTables: [...operationalTables, ...organizationTables],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
