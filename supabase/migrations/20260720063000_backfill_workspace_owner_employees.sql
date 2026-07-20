-- Ensure every active workspace owner is represented as an active employee.
-- This allows the owner to be assigned to organization leadership positions.

insert into public.employees (
  workspace_id,
  user_id,
  department_id,
  full_name,
  email,
  position_title,
  employment_status,
  created_by
)
select
  workspace.id,
  workspace.owner_user_id,
  (
    select department.id
    from public.departments department
    where department.workspace_id = workspace.id
      and department.status = 'active'
      and lower(btrim(department.name)) in (
        'executive office',
        'management'
      )
    order by
      case lower(btrim(department.name))
        when 'executive office' then 1
        when 'management' then 2
        else 3
      end,
      department.created_at
    limit 1
  ),
  coalesce(
    nullif(btrim(owner.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(owner.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(owner.email, ''), '@', 1), ''),
    'Workspace Owner'
  ),
  owner.email,
  'Owner',
  'active',
  workspace.owner_user_id
from public.workspaces workspace
join auth.users owner
  on owner.id = workspace.owner_user_id
where workspace.owner_user_id is not null
  and coalesce(workspace.status, '') not in ('archived', 'deleted')
  and not exists (
    select 1
    from public.employees existing_employee
    where existing_employee.workspace_id = workspace.id
      and existing_employee.user_id = workspace.owner_user_id
  );

-- Link any existing owner role assignment that was created before the
-- corresponding employee record existed.
update public.operations_role_assignments role_assignment
set
  employee_id = owner_employee.id,
  updated_at = now()
from public.employees owner_employee
where role_assignment.workspace_id = owner_employee.workspace_id
  and role_assignment.user_id = owner_employee.user_id
  and role_assignment.role = 'owner'
  and role_assignment.status = 'active'
  and role_assignment.employee_id is null;