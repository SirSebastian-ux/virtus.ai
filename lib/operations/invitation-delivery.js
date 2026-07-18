import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function cleanText(value) {
  return String(value || "").trim();
}

function getApplicationOrigin() {
  const configuredUrl = cleanText(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL
  );

  if (!configuredUrl) {
    throw new Error("Missing application URL configuration.");
  }

  const normalizedUrl = configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;

  const parsedUrl = new URL(normalizedUrl);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Invalid application URL configuration.");
  }

  return parsedUrl.origin;
}

function buildInvitationCallbackUrl(invitationId) {
  const callbackUrl = new URL("/auth/callback", getApplicationOrigin());
  const nextPath =
    `/operations/invitations/accept?invitationId=${encodeURIComponent(
      invitationId
    )}`;

  callbackUrl.searchParams.set("next", nextPath);

  return callbackUrl.toString();
}

function isExistingUserError(error) {
  const errorText = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();

  return (
    errorText.includes("email_exists") ||
    errorText.includes("already registered") ||
    errorText.includes("already exists") ||
    errorText.includes("user already")
  );
}

async function recordDeliveryError(admin, invitationId, error, attemptedAt) {
  const message =
    cleanText(error?.message || error).slice(0, 1000) ||
    "Invitation email delivery failed.";

  await admin
    .from("operations_invitations")
    .update({
      delivery_error: message,
      last_delivery_attempt_at: attemptedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId);
}

export async function sendOperationsInvitationEmail({
  admin,
  invitation,
  workspaceName = "",
}) {
  if (!invitation?.id || !invitation?.email || !invitation?.workspace_id) {
    throw new Error("A valid invitation is required.");
  }

  if (!["approved", "sent"].includes(invitation.status)) {
    throw new Error("Invitation must be approved before email delivery.");
  }

  const attemptedAt = new Date().toISOString();
  const deliveryAttempts = Number(invitation.delivery_attempts || 0) + 1;
  const callbackUrl = buildInvitationCallbackUrl(invitation.id);

  const { error: attemptError } = await admin
    .from("operations_invitations")
    .update({
      delivery_attempts: deliveryAttempts,
      last_delivery_attempt_at: attemptedAt,
      delivery_error: null,
      updated_at: attemptedAt,
    })
    .eq("id", invitation.id)
    .eq("workspace_id", invitation.workspace_id);

  if (attemptError) {
    throw new Error(attemptError.message);
  }

  let authUserId = invitation.auth_user_id || null;
  let deliveryMode = "invitation";

  try {
    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(invitation.email, {
        redirectTo: callbackUrl,
        data: {
          full_name: invitation.invited_name || undefined,
          operations_invitation_id: invitation.id,
          operations_workspace_id: invitation.workspace_id,
          operations_workspace_name: workspaceName || undefined,
        },
      });

    if (inviteError) {
      if (!isExistingUserError(inviteError)) {
        throw inviteError;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error(
          "Supabase public authentication configuration is missing."
        );
      }

      const publicClient = createSupabaseClient(supabaseUrl, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { error: magicLinkError } =
        await publicClient.auth.signInWithOtp({
          email: invitation.email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: callbackUrl,
          },
        });

      if (magicLinkError) {
        throw magicLinkError;
      }

      deliveryMode = "sign_in_link";
    } else {
      authUserId = inviteData?.user?.id || authUserId;
    }

    const sentAt = new Date().toISOString();

    const { data: updatedInvitation, error: updateError } = await admin
      .from("operations_invitations")
      .update({
        status: "sent",
        auth_user_id: authUserId,
        sent_at: sentAt,
        delivery_error: null,
        updated_at: sentAt,
      })
      .eq("id", invitation.id)
      .eq("workspace_id", invitation.workspace_id)
      .select(
        "id, workspace_id, email, invited_name, requested_role, requested_scope_type, department_id, reports_to_employee_id, status, requested_by, approved_by, approved_at, auth_user_id, sent_at, delivery_attempts, delivery_error, expires_at, created_at, updated_at"
      )
      .single();

    if (updateError) {
      throw new Error(
        `The email may have been sent, but delivery status could not be saved: ${updateError.message}`
      );
    }

    return {
      invitation: updatedInvitation,
      deliveryMode,
    };
  } catch (error) {
    await recordDeliveryError(admin, invitation.id, error, attemptedAt);
    throw error;
  }
}