"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const actions = [
  {
    title: "Reset Test Data",
    description:
      "Deletes operational test data such as reports, tasks, alerts, urgent issues, decisions, payments, approvals, and activity logs. Company structure remains.",
    endpoint: "/api/operations/danger-zone/reset-test-data",
    confirmation: "RESET TEST DATA",
    button: "Reset Test Data",
  },
  {
    title: "Reset Organization",
    description:
      "Deletes employees, departments, invitations, permissions, role assignments, and operational records. The owner and default departments are recreated.",
    endpoint: "/api/operations/danger-zone/reset-organization",
    confirmation: "RESET ORGANIZATION",
    button: "Reset Organization",
  },
  {
    title: "Archive Company",
    description:
      "Archives the company workspace. This is safer than deletion and should be used when you may need to preserve company records.",
    endpoint: "/api/operations/danger-zone/archive-workspace",
    confirmation: "ARCHIVE COMPANY",
    button: "Archive Company",
  },
  {
    title: "Delete Company",
    description:
      "Permanently deletes the company workspace, employees, departments, permissions, invitations, billing profile, members, and operational data. This cannot be undone.",
    endpoint: "/api/operations/danger-zone/delete-workspace",
    confirmation: "DELETE COMPANY",
    button: "Delete Company Permanently",
    destructive: true,
  },
];

export default function DangerZonePage() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState("");
  const [role, setRole] = useState("");
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadAccess() {
      try {
        const selectedWorkspaceId =
          typeof window !== "undefined"
            ? localStorage.getItem("virtus_active_workspace_id") || ""
            : "";

        if (!selectedWorkspaceId) {
          throw new Error("No active company selected.");
        }

        const metricsUrl = `/api/operations/metrics?workspaceId=${encodeURIComponent(
          selectedWorkspaceId
        )}`;

        const metricsResponse = await fetch(metricsUrl, {
          cache: "no-store",
        });
        const metricsData = await metricsResponse.json();
        const nextWorkspaceId = metricsData?.metrics?.workspaceId || "";

        if (!nextWorkspaceId) {
          if (alive) setLoading(false);
          return;
        }

        const accessResponse = await fetch(
          `/api/operations/access-context?workspaceId=${encodeURIComponent(
            nextWorkspaceId
          )}`,
          { cache: "no-store" }
        );
        const accessData = await accessResponse.json();

        if (!alive) return;

        setWorkspaceId(nextWorkspaceId);
        setRole(accessData?.accessContext?.role || "");
      } catch (error) {
        console.error("Failed to load Danger Zone access", error);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAccess();

    return () => {
      alive = false;
    };
  }, []);

  async function runDangerAction(action) {
    setMessage("");
    setRunningAction(action.title);

    try {
      const response = await fetch(action.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          confirmation: inputs[action.confirmation] || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Action failed.");
      }

      setMessage(data?.message || "Action completed successfully.");

      if (
        action.confirmation === "ARCHIVE COMPANY" ||
        action.confirmation === "DELETE COMPANY"
      ) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("virtus_active_workspace_id");
          localStorage.removeItem("virtus_active_workspace_name");
          window.dispatchEvent(new Event("virtus-active-workspace-changed"));
        }

        router.push("/operations");
        router.refresh();
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setRunningAction("");
    }
  }

  if (loading) {
    return (
      <section className="px-6 py-8">
        <p className="text-sm text-zinc-400">Loading Danger Zone...</p>
      </section>
    );
  }

  if (role !== "owner") {
    return (
      <section className="px-6 py-8">
        <div className="rounded-3xl border border-red-900/30 bg-red-950/10 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-red-300/60">
            Restricted Area
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Owner access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Only the company owner can reset, archive, or delete this workspace.
          </p>
          <Link
            href="/operations"
            className="mt-6 inline-flex rounded-xl border border-sky-900/40 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-600"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-red-300/60">
        Owner Danger Zone
      </p>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            Company Danger Zone
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Reset company data, reset the organization, archive the company, or
            permanently delete the workspace.
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            Workspace: {workspaceId}
          </p>
        </div>

        <Link
          href="/operations"
          className="inline-flex rounded-xl border border-sky-900/40 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-600"
        >
          Back to Dashboard
        </Link>
      </div>

      {message ? (
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100">
          {message}
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {actions.map((action) => {
          const value = inputs[action.confirmation] || "";
          const confirmed = value === action.confirmation;
          const running = runningAction === action.title;

          return (
            <div
              key={action.title}
              className={`rounded-3xl border p-6 ${
                action.destructive
                  ? "border-red-500/30 bg-red-950/10"
                  : "border-amber-500/20 bg-zinc-900/70"
              }`}
            >
              <h2
                className={`text-xl font-semibold ${
                  action.destructive ? "text-red-100" : "text-white"
                }`}
              >
                {action.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {action.description}
              </p>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
                <p className="text-sm font-semibold text-zinc-200">
                  Confirmation required
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Type{" "}
                  <span className="font-semibold text-zinc-200">
                    {action.confirmation}
                  </span>{" "}
                  to continue.
                </p>

                <input
                  value={value}
                  onChange={(event) =>
                    setInputs((current) => ({
                      ...current,
                      [action.confirmation]: event.target.value,
                    }))
                  }
                  className="mt-4 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-red-500/60"
                  placeholder={action.confirmation}
                />
              </div>

              <button
                type="button"
                disabled={!confirmed || running}
                onClick={() => runDangerAction(action)}
                className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  action.destructive
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : "bg-amber-500 text-zinc-950 hover:bg-amber-400"
                }`}
              >
                {running ? "Processing..." : action.button}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
