"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getIndustryTemplate, industryTemplateNames } from "@/lib/operations/industry-templates";

const emptyMetrics = {
  activeEmployees: 0,
  openTasks: 0,
  openUrgentIssues: 0,
  pendingDecisions: 0,
  pendingPayments: 0,
};

const wizardSteps = [
  "Company Identity",
  "Leadership Structure",
  "Company Size",
  "Departments",
  "Reporting Structure",
  "Locations",
  "Operations Rules",
  "KPIs",
  "AI Monitoring",
  "Final Review",
];

const businessTypes = [
  "Service",
  "Product",
  "Product + Service",
  "Consulting",
  "Technology",
  "Retail",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Other",
];

const employeeRanges = [
  "1-5",
  "6-20",
  "21-50",
  "51-100",
  "101-250",
  "251-500",
  "500+",
];

const defaultDepartments = [
  "Operations",
  "Sales",
  "Marketing",
  "Finance",
  "Human Resources",
  "Customer Support",
  "IT",
];

const aiAreas = [
  "Tasks",
  "Payments",
  "Risks",
  "Employee Performance",
  "Attendance",
  "Sales",
  "Customer Complaints",
  "Approvals",
  "Projects",
];

export default function OperationsCompanyPage() {
  const router = useRouter();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [setupStep, setSetupStep] = useState(1);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [isSavingSetup, setIsSavingSetup] = useState(false);

  const [companyProfile, setCompanyProfile] = useState({
    companyName: "",
    legalName: "",
    industry: "",
    businessType: "",
    description: "",
    mainProducts: "",
    mainServices: "",
    targetClients: "",
    dailyLeaderRole: "ceo",
    leadershipStructure: "ceo_directors",
    departmentScale: "1-3",
    departmentsReportDirectly: true,
    companyStage: "",
    employeeRange: "",
    annualRevenueRange: "",
    departments: defaultDepartments,
    reportingFlow: "Owner -> Directors -> Managers -> Supervisors -> Employees",
    headquarters: "",
    branches: "",
    dailyReports: true,
    weeklyReports: true,
    monthlyReports: false,
    approvalRules: "",
    kpis: "",
    aiMonitoring: ["Tasks", "Risks", "Approvals"],
  });

  function applyIndustryTemplate(industry) {
    const template = getIndustryTemplate(industry);

    setCompanyProfile((current) => ({
      ...current,
      industry,
      departments: template.departments,
      reportingFlow: template.hierarchy,
      kpis: template.kpis,
      approvalRules: template.reportingRules,
      aiMonitoring: template.aiMonitoring,
    }));
  }
  function updateProfile(field, value) {
    setCompanyProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleArrayValue(field, value) {
    setCompanyProfile((current) => {
      const list = current[field];
      return {
        ...current,
        [field]: list.includes(value)
          ? list.filter((item) => item !== value)
          : [...list, value],
      };
    });
  }

  function addDepartment() {
    const departmentName = newDepartmentName.trim();

    if (!departmentName) return;

    setCompanyProfile((current) => ({
      ...current,
      departments: current.departments.includes(departmentName)
        ? current.departments
        : [...current.departments, departmentName],
    }));

    setNewDepartmentName("");
  }

  function removeDepartment(departmentName) {
    setCompanyProfile((current) => ({
      ...current,
      departments: current.departments.filter((item) => item !== departmentName),
    }));
  }

  async function completeCompanySetup() {
    if (!activeWorkspaceId) {
      setError("Choose an active company before completing setup.");
      return;
    }

    try {
      setIsSavingSetup(true);
      setError("");

      const response = await fetch("/api/operations/organization-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          profile: companyProfile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to complete company setup.");
      }

      const savedCompanyName = companyProfile.companyName.trim();

      localStorage.setItem("virtus_active_workspace_name", savedCompanyName);
      setActiveWorkspaceName(savedCompanyName);
      window.dispatchEvent(new Event("virtus-active-workspace-changed"));
      router.push("/operations/organization");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSavingSetup(false);
    }
  }

  useEffect(() => {
    function handleWorkspaceChange() {
      setRefreshKey((current) => current + 1);
    }

    window.addEventListener("virtus-active-workspace-changed", handleWorkspaceChange);
    window.addEventListener("storage", handleWorkspaceChange);

    return () => {
      window.removeEventListener("virtus-active-workspace-changed", handleWorkspaceChange);
      window.removeEventListener("storage", handleWorkspaceChange);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadCompanyOverview() {
      try {
        setIsLoading(true);

        const selectedWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_id") || ""
            : "";

        const selectedWorkspaceName =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_name") || ""
            : "";

        if (alive) {
          setActiveWorkspaceId(selectedWorkspaceId);
          setActiveWorkspaceName(selectedWorkspaceName);
          updateProfile("companyName", selectedWorkspaceName);
        }

        const workspacesResponse = await fetch("/api/operations/workspaces", {
          cache: "no-store",
        });

        const workspacesData = await workspacesResponse.json();

        if (!workspacesResponse.ok) {
          throw new Error(workspacesData?.error || "Unable to load company workspaces.");
        }

        const nextWorkspaces = Array.isArray(workspacesData.workspaces)
          ? workspacesData.workspaces
          : [];

        if (alive) {
          setWorkspaces(nextWorkspaces);
        }

        const workspaceId = selectedWorkspaceId || "";

        if (!workspaceId) return;

        const setupResponse = await fetch(
          `/api/operations/organization-setup?workspaceId=${encodeURIComponent(workspaceId)}`,
          { cache: "no-store" }
        );

        const setupData = await setupResponse.json();

        if (!setupResponse.ok) {
          throw new Error(
            setupData?.error || "Unable to load company setup."
          );
        }

        if (alive && setupData.profile) {
          setCompanyProfile((current) => ({
            ...current,
            ...setupData.profile,
          }));
        }

        const metricsResponse = await fetch(
          `/api/operations/metrics?workspaceId=${encodeURIComponent(workspaceId)}`,
          { cache: "no-store" }
        );

        const metricsData = await metricsResponse.json();

        if (!metricsResponse.ok) {
          throw new Error(metricsData?.error || "Unable to load company metrics.");
        }

        const selectedWorkspace = nextWorkspaces.find(
          (workspace) => workspace.id === workspaceId
        );

        if (alive) {
          setActiveWorkspaceId(workspaceId);
          setActiveWorkspaceName(selectedWorkspace?.name || selectedWorkspaceName || workspaceId);
          setMetrics({ ...emptyMetrics, ...(metricsData.metrics || {}) });
        }
      } catch (loadError) {
        if (alive) {
          setError(loadError.message);
        }
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    }

    loadCompanyOverview();

    return () => {
      alive = false;
    };
  }, [refreshKey]);

  return (
    <section className="px-6 py-8">
      <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
          Company Workspace
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-white">
          Company Setup
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Build the company foundation before employees, departments, reporting,
          approvals, permissions, and AI intelligence are fully activated.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-300/60">
            Company Foundation Wizard
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            Step {setupStep} of {wizardSteps.length}: {wizardSteps[setupStep - 1]}
          </h2>

          <div className="mt-5 grid gap-2 md:grid-cols-5">
            {wizardSteps.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => setSetupStep(index + 1)}
                className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                  setupStep === index + 1
                    ? "border-sky-500 bg-sky-500/15 text-sky-100"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-sky-800"
                }`}
              >
                {index + 1}. {step}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-6">
          {setupStep === 1 ? (
            <div>
              <h2 className="text-xl font-semibold text-white">Company Identity</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input value={companyProfile.companyName} onChange={(event) => updateProfile("companyName", event.target.value)} placeholder="Company Name" className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
                <input value={companyProfile.legalName} onChange={(event) => updateProfile("legalName", event.target.value)} placeholder="Legal Company Name" className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
                <select
                  value={companyProfile.industry}
                  onChange={(event) => applyIndustryTemplate(event.target.value)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white"
                >
                  <option value="">Choose Industry Template</option>
                  {industryTemplateNames.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                <select value={companyProfile.businessType} onChange={(event) => updateProfile("businessType", event.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white">
                  <option value="">Business Type</option>
                  {businessTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <textarea value={companyProfile.description} onChange={(event) => updateProfile("description", event.target.value)} placeholder="What does the company do?" className="mt-4 min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
            </div>
          ) : null}

          {setupStep === 2 ? (
            <div>
              <h2 className="text-xl font-semibold text-white">
                Leadership Structure
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Define how daily leadership and reporting will work. People will be assigned later through Team Members.
              </p>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="text-sm font-semibold text-white">
                    Who manages the daily operations of the company?
                  </label>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {[
                      { value: "ceo", label: "CEO" },
                      { value: "managing_director", label: "Managing Director" },
                      { value: "president", label: "President" },
                      { value: "founder", label: "Founder" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateProfile("dailyLeaderRole", option.value)}
                        className={`rounded-xl border px-4 py-4 text-left text-sm font-semibold transition ${
                          companyProfile.dailyLeaderRole === option.value
                            ? "border-sky-500 bg-sky-950/40 text-sky-100"
                            : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white">
                    How is the leadership team structured?
                  </label>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {[
                      { value: "executive_only", label: "Executive only" },
                      { value: "ceo_directors", label: "CEO + Directors" },
                      { value: "director_managers", label: "Managing Director + Department Managers" },
                      { value: "custom", label: "Custom structure" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateProfile("leadershipStructure", option.value)}
                        className={`rounded-xl border px-4 py-4 text-left text-sm font-semibold transition ${
                          companyProfile.leadershipStructure === option.value
                            ? "border-sky-500 bg-sky-950/40 text-sky-100"
                            : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white">
                    How many departments do you plan to have initially?
                  </label>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {["1-3", "4-8", "9+"].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateProfile("departmentScale", value)}
                        className={`rounded-xl border px-4 py-4 text-left text-sm font-semibold transition ${
                          companyProfile.departmentScale === value
                            ? "border-sky-500 bg-sky-950/40 text-sky-100"
                            : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white">
                    Who will Department Managers report to?
                  </label>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {[true, false].map((value) => (
                      <button
                        key={String(value)}
                        type="button"
                        onClick={() => updateProfile("departmentsReportDirectly", value)}
                        className={`rounded-xl border px-4 py-4 text-left text-sm font-semibold transition ${
                          companyProfile.departmentsReportDirectly === value
                            ? "border-sky-500 bg-sky-950/40 text-sky-100"
                            : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {value ? "Directly to the Managing Director / CEO" : "Through Directors"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {setupStep === 3 ? (
            <div>
              <h2 className="text-xl font-semibold text-white">Company Size</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <select value={companyProfile.companyStage} onChange={(event) => updateProfile("companyStage", event.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white">
                  <option value="">Company Stage</option>
                  <option>Startup</option>
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                  <option>Enterprise</option>
                </select>
                <select value={companyProfile.employeeRange} onChange={(event) => updateProfile("employeeRange", event.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white">
                  <option value="">Employee Range</option>
                  {employeeRanges.map((range) => <option key={range}>{range}</option>)}
                </select>
                <input value={companyProfile.annualRevenueRange} onChange={(event) => updateProfile("annualRevenueRange", event.target.value)} placeholder="Annual Revenue Range" className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
              </div>
            </div>
          ) : null}

          {setupStep === 4 ? (
            <div>
              <h2 className="text-xl font-semibold text-white">Organization Builder</h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Departments are generated from the selected industry template. You can still add or remove departments manually.
              </p>

              <div className="mt-4 rounded-2xl border border-sky-900/25 bg-sky-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-300/60">
                  Active Template
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {companyProfile.industry || "No industry selected"}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <label className="text-xs uppercase tracking-[0.18em] text-sky-300/60">
                  Add Department
                </label>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={newDepartmentName}
                    onChange={(event) => setNewDepartmentName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addDepartment();
                      }
                    }}
                    placeholder="Department name"
                    className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                  />

                  <button
                    type="button"
                    onClick={addDepartment}
                    className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
                  >
                    Add Department
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {companyProfile.departments.map((department) => (
                  <div key={department} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                    <span className="text-sm text-white">{department}</span>
                    <button type="button" onClick={() => removeDepartment(department)} className="text-xs text-red-300">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {setupStep === 5 ? (
            <div>
              <h2 className="text-xl font-semibold text-white">Reporting Structure</h2>
              <textarea value={companyProfile.reportingFlow} onChange={(event) => updateProfile("reportingFlow", event.target.value)} className="mt-6 min-h-32 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
            </div>
          ) : null}

          {setupStep === 6 ? (
            <div>
              <h2 className="text-xl font-semibold text-white">Locations</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input value={companyProfile.headquarters} onChange={(event) => updateProfile("headquarters", event.target.value)} placeholder="Headquarters" className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
                <input value={companyProfile.branches} onChange={(event) => updateProfile("branches", event.target.value)} placeholder="Branches / Countries / Cities" className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
              </div>
            </div>
          ) : null}

          {setupStep === 7 ? (
            <div>
              <h2 className="text-xl font-semibold text-white">Operations Rules</h2>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {["dailyReports", "weeklyReports", "monthlyReports"].map((field) => (
                  <label key={field} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white">
                    <input checked={companyProfile[field]} onChange={(event) => updateProfile(field, event.target.checked)} type="checkbox" className="mr-2" />
                    {field.replace(/([A-Z])/g, " $1")}
                  </label>
                ))}
              </div>
              <textarea value={companyProfile.approvalRules} onChange={(event) => updateProfile("approvalRules", event.target.value)} placeholder="Approval rules: hiring, purchases, payments, contracts, vacation..." className="mt-4 min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
            </div>
          ) : null}

          {setupStep === 8 ? (
            <div>
              <h2 className="text-xl font-semibold text-white">KPIs</h2>
              <textarea value={companyProfile.kpis} onChange={(event) => updateProfile("kpis", event.target.value)} placeholder="Revenue, conversion rate, open tasks, late tasks, attendance, performance..." className="mt-6 min-h-36 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
            </div>
          ) : null}

          {setupStep === 9 ? (
            <div>
              <h2 className="text-xl font-semibold text-white">AI Monitoring</h2>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {aiAreas.map((area) => (
                  <label key={area} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white">
                    <input checked={companyProfile.aiMonitoring.includes(area)} onChange={() => toggleArrayValue("aiMonitoring", area)} type="checkbox" className="mr-2" />
                    {area}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {setupStep === 10 ? (
            <div>
              <h2 className="text-xl font-semibold text-white">Final Review</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-300/60">Company</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{companyProfile.companyName || activeWorkspaceName || "Not set"}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{companyProfile.description || "No company description added yet."}</p>
                  <p className="mt-3 text-sm text-zinc-300">Industry: {companyProfile.industry || "Not set"}</p>
                  <p className="mt-1 text-sm text-zinc-300">Business Type: {companyProfile.businessType || "Not set"}</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-300/60">Leadership</p>
                  <p className="mt-3 text-sm text-zinc-300">
                    Daily leader: {companyProfile.dailyLeaderRole.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    Structure: {companyProfile.leadershipStructure.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    Departments: {companyProfile.departmentScale}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-300/60">Company Size</p>
                  <p className="mt-3 text-sm text-zinc-300">Stage: {companyProfile.companyStage || "Not set"}</p>
                  <p className="mt-1 text-sm text-zinc-300">Employees: {companyProfile.employeeRange || "Not set"}</p>
                  <p className="mt-1 text-sm text-zinc-300">Revenue Range: {companyProfile.annualRevenueRange || "Not set"}</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-300/60">Departments</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {companyProfile.departments.map((department) => (
                      <span key={department} className="rounded-full border border-sky-900/40 bg-sky-950/30 px-3 py-1 text-xs text-sky-100">
                        {department}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-300/60">Reporting Structure</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">{(companyProfile.reportingFlow || "Not set").replaceAll("->", " \u2192 ")}</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-300/60">AI Monitoring</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {companyProfile.aiMonitoring.map((area) => (
                      <span key={area} className="rounded-full border border-emerald-900/40 bg-emerald-950/20 px-3 py-1 text-xs text-emerald-100">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={completeCompanySetup}
                disabled={isSavingSetup}
                className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingSetup
                  ? "Activating Company Foundation..."
                  : "Activate Company Foundation"}
              </button>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              disabled={setupStep === 1}
              onClick={() => setSetupStep((current) => Math.max(1, current - 1))}
              className="rounded-xl border border-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-300 disabled:opacity-40"
            >
              Back
            </button>

            <button
              type="button"
              disabled={setupStep === wizardSteps.length}
              onClick={() => setSetupStep((current) => Math.min(wizardSteps.length, current + 1))}
              className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
