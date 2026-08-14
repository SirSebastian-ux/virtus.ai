-- Virtus AI Operations Intelligence
-- Hierarchical task review routing and Owner final verification.

begin;

alter table public.operations_tasks
  add column if not exists current_reviewer_employee_id uuid
    references public.employees(id) on delete set null,
  add column if not exists review_step_count integer not null default 0,
  add column if not exists final_verified_by_user_id uuid
    references auth.users(id) on delete set null,
  add column if not exists final_verified_by_employee_id uuid
    references public.employees(id) on delete set null,
  add column if not exists final_verified_at timestamptz;

alter table public.operations_tasks
  drop constraint if exists operations_tasks_review_step_count_check;

alter table public.operations_tasks
  add constraint operations_tasks_review_step_count_check
  check (review_step_count >= 0);

create index if not exists operations_tasks_current_reviewer_status_idx
  on public.operations_tasks
    (current_reviewer_employee_id, status, updated_at desc)
  where current_reviewer_employee_id is not null;

-- Backfill work already awaiting review. Prefer the assignee's direct
-- reporting line and fall back to the active workspace Owner.
update public.operations_tasks as task
set current_reviewer_employee_id = coalesce(
  (
    select assignment.reports_to_employee_id
    from public.operations_role_assignments as assignment
    where assignment.workspace_id = task.workspace_id
      and assignment.employee_id = task.assigned_employee_id
      and assignment.status = 'active'
      and assignment.reports_to_employee_id is not null
    order by
      case assignment.role
        when 'owner' then 5
        when 'director' then 4
        when 'senior_manager' then 3
        when 'department_manager' then 2
        when 'supervisor' then 1
        when 'employee' then 0
        else -1
      end desc,
      assignment.created_at desc
    limit 1
  ),
  (
    select owner_assignment.employee_id
    from public.operations_role_assignments as owner_assignment
    where owner_assignment.workspace_id = task.workspace_id
      and owner_assignment.role = 'owner'
      and owner_assignment.status = 'active'
      and owner_assignment.employee_id is not null
    order by owner_assignment.created_at asc
    limit 1
  )
)
where task.status = 'submitted_for_review'
  and task.current_reviewer_employee_id is null;

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
      'review_approved',
      'final_verification',
      'reopened',
      'cancelled',
      'deadline_set',
      'deadline_extension_requested',
      'deadline_extension_approved',
      'deadline_extension_rejected',
      'deadline_extension_cancelled'
    )
  );

comment on column public.operations_tasks.current_reviewer_employee_id is
  'Employee responsible for the current management review step.';

comment on column public.operations_tasks.review_step_count is
  'Number of management review approvals completed since submission.';

comment on column public.operations_tasks.final_verified_at is
  'Time the Owner performed final verification and completed the task.';

commit;
