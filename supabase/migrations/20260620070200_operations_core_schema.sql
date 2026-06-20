create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  )
  or exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_user_id = auth.uid()
  );
$$;

-- Virtus AI Operations Intelligence
-- Migration: Core multi-tenant operations schema
-- Purpose: Create the first production-grade database foundation for Operations Intelligence.

create extension if not exists "pgcrypto";

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'employee',
  status text not null default 'active',
  invited_by uuid references auth.users(id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  manager_user_id uuid references auth.users(id),
  status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  manager_user_id uuid references auth.users(id),
  full_name text not null,
  email text,
  position_title text,
  employment_status text not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  raw_report text not null,
  report_date date not null default current_date,
  source text not null default 'operations_chat',
  ai_summary text,
  ai_extracted jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  assigned_employee_id uuid references public.employees(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'normal',
  due_date date,
  source_report_id uuid references public.operations_reports(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_task_updates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id uuid not null references public.operations_tasks(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  update_text text not null,
  status_after text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.operations_payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  amount numeric(14,2) not null,
  currency text not null default 'MZN',
  payment_method text,
  payer_name text,
  reference text,
  status text not null default 'pending_confirmation',
  source_report_id uuid references public.operations_reports(id) on delete set null,
  created_by uuid references auth.users(id),
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_urgent_issues (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  title text not null,
  description text,
  severity text not null default 'medium',
  status text not null default 'open',
  source_report_id uuid references public.operations_reports(id) on delete set null,
  assigned_to uuid references auth.users(id),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_decision_queue (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  requested_by_employee_id uuid references public.employees(id) on delete set null,
  decision_type text not null,
  title text not null,
  description text,
  status text not null default 'pending',
  priority text not null default 'normal',
  source_report_id uuid references public.operations_reports(id) on delete set null,
  assigned_to uuid references auth.users(id),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision_note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_daily_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  report_date date not null,
  department_id uuid references public.departments(id) on delete set null,
  summary text,
  completed_work jsonb not null default '[]'::jsonb,
  pending_work jsonb not null default '[]'::jsonb,
  payments_summary jsonb not null default '{}'::jsonb,
  urgent_issues_summary jsonb not null default '[]'::jsonb,
  decisions_summary jsonb not null default '[]'::jsonb,
  ai_summary text,
  generated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, report_date, department_id)
);

create table if not exists public.operations_management_alerts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  alert_type text not null,
  title text not null,
  message text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  source_table text,
  source_id uuid,
  assigned_to uuid references auth.users(id),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_ai_summaries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  summary_type text not null,
  source_table text,
  source_id uuid,
  summary text not null,
  model text,
  tokens_used integer,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.operations_activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_table text,
  entity_id uuid,
  previous_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_members_workspace_id on public.workspace_members(workspace_id);
create index if not exists idx_workspace_members_user_id on public.workspace_members(user_id);
create index if not exists idx_departments_workspace_id on public.departments(workspace_id);
create index if not exists idx_employees_workspace_id on public.employees(workspace_id);
create index if not exists idx_employees_user_id on public.employees(user_id);
create index if not exists idx_operations_reports_workspace_id on public.operations_reports(workspace_id);
create index if not exists idx_operations_reports_report_date on public.operations_reports(report_date);
create index if not exists idx_operations_tasks_workspace_id on public.operations_tasks(workspace_id);
create index if not exists idx_operations_tasks_status on public.operations_tasks(status);
create index if not exists idx_operations_payments_workspace_id on public.operations_payments(workspace_id);
create index if not exists idx_operations_payments_status on public.operations_payments(status);
create index if not exists idx_operations_urgent_issues_workspace_id on public.operations_urgent_issues(workspace_id);
create index if not exists idx_operations_decision_queue_workspace_id on public.operations_decision_queue(workspace_id);
create index if not exists idx_operations_management_alerts_workspace_id on public.operations_management_alerts(workspace_id);
create index if not exists idx_operations_activity_logs_workspace_id on public.operations_activity_logs(workspace_id);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.operations_reports enable row level security;
alter table public.operations_tasks enable row level security;
alter table public.operations_task_updates enable row level security;
alter table public.operations_payments enable row level security;
alter table public.operations_urgent_issues enable row level security;
alter table public.operations_decision_queue enable row level security;
alter table public.operations_daily_reports enable row level security;
alter table public.operations_management_alerts enable row level security;
alter table public.operations_ai_summaries enable row level security;
alter table public.operations_activity_logs enable row level security;



create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  )
  or exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_user_id = auth.uid()
  );
$$;



create policy "Workspace members can read departments"
on public.departments
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert departments"
on public.departments
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update departments"
on public.departments
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read employees"
on public.employees
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert employees"
on public.employees
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update employees"
on public.employees
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read operations_reports"
on public.operations_reports
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert operations_reports"
on public.operations_reports
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update operations_reports"
on public.operations_reports
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read operations_tasks"
on public.operations_tasks
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert operations_tasks"
on public.operations_tasks
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update operations_tasks"
on public.operations_tasks
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read operations_task_updates"
on public.operations_task_updates
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert operations_task_updates"
on public.operations_task_updates
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update operations_task_updates"
on public.operations_task_updates
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read operations_payments"
on public.operations_payments
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert operations_payments"
on public.operations_payments
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update operations_payments"
on public.operations_payments
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read operations_urgent_issues"
on public.operations_urgent_issues
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert operations_urgent_issues"
on public.operations_urgent_issues
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update operations_urgent_issues"
on public.operations_urgent_issues
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read operations_decision_queue"
on public.operations_decision_queue
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert operations_decision_queue"
on public.operations_decision_queue
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update operations_decision_queue"
on public.operations_decision_queue
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read operations_daily_reports"
on public.operations_daily_reports
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert operations_daily_reports"
on public.operations_daily_reports
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update operations_daily_reports"
on public.operations_daily_reports
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read operations_management_alerts"
on public.operations_management_alerts
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert operations_management_alerts"
on public.operations_management_alerts
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update operations_management_alerts"
on public.operations_management_alerts
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read operations_ai_summaries"
on public.operations_ai_summaries
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert operations_ai_summaries"
on public.operations_ai_summaries
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update operations_ai_summaries"
on public.operations_ai_summaries
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can read operations_activity_logs"
on public.operations_activity_logs
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert operations_activity_logs"
on public.operations_activity_logs
for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update operations_activity_logs"
on public.operations_activity_logs
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create table if not exists public.workspace_billing_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  billing_status text not null default 'not_configured',
  billing_mode text not null default 'manual_testing',
  plan_code text not null default 'operations_test',
  base_monthly_amount numeric(14,2),
  per_employee_amount numeric(14,2),
  included_employee_seats integer not null default 1,
  billable_employee_count integer not null default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  billing_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workspace_billing_profiles_workspace_id
on public.workspace_billing_profiles(workspace_id);

alter table public.workspace_billing_profiles enable row level security;

create policy "Workspace members can read billing profile"
on public.workspace_billing_profiles
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "Workspace owners can manage billing profile"
on public.workspace_billing_profiles
for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = workspace_billing_profiles.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = workspace_billing_profiles.workspace_id
      and w.owner_user_id = auth.uid()
  )
);
