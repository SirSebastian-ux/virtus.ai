create table if not exists public.operations_role_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  role text not null check (
    role in (
      'owner',
      'director',
      'senior_manager',
      'department_manager',
      'supervisor',
      'employee'
    )
  ),
  department_id uuid references public.departments(id) on delete set null,
  reports_to_employee_id uuid references public.employees(id) on delete set null,
  scope_type text not null default 'self' check (
    scope_type in ('company', 'department', 'team', 'self')
  ),
  status text not null default 'pending' check (
    status in ('pending', 'active', 'suspended', 'revoked')
  ),
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_permission_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  role text not null check (
    role in (
      'owner',
      'director',
      'senior_manager',
      'department_manager',
      'supervisor',
      'employee'
    )
  ),
  permissions jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.operations_user_permissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  permission_key text not null,
  permission_value boolean not null default false,
  scope_type text not null default 'self' check (
    scope_type in ('company', 'department', 'team', 'self')
  ),
  department_id uuid references public.departments(id) on delete set null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id, employee_id, permission_key, scope_type, department_id)
);

create table if not exists public.operations_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  invited_name text,
  requested_role text not null check (
    requested_role in (
      'owner',
      'director',
      'senior_manager',
      'department_manager',
      'supervisor',
      'employee'
    )
  ),
  requested_scope_type text not null default 'self' check (
    requested_scope_type in ('company', 'department', 'team', 'self')
  ),
  department_id uuid references public.departments(id) on delete set null,
  reports_to_employee_id uuid references public.employees(id) on delete set null,
  status text not null default 'pending_approval' check (
    status in (
      'pending_approval',
      'approved',
      'sent',
      'accepted',
      'rejected',
      'cancelled',
      'expired'
    )
  ),
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_approval_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  request_type text not null check (
    request_type in (
      'invitation',
      'role_assignment',
      'permission_change',
      'payment_confirmation',
      'decision',
      'urgent_issue'
    )
  ),
  related_table text,
  related_id uuid,
  title text not null,
  description text,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'cancelled')
  ),
  requested_by uuid references auth.users(id) on delete set null,
  assigned_approver uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operations_role_assignments_workspace_idx
  on public.operations_role_assignments(workspace_id);

create index if not exists operations_role_assignments_user_idx
  on public.operations_role_assignments(user_id);

create index if not exists operations_role_assignments_employee_idx
  on public.operations_role_assignments(employee_id);

create index if not exists operations_permission_profiles_workspace_idx
  on public.operations_permission_profiles(workspace_id);

create index if not exists operations_user_permissions_workspace_idx
  on public.operations_user_permissions(workspace_id);

create index if not exists operations_user_permissions_user_idx
  on public.operations_user_permissions(user_id);

create index if not exists operations_invitations_workspace_idx
  on public.operations_invitations(workspace_id);

create index if not exists operations_invitations_email_idx
  on public.operations_invitations(email);

create index if not exists operations_approval_requests_workspace_idx
  on public.operations_approval_requests(workspace_id);

create index if not exists operations_approval_requests_status_idx
  on public.operations_approval_requests(status);
