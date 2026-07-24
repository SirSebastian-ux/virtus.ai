export const ROLE_LEVELS = {
  owner: 100,
  director: 90,
  senior_manager: 80,
  department_manager: 70,
  supervisor: 60,
  employee: 10,
};

export function hasMinimumRole(role, minimumRole) {
  return (ROLE_LEVELS[role] || 0) >= (ROLE_LEVELS[minimumRole] || 0);
}

export function canManagePermissions(role) {
  return hasMinimumRole(role, "director");
}

export function canApproveRequests(role) {
  return hasMinimumRole(role, "department_manager");
}

export function canManageEmployees(role) {
  return hasMinimumRole(role, "supervisor");
}

export function canManageDepartments(role) {
  return hasMinimumRole(role, "department_manager");
}

export function canViewCompanyData(role) {
  return hasMinimumRole(role, "director");
}

export function canViewDepartmentData(role) {
  return hasMinimumRole(role, "department_manager");
}

export function canViewTeamData(role) {
  return hasMinimumRole(role, "supervisor");
}

export function canViewCompanyModule(role) {
  return hasMinimumRole(role, "director");
}

export function canViewEmployeesModule(role) {
  return hasMinimumRole(role, "supervisor");
}

export function canViewStructureModule(role) {
  return hasMinimumRole(role, "director");
}

export function canReviewReports(role) {
  return hasMinimumRole(role, "supervisor");
}

export function canViewReportsModule(role) {
  return canReviewReports(role);
}

export function canViewTasksModule(role) {
  return hasMinimumRole(role, "employee");
}

export function canViewPaymentsModule(role) {
  return hasMinimumRole(role, "department_manager");
}

export function canViewUrgentIssuesModule(role) {
  return hasMinimumRole(role, "employee");
}

export function canViewDecisionQueueModule(role) {
  return hasMinimumRole(role, "department_manager");
}

export function canViewPermissionsModule(role) {
  return hasMinimumRole(role, "director");
}

export function canViewAdminModule(role) {
  return role === "owner";
}
