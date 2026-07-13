/**
 * Validates that a workspace is not archived or deleted before allowing mutations.
 * Used across Operations API to enforce read-only access for archived workspaces.
 *
 * @param {SupabaseAdmin} admin - Supabase admin client
 * @param {string} workspaceId - Workspace ID to validate
 * @returns {Promise<{allowed: boolean, status?: number, message?: string}>}
 */
export async function validateWorkspaceMutationAllowed(admin, workspaceId) {
  const { data: workspace, error } = await admin
    .from("workspaces")
    .select("id,status")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!workspace) {
    return {
      allowed: false,
      status: 404,
      message: "Workspace not found.",
    };
  }

  if (workspace.status === "archived") {
    return {
      allowed: false,
      status: 410,
      message: "Cannot modify archived workspace.",
    };
  }

  if (workspace.status === "deleted") {
    return {
      allowed: false,
      status: 410,
      message: "Cannot modify deleted workspace.",
    };
  }

  return { allowed: true };
}
