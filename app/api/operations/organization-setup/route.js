import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateWorkspaceMutationAllowed } from "@/lib/operations/workspace-status";
import { bootstrapWorkspace } from "@/lib/operations/bootstrap";

const DAILY_LEADER_ROLES = new Set([
  "ceo",
  "managing_director",
  "president",
  "founder",
]);

const LEADERSHIP_STRUCTURES = new Set([
  "executive_only",
  "ceo_directors",
  "director_managers",
  "custom",
]);

const DEPARTMENT_SCALES = new Set(["1-3", "4-8", "9+"]);

function cleanText(value) {
  return String(value || "").trim();
}

function cleanTextArray(value) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const result = [];

  for (const item of value) {
    const text = cleanText(item);
    const normalized = text.toLowerCase();

    if (!text || seen.has(normalized)) continue;

    seen.add(normalized);
    result.push(text);
  }

  return result;
}

function booleanOrDefault(value, defaultValue) {
  return typeof value === "boolean" ? value : defaultValue;
}

function mapProfile(profile, workspaceName, departments) {
  if (!profile) return null;

  return {
    companyName: workspaceName,
    legalName: profile.legal_name || "",
    industry: profile.industry || "",
    businessType: profile.business_type || "",
    description: profile.description || "",
    mainProducts: profile.main_products || "",
    mainServices: profile.main_services || "",
    targetClients: profile.target_clients || "",
    dailyLeaderRole: profile.daily_leader_role,
    leadershipStructure: profile.leadership_structure,
    departmentScale: profile.department_scale,
    departmentsReportDirectly: profile.departments_report_directly,
    companyStage: profile.company_stage || "",
    employeeRange: profile.employee_range || "",
    annualRevenueRange: profile.annual_revenue_range || "",
    departments,
    reportingFlow: profile.reporting_flow || "",
    headquarters: profile.headquarters || "",
    branches: profile.branches || "",
    dailyReports: profile.daily_reports,
    weeklyReports: profile.weekly_reports,
    monthlyReports: profile.monthly_reports,
    approvalRules: profile.approval_rules || "",
    kpis: profile.kpis || "",
    aiMonitoring: profile.ai_monitoring || [],
    setupStatus: profile.setup_status,
    setupCompletedAt: profile.setup_completed_at,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
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

function rpcErrorResponse(error) {
  if (error?.code === "23505") {
    return NextResponse.json(
      { error: "This company already exists." },
      { status: 409 }
    );
  }

  if (error?.code === "42501") {
    return NextResponse.json(
      { error: "Owner access required." },
      { status: 403 }
    );
  }

  if (error?.code === "P0002") {
    return NextResponse.json(
      { error: "Workspace not found." },
      { status: 404 }
    );
  }

  if (error?.details === "WORKSPACE_READ_ONLY") {
    return NextResponse.json(
      { error: error.message },
      { status: 410 }
    );
  }

  if (error?.details === "DEPARTMENT_IN_USE") {
    return NextResponse.json(
      { error: error.message },
      { status: 409 }
    );
  }

  if (["22023", "22P02", "23514"].includes(error?.code)) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: error?.message || "Unable to save company setup." },
    { status: 500 }
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
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = cleanText(searchParams.get("workspaceId"));

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

    const { data: profile, error: profileError } = await admin
      .from("workspace_organization_profiles")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    const { data: departmentRows, error: departmentsError } = await admin
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

    const departments = (departmentRows || []).map(
      (department) => department.name
    );

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        status: workspace.status,
        role: membership.role,
      },
      profile: mapProfile(profile, workspace.name, departments),
      departments: departmentRows || [],
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
    const sourceProfile = body?.profile || {};

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

    if (
      !membership ||
      (membership.role !== "owner" && workspace.owner_user_id !== user.id)
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

    const companyName = cleanText(sourceProfile.companyName);
    const dailyLeaderRole = cleanText(sourceProfile.dailyLeaderRole);
    const leadershipStructure = cleanText(
      sourceProfile.leadershipStructure
    );
    const departmentScale = cleanText(sourceProfile.departmentScale);
    const departments = cleanTextArray(sourceProfile.departments);
    const aiMonitoring = cleanTextArray(sourceProfile.aiMonitoring);

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }

    if (companyName.length > 160) {
      return NextResponse.json(
        { error: "Company name cannot exceed 160 characters." },
        { status: 400 }
      );
    }

    if (!DAILY_LEADER_ROLES.has(dailyLeaderRole)) {
      return NextResponse.json(
        { error: "Invalid daily leader role." },
        { status: 400 }
      );
    }

    if (!LEADERSHIP_STRUCTURES.has(leadershipStructure)) {
      return NextResponse.json(
        { error: "Invalid leadership structure." },
        { status: 400 }
      );
    }

    if (!DEPARTMENT_SCALES.has(departmentScale)) {
      return NextResponse.json(
        { error: "Invalid department scale." },
        { status: 400 }
      );
    }

    if (departments.length === 0) {
      return NextResponse.json(
        { error: "At least one department is required." },
        { status: 400 }
      );
    }

    if (
      departments.length > 100 ||
      departments.some((department) => department.length > 120)
    ) {
      return NextResponse.json(
        { error: "Invalid department configuration." },
        { status: 400 }
      );
    }

    if (aiMonitoring.length > 50) {
      return NextResponse.json(
        { error: "A maximum of 50 AI monitoring areas is allowed." },
        { status: 400 }
      );
    }

    const profile = {
      legalName: cleanText(sourceProfile.legalName),
      industry: cleanText(sourceProfile.industry),
      businessType: cleanText(sourceProfile.businessType),
      description: cleanText(sourceProfile.description),
      mainProducts: cleanText(sourceProfile.mainProducts),
      mainServices: cleanText(sourceProfile.mainServices),
      targetClients: cleanText(sourceProfile.targetClients),
      dailyLeaderRole,
      leadershipStructure,
      departmentScale,
      departmentsReportDirectly: booleanOrDefault(
        sourceProfile.departmentsReportDirectly,
        true
      ),
      companyStage: cleanText(sourceProfile.companyStage),
      employeeRange: cleanText(sourceProfile.employeeRange),
      annualRevenueRange: cleanText(sourceProfile.annualRevenueRange),
      reportingFlow: cleanText(sourceProfile.reportingFlow),
      headquarters: cleanText(sourceProfile.headquarters),
      branches: cleanText(sourceProfile.branches),
      dailyReports: booleanOrDefault(sourceProfile.dailyReports, true),
      weeklyReports: booleanOrDefault(sourceProfile.weeklyReports, true),
      monthlyReports: booleanOrDefault(sourceProfile.monthlyReports, false),
      approvalRules: cleanText(sourceProfile.approvalRules),
      kpis: cleanText(sourceProfile.kpis),
      aiMonitoring,
    };

    const oversizedField = Object.entries(profile).find(
      ([, value]) => typeof value === "string" && value.length > 10000
    );

    if (oversizedField) {
      return NextResponse.json(
        { error: `${oversizedField[0]} exceeds the allowed length.` },
        { status: 400 }
      );
    }

    const { data, error } = await admin.rpc(
      "complete_workspace_organization_setup",
      {
        p_workspace_id: workspaceId,
        p_actor_user_id: user.id,
        p_company_name: companyName,
        p_profile: profile,
        p_departments: departments,
      }
    );

    if (error) {
      return rpcErrorResponse(error);
    }

    const { data: ownerDepartments, error: ownerDepartmentsError } =
      await admin
        .from("departments")
        .select("id, name")
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .order("created_at", { ascending: true });

    if (ownerDepartmentsError) {
      throw new Error(ownerDepartmentsError.message);
    }

    const ownerDepartment =
      (ownerDepartments || []).find(
        (department) =>
          department.name?.trim().toLowerCase() === "executive office"
      ) ||
      (ownerDepartments || []).find(
        (department) =>
          department.name?.trim().toLowerCase() === "management"
      ) ||
      null;

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
      managementDepartmentId: ownerDepartment?.id || null,
      createOwnerEmployee: true,
    });

    return NextResponse.json({
      ok: true,
      result: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}