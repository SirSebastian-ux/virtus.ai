export const DEFAULT_PERMISSION_KEYS = [
  "reports.view",
  "reports.review",
  "tasks.view",
  "tasks.manage",
  "urgent_issues.view",
  "urgent_issues.manage",
  "decisions.view",
  "decisions.manage",
  "employees.view",
  "employees.manage",
  "structure.view",
  "roles.manage",
  "invitations.request",
  "approvals.decide",
  "permissions.manage",
  "billing.view",
  "billing.manage",
];

export function normalizePermissions(value) {
  const permissions = value && typeof value === "object" ? value : {};
  const normalized = {};

  DEFAULT_PERMISSION_KEYS.forEach((key) => {
    normalized[key] = Boolean(permissions[key]);
  });

  return normalized;
}

export function hasPermission(permissionMap, permissionKey) {
  return Boolean(permissionMap?.[permissionKey]);
}
