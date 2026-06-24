create unique index if not exists operations_role_assignments_unique_role_idx
on public.operations_role_assignments(workspace_id, user_id, employee_id, role);
