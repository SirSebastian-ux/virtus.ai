-- Operations task workflow
-- Adds controlled assignment, employee submission, manager review,
-- permanent task conversation history, and evidence support.

-- Restore the workspace-access helper when historical schema drift
-- has removed it from an environment.
create or replace function public.is_workspace_member(
  target_workspace_id uuid
)
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
-- Restore the task-update history table when historical schema drift
-- has removed it from an environment.
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

alter table public.operations_task_updates enable row level security;

drop policy if exists "Workspace members can read operations_task_updates"
  on public.operations_task_updates;

drop policy if exists "Workspace members can insert operations_task_updates"
  on public.operations_task_updates;

drop policy if exists "Workspace members can update operations_task_updates"
  on public.operations_task_updates;

create policy "Workspace members can read operations_task_updates"
on public.operations_task_updates
for select
to authenticated
using (public.is_workspace_member(workspace_id));
alter table public.operations_tasks
  add column if not exists source_type text not null default 'report_generated',
  add column if not exists assigned_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists assigned_by_employee_id uuid references public.employees(id) on delete set null,
  add column if not exists assigned_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_by_employee_id uuid references public.employees(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists completed_at timestamptz;

update public.operations_tasks
set
  source_type = case
    when source_report_id is not null then 'report_generated'
    else 'manual'
  end,
  assigned_by_user_id = coalesce(assigned_by_user_id, created_by),
  assigned_at = case
    when assigned_employee_id is not null then coalesce(assigned_at, created_at)
    else assigned_at
  end,
  completed_at = case
    when status = 'completed' then coalesce(completed_at, updated_at, created_at)
    else completed_at
  end;

alter table public.operations_tasks
  drop constraint if exists operations_tasks_status_check;

alter table public.operations_tasks
  drop constraint if exists operations_tasks_workflow_status_check;

alter table public.operations_tasks
  add constraint operations_tasks_workflow_status_check
  check (
    status in (
      'open',
      'assigned',
      'in_progress',
      'blocked',
      'submitted_for_review',
      'changes_requested',
      'completed',
      'cancelled'
    )
  );

alter table public.operations_tasks
  drop constraint if exists operations_tasks_source_type_check;

alter table public.operations_tasks
  add constraint operations_tasks_source_type_check
  check (
    source_type in (
      'manual',
      'report_generated'
    )
  );

alter table public.operations_task_updates
  add column if not exists event_type text not null default 'comment',
  add column if not exists actor_employee_id uuid references public.employees(id) on delete set null,
  add column if not exists previous_status text,
  add column if not exists new_status text,
  add column if not exists evidence jsonb not null default '[]'::jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.operations_task_updates
  drop constraint if exists operations_task_updates_event_type_check;

alter table public.operations_task_updates
  add constraint operations_task_updates_event_type_check
  check (
    event_type in (
      'assignment',
      'acknowledgement',
      'comment',
      'progress_update',
      'status_change',
      'blocked',
      'submission',
      'changes_requested',
      'approval',
      'reopened',
      'cancelled'
    )
  );

alter table public.operations_task_updates
  drop constraint if exists operations_task_updates_evidence_check;

alter table public.operations_task_updates
  add constraint operations_task_updates_evidence_check
  check (jsonb_typeof(evidence) = 'array');

-- Task history must not disappear when a task is deleted.
-- Report re-extraction will be changed to preserve task records.
alter table public.operations_task_updates
  drop constraint if exists operations_task_updates_task_id_fkey;

alter table public.operations_task_updates
  add constraint operations_task_updates_task_id_fkey
  foreign key (task_id)
  references public.operations_tasks(id)
  on delete restrict;

create index if not exists operations_tasks_workspace_status_idx
  on public.operations_tasks (workspace_id, status);

create index if not exists operations_tasks_assigned_employee_status_idx
  on public.operations_tasks (assigned_employee_id, status);

create index if not exists operations_tasks_assigned_by_employee_idx
  on public.operations_tasks (assigned_by_employee_id);

create index if not exists operations_tasks_source_report_idx
  on public.operations_tasks (source_report_id);

create index if not exists operations_task_updates_task_created_idx
  on public.operations_task_updates (task_id, created_at);

create index if not exists operations_task_updates_actor_employee_idx
  on public.operations_task_updates (actor_employee_id);
