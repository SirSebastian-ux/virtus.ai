import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

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

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ workspaces: [] }, { status: 401 });
    }

    const { data, error } = await admin
      .from("workspace_members")
      .select(
        `
        role,
        status,
        workspace_id,
        workspaces (
          id,
          name,
          slug,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { referencedTable: "workspaces", ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      workspaces: (data || [])
        .filter((membership) => membership.workspaces)
        .map((membership) => ({
          id: membership.workspaces.id,
          name: membership.workspaces.name,
          slug: membership.workspaces.slug,
          role: membership.role,
          status: membership.status,
          createdAt: membership.workspaces.created_at,
          updatedAt: membership.workspaces.updated_at,
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
    const companyName = cleanText(body?.name || body?.companyName);

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }

    const slugBase = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);

    const slug = `${slugBase || "workspace"}-${Date.now()}`;

    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .insert({
        name: companyName,
        slug,
        status: "manual_testing",
        owner_user_id: user.id,
      })
      .select("id, name, slug, status, created_at, updated_at")
      .single();

    if (workspaceError) {
      return NextResponse.json(
        { error: workspaceError.message },
        { status: 500 }
      );
    }

    const { error: memberError } = await admin.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
      status: "active",
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    const departments = DEFAULT_DEPARTMENTS.map((departmentName) => ({
      workspace_id: workspace.id,
      name: departmentName,
      status: "active",
    }));

    const { error: departmentsError } = await admin
      .from("departments")
      .insert(departments);

    if (departmentsError) {
      return NextResponse.json(
        { error: departmentsError.message },
        { status: 500 }
      );
    }

    const { error: billingError } = await admin
      .from("workspace_billing_profiles")
      .insert({
        workspace_id: workspace.id,
        billing_mode: "manual_testing",
        billing_status: "inactive",
        plan_code: "operations_test",
        base_monthly_amount: 0,
        per_employee_amount: 0,
        included_employee_seats: 1,
        billable_employee_count: 0,
      });

    if (billingError) {
      return NextResponse.json(
        { error: billingError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        status: workspace.status,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

