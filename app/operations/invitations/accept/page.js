"use client";

import { useCallback, useEffect, useState } from "react";

function formatValue(value) {
  if (!value) return "Not specified";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeInvitation(payload, invitationId) {
  const source = payload?.invitation ?? payload ?? {};

  return {
    id: source.id ?? invitationId,
    companyName:
      source.companyName ??
      source.workspaceName ??
      source.company_name ??
      source.workspace_name ??
      source.workspace?.name ??
      "Company",
    email:
      source.email ??
      source.invitedEmail ??
      source.invited_email ??
      "Not specified",
    role:
      source.role ??
      source.requestedRole ??
      source.requested_role ??
      "employee",
    department:
      source.departmentName ??
      source.department_name ??
      source.department?.name ??
      null,
    reportingManager:
      source.reportsToEmployeeName ??
      source.reports_to_employee_name ??
      source.reportingManagerName ??
      source.reporting_manager_name ??
      source.managerName ??
      source.manager_name ??
      source.reportingManager?.fullName ??
      source.reporting_manager?.full_name ??
      null,
    status: source.status ?? "unknown",
    expiresAt: source.expiresAt ?? source.expires_at ?? null,
  };
}

export default function AcceptOperationsInvitationPage() {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  const redirectToLogin = useCallback((id) => {
    const nextPath =
      `/operations/invitations/accept?invitationId=${encodeURIComponent(id)}`;

    window.location.assign(
      `/login?next=${encodeURIComponent(nextPath)}`
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("invitationId")?.trim() || "";
    let cancelled = false;
    const controller = new AbortController();

    if (!id) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setError("The invitation link is incomplete.");
          setLoading(false);
        }
      });

      return () => {
        cancelled = true;
      };
    }

    fetch(
      `/api/operations/invitations/accept?invitationId=${encodeURIComponent(id)}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        signal: controller.signal,
      }
    )
      .then(async (response) => {
        if (response.status === 401) {
          redirectToLogin(id);
          return null;
        }

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error || "Unable to load this invitation."
          );
        }

        return normalizeInvitation(payload, id);
      })
      .then((loadedInvitation) => {
        if (!cancelled && loadedInvitation) {
          setInvitation(loadedInvitation);
        }
      })
      .catch((loadError) => {
        if (cancelled || loadError?.name === "AbortError") return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load this invitation."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [redirectToLogin]);
  async function acceptInvitation() {
    const invitationId = invitation?.id;
    if (!invitationId || accepting) return;

    setAccepting(true);
    setError("");

    try {
      const response = await fetch(
        "/api/operations/invitations/accept",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invitationId }),
        }
      );

      if (response.status === 401) {
        redirectToLogin(invitationId);
        return;
      }

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to accept this invitation.");
      }

      const workspaceId =
        payload.workspaceId ??
        payload.workspace_id ??
        payload.workspace?.id;

      const workspaceName =
        payload.workspaceName ??
        payload.workspace_name ??
        payload.workspace?.name ??
        invitation?.companyName;

      if (workspaceId) {
        window.localStorage.setItem(
          "virtus_active_workspace_id",
          workspaceId
        );
      }

      if (workspaceName) {
        window.localStorage.setItem(
          "virtus_active_workspace_name",
          workspaceName
        );
      }

      window.dispatchEvent(
        new Event("virtus-active-workspace-changed")
      );

      window.location.assign("/operations/organization");
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Unable to accept this invitation."
      );
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <p className="text-sm text-zinc-400">Loading invitation...</p>
        </div>
      </main>
    );
  }

  const status = invitation?.status ?? "unknown";
  const canAccept = status === "sent" || status === "approved";
  const alreadyAccepted = status === "accepted";

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
            Virtus AI Operations
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Organization Invitation
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Review the organizational access assigned to you before accepting.
          </p>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {invitation ? (
            <div className="mt-8 space-y-3">
              {[
                ["Company", invitation.companyName],
                ["Invited Email", invitation.email],
                ["Role", formatValue(invitation.role)],
                ["Department", invitation.department || "Not assigned"],
                [
                  "Reports To",
                  invitation.reportingManager || "Nobody assigned",
                ],
                ["Status", formatValue(invitation.status)],
                ["Expires", formatDate(invitation.expiresAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-zinc-500">{label}</span>
                  <span className="text-sm font-medium text-zinc-100">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {alreadyAccepted ? (
            <div className="mt-8">
              <p className="text-sm text-emerald-300">
                This invitation has already been accepted.
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.assign("/operations/organization")
                }
                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Continue to Organization
              </button>
            </div>
          ) : null}

          {canAccept ? (
            <button
              type="button"
              onClick={acceptInvitation}
              disabled={accepting}
              className="mt-8 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {accepting ? "Accepting Invitation..." : "Accept Invitation"}
            </button>
          ) : null}

          {!canAccept && !alreadyAccepted && invitation ? (
            <p className="mt-8 rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
              This invitation cannot currently be accepted. Its status is{" "}
              {formatValue(status)}.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}