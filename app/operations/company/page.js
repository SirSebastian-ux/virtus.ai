"use client";

import { useEffect, useState } from "react";

const emptyMetrics = {
  activeEmployees: 0,
  openTasks: 0,
  openUrgentIssues: 0,
  pendingDecisions: 0,
  pendingPayments: 0,
};

const wizardSteps = [
  "Company Identity",
  "Ownership & Leadership",
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
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [setupStep, setSetupStep] = useState(1);

  const [companyProfile, setCompanyProfile] = useState({
    companyName: "",
    legalName: "",
    industry: "",
    businessType: "",
    description: "",
    mainProducts: "",
    mainServices: "",
    targetClients: "",
    ownerName: "",
    coOwners: "",
    ceo: "",
    managingDirector: "",
    companyStage: "",
    employeeRange: "",
    annualRevenueRange: "",
    departments: defaultDepartments,
    reportingFlow: "Owner → Directors → Managers → Supervisors → Employees",
    headquarters: "",
    branches: "",
    dailyReports: true,
    weeklyReports: true,
    monthlyReports: false,
    approvalRules: "",
    kpis: "",
    aiMonitoring: ["Tasks", "Risks", "Approvals"],
  });

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
    const departmentName = window.prompt("Department name");

    if (!departmentName?.trim()) return;

    setCompanyProfile((current) => ({
      ...current,
      departments: [...current.departments, departmentName.trim()],
    }));
  }

  function removeDepartment(departmentName) {
    setCompanyProfile((current) => ({
      ...current,
      departments: current.departments.filter((item) => item !== departmentName),
    }));
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

        const workspaceId = selectedWorkspaceId || nextWorkspaces[0]?.id || "";

        if (!workspaceId) return;

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

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;

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

        <div className="mt-8 rounded-2xl border border-sky-900/25 bg-zinc-950/50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-300/60">
                Selected Company
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-white">
                {isLoading ? "Loading company..." : activeWorkspaceName || "No company selected"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                This setup applies only to the active company workspace.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">
                Active Workspace
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-100">
                {activeWorkspace?.status || "active"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["Role", activeWorkspace?.role || "owner"],
              ["Employees", isLoading ? "..." : metrics.activeEmployees],
              ["Open Tasks", isLoading ? "..." : metrics.openTasks],
              ["Urgent Issues", isLoading ? "..." : metrics.openUrgentIssues],
              ["Pending Decisions", isLoading ? "..." : metrics.pendingDecisions],
              ["Pending Payments", isLoading ? "..." : metrics.pendingPayments],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

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
                <input value={companyProfile.industry} onChange={(event) => updateProfile("industry", event.target.value)} placeholder="Industry" className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
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
              <h2 className="text-xl font-semibold text-white">Ownership & Leadership</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input value={companyProfile.ownerName} onChange={(event) => updateProfile("ownerName", event.target.value)} placeholder="Owner Name" className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
                <input value={companyProfile.coOwners} onChange={(event) => updateProfile("coOwners", event.target.value)} placeholder="Co-Owners" className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
                <input value={companyProfile.ceo} onChange={(event) => updateProfile("ceo", event.target.value)} placeholder="CEO" className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
                <input value={companyProfile.managingDirector} onChange={(event) => updateProfile("managingDirector", event.target.value)} placeholder="Managing Director" className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white" />
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
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">Departments</h2>
                <button type="button" onClick={addDepartment} className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white">Add Department</button>
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
              <pre className="mt-6 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-xs leading-6 text-zinc-300">
                {JSON.stringify(companyProfile, null, 2)}
              </pre>
              <button type="button" className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white">
                Activate Company Foundation
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