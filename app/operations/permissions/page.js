"use client";

import { useEffect, useMemo, useState } from "react";

const roles = [
  "owner",
  "director",
  "senior_manager",
  "department_manager",
  "supervisor",
  "employee",
];

const permissionLabels = {
  "reports.view": "View Reports",
  "reports.review": "Review Reports",
  "tasks.view": "View Tasks",
  "tasks.manage": "Manage Tasks",
  "urgent_issues.view": "View Urgent Issues",
  "urgent_issues.manage": "Manage Urgent Issues",
  "decisions.view": "View Decisions",
  "decisions.manage": "Manage Decisions",
  "employees.view": "View Employees",
  "employees.manage": "Manage Employees",
  "structure.view": "View Structure",
  "roles.manage": "Manage Roles",
  "invitations.request": "Request Invitations",
  "approvals.decide": "Decide Approvals",
  "permissions.manage": "Manage Permissions",
  "billing.view": "View Billing",
  "billing.manage": "Manage Billing",
};

function formatLabel(value) {
  return String(value || "").replaceAll("_", " ");
}

function emptyPermissions(keys) {
  return keys.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});
}

export default function OperationsPermissionsPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [permissionKeys, setPermissionKeys] = useState([]);
  const [permissionProfiles, setPermissionProfiles] = useState([]);

  const [name, setName] = useState("");
  const [role, setRole] = useState("employee");
  const [isDefault, setIsDefault] = useState(false);
  const [permissions, setPermissions] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadPermissionProfiles(workspaceId) {
    if (!workspaceId) return;

    setIsLoading(true);
    setError("");

    const response = await fetch(
      `/api/operations/permission-profiles?workspaceId=${encodeURIComponent(
        workspaceId
      )}`
    );
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to load permission profiles.");
      setPermissionProfiles([]);
      setIsLoading(false);
      return;
    }

    const keys = Array.isArray(data.permissionKeys) ? data.permissionKeys : [];
    setPermissionKeys(keys);
    setPermissions(emptyPermissions(keys));
    setPermissionProfiles(
      Array.isArray(data.permissionProfiles) ? data.permissionProfiles : []
    );
    setIsLoading(false);
  }

  async function handleWorkspaceChange(event) {
    const workspaceId = event.target.value;
    setSelectedWorkspaceId(workspaceId);

    if (typeof window !== "undefined") {
      const workspace = workspaces.find((item) => item.id === workspaceId);
      localStorage.setItem("virtus_active_workspace_id", workspaceId);

      if (workspace?.name) {
        localStorage.setItem("virtus_active_workspace_name", workspace.name);
      }

      window.dispatchEvent(new Event("virtus-active-workspace-changed"));
    }
    setName("");
    setRole("employee");
    setIsDefault(false);
    await loadPermissionProfiles(workspaceId);
  }

  function togglePermission(key) {
    setPermissions((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function submitPermissionProfile(event) {
    event.preventDefault();

    if (!selectedWorkspaceId || !name.trim() || !role) {
      setError("Workspace, profile name, and role are required.");
      return;
    }

    setIsSaving(true);
    setError("");

    const response = await fetch("/api/operations/permission-profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId: selectedWorkspaceId,
        name,
        role,
        isDefault,
        permissions,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error || "Unable to save permission profile.");
    } else {
      setName("");
      setRole("employee");
      setIsDefault(false);
      setPermissions(emptyPermissions(permissionKeys));
      await loadPermissionProfiles(selectedWorkspaceId);
    }

    setIsSaving(false);
  }

  useEffect(() => {
    let alive = true;

    async function loadInitialData() {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/operations/workspaces");
      const data = await response.json();

      if (!alive) return;

      if (!response.ok) {
        setError(data?.error || "Unable to load workspaces.");
        setIsLoading(false);
        return;
      }

      const loadedWorkspaces = Array.isArray(data.workspaces)
        ? data.workspaces
        : [];

      setWorkspaces(loadedWorkspaces);

      if (loadedWorkspaces.length > 0) {
        const activeWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_id") || ""
            : "";

        const selectedWorkspace = loadedWorkspaces.find(
          (workspace) => workspace.id === activeWorkspaceId
        );

        if (!selectedWorkspace?.id) {
          // Clear invalid workspace ID from localStorage
          if (typeof window !== "undefined") {
            localStorage.removeItem("virtus_active_workspace_id");
            localStorage.removeItem("virtus_active_workspace_name");
          }
          throw new Error("No active company selected.");
        }

        setSelectedWorkspaceId(selectedWorkspace.id);

        if (typeof window !== "undefined") {
          localStorage.setItem("virtus_active_workspace_id", selectedWorkspace.id);

          if (selectedWorkspace.name) {
            localStorage.setItem("virtus_active_workspace_name", selectedWorkspace.name);
          }
        }

        await loadPermissionProfiles(selectedWorkspace.id);
      } else {
        setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      alive = false;
    };
  }, []);

  const groupedProfiles = useMemo(() => {
    return roles.map((item) => ({
      role: item,
      profiles: permissionProfiles.filter((profile) => profile.role === item),
    }));
  }, [permissionProfiles]);

  return (
    <section className="px-6 py-8">
      <div className="rounded-3xl border border-sky-900/25 bg-zinc-900/60 p-6">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/60">
          Access Control
        </p>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Permission Profiles
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Define permission templates for each leadership level before
              enforcing role-filtered dashboards and scoped data access.
            </p>
          </div>

          <select
            value={selectedWorkspaceId}
            onChange={handleWorkspaceChange}
            className="min-h-12 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
          >
            {workspaces.length === 0 ? (
              <option value="">No workspace available</option>
            ) : (
              workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))
            )}
          </select>
        </div>

        {error ? <p className="mt-5 text-sm text-red-300">{error}</p> : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
          <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-sky-100">
              Create Permission Profile
            </h2>

            <form onSubmit={submitPermissionProfile} className="mt-5 space-y-4">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Profile name"
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-sky-500"
              />

              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-sky-500"
              >
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {formatLabel(item)}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(event) => setIsDefault(event.target.checked)}
                />
                Set as default for this role
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {permissionKeys.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(permissions[key])}
                      onChange={() => togglePermission(key)}
                    />
                    {permissionLabels[key] || key}
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSaving || !selectedWorkspaceId}
                className="w-full rounded-2xl border border-sky-800/50 bg-sky-950/40 px-5 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-900/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Permission Profile"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-sky-900/25 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-semibold text-sky-100">
              Existing Permission Profiles
            </h2>

            <div className="mt-5 space-y-5">
              {isLoading ? (
                <p className="text-sm text-zinc-400">
                  Loading permission profiles...
                </p>
              ) : permissionProfiles.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                  No permission profiles yet.
                </div>
              ) : (
                groupedProfiles.map((group) =>
                  group.profiles.length === 0 ? null : (
                    <div key={group.role}>
                      <h3 className="text-sm font-semibold text-white">
                        {formatLabel(group.role)}
                      </h3>

                      <div className="mt-3 space-y-3">
                        {group.profiles.map((profile) => {
                          const enabledPermissions = permissionKeys.filter(
                            (key) => profile.permissions?.[key]
                          );

                          return (
                            <div
                              key={profile.id}
                              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
                            >
                              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {profile.name}
                                  </p>
                                  <p className="mt-1 text-xs text-zinc-500">
                                    {formatLabel(profile.role)}
                                  </p>
                                </div>

                                {profile.isDefault ? (
                                  <span className="rounded-full border border-emerald-700/40 px-3 py-1 text-xs text-emerald-100">
                                    Default
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {enabledPermissions.length === 0 ? (
                                  <span className="text-xs text-zinc-500">
                                    No permissions enabled.
                                  </span>
                                ) : (
                                  enabledPermissions.map((key) => (
                                    <span
                                      key={key}
                                      className="rounded-full border border-sky-900/40 px-3 py-1 text-xs text-sky-100"
                                    >
                                      {permissionLabels[key] || key}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
