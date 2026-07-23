-- Virtus AI Operations Intelligence
-- Exact task deadlines, controlled extensions, and deadline audit trail.

begin;

-- Keep the legacy due_date temporarily for compatibility.
-- due_at becomes the authoritative exact deadline.
alter table public.operations_tasks
  add column if not exists due_at timestamptz,
  add column if not exists original_due_at timestamptz,
  add column if not exists deadline_extension_count integer not null default 0,
  add column if not exists deadline_last_changed_at timestamptz,
  add column if not exists deadline_last_changed_by_user_id uuid
    references auth.users(id) on delete set null,
  add column if not exists deadline_last_changed_by_employee_id uuid
    references public.employees(id) on delete set null;

-- Preserve existing date-only deadlines as end-of-day Maputo deadlines.
update public.operations_tasks
set
  due_at = (due_date + time '23:59:59') at time zone 'Africa/Maputo',
  deadline_last_changed_at = coalesce(updated_at, created_at, now())
where due_at is null
  and due_date is not null;

update public.operations_tasks
set original_due_at = due_at
where original_due_at is null
  and due_at is not null;

alter table public.operations_tasks
  drop constraint if exists operations_tasks_deadline_extension_count_check;

alter table public.operations_tasks
  add constraint operations_tasks_deadline_extension_count_check
  check (deadline_extension_count >= 0);

create index if not exists operations_tasks_workspace_due_at_idx
  on public.operations_tasks (workspace_id, due_at)
  where due_at is not null
    and status not in ('completed', 'cancelled');

-- Every extension request keeps the original and proposed deadline,
-- the reason, requester, management decision, and review evidence.
create table if not exists public.operations_task_deadline_extensions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,
  task_id uuid not null
    references public.operations_tasks(id) on delete cascade,
  task_title text not null,
  previous_due_at timestamptz not null,
  requested_due_at timestamptz not null,
  reason text not null,
  status text not null default 'pending',
  requested_by_user_id uuid
    references auth.users(id) on delete set null,
  requested_by_employee_id uuid
    references public.employees(id) on delete set null,
  reviewed_by_user_id uuid
    references auth.users(id) on delete set null,
  reviewed_by_employee_id uuid
    references public.employees(id) on delete set null,
  review_note text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint operations_task_deadline_extensions_status_check
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),

  constraint operations_task_deadline_extensions_reason_check
    check (char_length(btrim(reason)) between 5 and 4000),

  constraint operations_task_deadline_extensions_review_note_check
    check (
      review_note is null
      or char_length(btrim(review_note)) <= 4000
    ),

  constraint operations_task_deadline_extensions_time_check
    check (requested_due_at > previous_due_at),

  constraint operations_task_deadline_extensions_review_check
    check (
      (status = 'pending' and reviewed_at is null)
      or
      (status in ('approved', 'rejected') and reviewed_at is not null)
      or
      status = 'cancelled'
    )
);

create index if not exists operations_task_deadline_extensions_task_idx
  on public.operations_task_deadline_extensions (task_id, created_at desc);

create index if not exists operations_task_deadline_extensions_workspace_status_idx
  on public.operations_task_deadline_extensions
    (workspace_id, status, created_at desc);

create unique index if not exists
  operations_task_deadline_extensions_one_pending_idx
  on public.operations_task_deadline_extensions (task_id)
  where status = 'pending'
    and task_id is not null;

alter table public.operations_task_deadline_extensions
  enable row level security;

-- Intentionally no authenticated write policies.
-- Deadline-extension access is controlled by the Operations Tasks API,
-- which validates membership, role, scope, and task authority before
-- using the server-side administrative database client.

create or replace function
public.validate_operations_task_deadline_extension()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.operations_tasks task
    where task.id = new.task_id
      and task.workspace_id = new.workspace_id
  ) then
    raise exception using
      errcode = '23503',
      message = 'Deadline extension task must belong to the same workspace.';
  end if;

  new.updated_at = now();

  return new;
end;
$$;

drop trigger if exists
validate_operations_task_deadline_extension_trigger
on public.operations_task_deadline_extensions;

create trigger validate_operations_task_deadline_extension_trigger
before insert or update
on public.operations_task_deadline_extensions
for each row
execute function public.validate_operations_task_deadline_extension();

-- Expand the controlled task-history event vocabulary.
-- This also repairs the missing reassignment event already used by the API.
alter table public.operations_task_updates
  drop constraint if exists operations_task_updates_event_type_check;

alter table public.operations_task_updates
  add constraint operations_task_updates_event_type_check
  check (
    event_type in (
      'assignment',
      'reassignment',
      'acknowledgement',
      'comment',
      'progress_update',
      'status_change',
      'blocked',
      'submission',
      'changes_requested',
      'approval',
      'reopened',
      'cancelled',
      'deadline_set',
      'deadline_extension_requested',
      'deadline_extension_approved',
      'deadline_extension_rejected',
      'deadline_extension_cancelled'
    )
  );

comment on column public.operations_tasks.due_at is
  'Authoritative exact task deadline stored as timestamptz.';

comment on column public.operations_tasks.original_due_at is
  'First officially confirmed deadline; never replaced by an extension.';

comment on table public.operations_task_deadline_extensions is
  'Auditable employee deadline-extension requests and management decisions.';

commit;