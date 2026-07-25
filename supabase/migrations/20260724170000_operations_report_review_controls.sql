-- Controlled daily-report review and approved intelligence materialization.
-- Existing operational records are preserved and never deleted.

alter table public.operations_reports
  add column if not exists review_status text not null default 'submitted',
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text,
  add column if not exists materialized_at timestamptz,
  add column if not exists materialized_by uuid references auth.users(id) on delete set null;

alter table public.operations_reports
  alter column review_status set default 'submitted';

alter table public.operations_reports
  drop constraint if exists operations_reports_reviewed_by_fkey;

alter table public.operations_reports
  add constraint operations_reports_reviewed_by_fkey
  foreign key (reviewed_by)
  references auth.users(id)
  on delete set null;

alter table public.operations_reports
  drop constraint if exists operations_reports_review_status_control_check;

alter table public.operations_reports
  add constraint operations_reports_review_status_control_check
  check (
    review_status in (
      'pending',
      'unreviewed',
      'submitted',
      'supervisor_reviewed',
      'manager_reviewed',
      'reviewed',
      'approved',
      'rejected'
    )
  );

alter table public.operations_reports
  drop constraint if exists operations_reports_review_note_check;

alter table public.operations_reports
  add constraint operations_reports_review_note_check
  check (
    review_note is null
    or char_length(btrim(review_note)) <= 4000
  );

create index if not exists operations_reports_workspace_review_date_idx
  on public.operations_reports (
    workspace_id,
    report_date,
    review_status
  );

create index if not exists operations_reports_materialized_idx
  on public.operations_reports (materialized_at)
  where materialized_at is not null;

-- Preserve legacy extractions. If operational records already exist for a
-- report, record that materialization without altering or recreating them.
update public.operations_reports as report
set
  materialized_at = coalesce(
    report.reviewed_at,
    report.updated_at,
    report.created_at
  ),
  materialized_by = coalesce(
    report.reviewed_by,
    report.created_by
  )
where report.materialized_at is null
  and (
    exists (
      select 1
      from public.operations_tasks as task
      where task.source_report_id = report.id
    )
    or exists (
      select 1
      from public.operations_urgent_issues as issue
      where issue.source_report_id = report.id
    )
    or exists (
      select 1
      from public.operations_decision_queue as decision
      where decision.source_report_id = report.id
    )
  );

create or replace function public.review_operations_report(
  p_report_id uuid,
  p_review_status text,
  p_review_note text,
  p_actor_user_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.operations_reports%rowtype;
  v_updated_report public.operations_reports%rowtype;
  v_task jsonb;
  v_issue jsonb;
  v_decision jsonb;
  v_note text :=
    nullif(btrim(coalesce(p_review_note, '')), '');
  v_now timestamptz := now();
  v_materialized_now boolean := false;
begin
  if p_actor_user_id is null then
    raise exception 'A review actor is required.'
      using errcode = '22023';
  end if;

  if p_review_status not in (
    'supervisor_reviewed',
    'manager_reviewed',
    'approved',
    'rejected'
  ) then
    raise exception 'Unsupported report review status.'
      using errcode = '22023';
  end if;

  if v_note is not null and char_length(v_note) > 4000 then
    raise exception 'Review notes cannot exceed 4000 characters.'
      using errcode = '22023';
  end if;

  select *
  into v_report
  from public.operations_reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'Report not found.'
      using errcode = 'P0002';
  end if;

  if v_report.review_status in ('approved', 'rejected') then
    raise exception 'This report already has a final review decision.'
      using errcode = '23514';
  end if;

  if (
    p_review_status = 'approved'
    and v_report.materialized_at is null
  ) then
    for v_task in
      select item
      from jsonb_array_elements(
        case
          when jsonb_typeof(v_report.ai_extracted -> 'tasks') = 'array'
            then v_report.ai_extracted -> 'tasks'
          else '[]'::jsonb
        end
      ) as extracted(item)
    loop
      if nullif(btrim(v_task ->> 'title'), '') is not null then
        insert into public.operations_tasks (
          workspace_id,
          department_id,
          assigned_employee_id,
          title,
          description,
          status,
          priority,
          source_report_id,
          source_type,
          created_by
        )
        values (
          v_report.workspace_id,
          v_report.department_id,
          null,
          btrim(v_task ->> 'title'),
          nullif(btrim(v_task ->> 'description'), ''),
          'open',
          coalesce(
            nullif(btrim(v_task ->> 'priority'), ''),
            'normal'
          ),
          v_report.id,
          'report_generated',
          p_actor_user_id
        );
      end if;
    end loop;

    for v_issue in
      select item
      from jsonb_array_elements(
        case
          when jsonb_typeof(
            v_report.ai_extracted -> 'urgentIssues'
          ) = 'array'
            then v_report.ai_extracted -> 'urgentIssues'
          else '[]'::jsonb
        end
      ) as extracted(item)
    loop
      if nullif(btrim(v_issue ->> 'title'), '') is not null then
        insert into public.operations_urgent_issues (
          workspace_id,
          department_id,
          employee_id,
          title,
          description,
          severity,
          status,
          source_report_id,
          created_by
        )
        values (
          v_report.workspace_id,
          v_report.department_id,
          v_report.employee_id,
          btrim(v_issue ->> 'title'),
          nullif(btrim(v_issue ->> 'description'), ''),
          coalesce(
            nullif(btrim(v_issue ->> 'severity'), ''),
            'medium'
          ),
          'open',
          v_report.id,
          p_actor_user_id
        );
      end if;
    end loop;

    for v_decision in
      select item
      from jsonb_array_elements(
        case
          when jsonb_typeof(
            v_report.ai_extracted -> 'decisions'
          ) = 'array'
            then v_report.ai_extracted -> 'decisions'
          else '[]'::jsonb
        end
      ) as extracted(item)
    loop
      if nullif(btrim(v_decision ->> 'title'), '') is not null then
        insert into public.operations_decision_queue (
          workspace_id,
          department_id,
          requested_by_employee_id,
          decision_type,
          title,
          description,
          status,
          priority,
          source_report_id,
          created_by
        )
        values (
          v_report.workspace_id,
          v_report.department_id,
          v_report.employee_id,
          coalesce(
            nullif(btrim(v_decision ->> 'decisionType'), ''),
            'general'
          ),
          btrim(v_decision ->> 'title'),
          nullif(btrim(v_decision ->> 'description'), ''),
          'pending',
          coalesce(
            nullif(btrim(v_decision ->> 'priority'), ''),
            'normal'
          ),
          v_report.id,
          p_actor_user_id
        );
      end if;
    end loop;

    v_materialized_now := true;
  end if;

  update public.operations_reports
  set
    review_status = p_review_status,
    reviewed_by = p_actor_user_id,
    reviewed_at = v_now,
    review_note = v_note,
    materialized_at = case
      when p_review_status = 'approved'
        then coalesce(materialized_at, v_now)
      else materialized_at
    end,
    materialized_by = case
      when p_review_status = 'approved'
        then coalesce(materialized_by, p_actor_user_id)
      else materialized_by
    end,
    updated_at = v_now
  where id = p_report_id
  returning *
  into v_updated_report;

  insert into public.operations_activity_logs (
    workspace_id,
    actor_user_id,
    action,
    entity_table,
    entity_id,
    previous_data,
    new_data,
    metadata
  )
  values (
    v_report.workspace_id,
    p_actor_user_id,
    case p_review_status
      when 'approved'
        then 'operations_daily_report.approved'
      when 'rejected'
        then 'operations_daily_report.rejected'
      else 'operations_daily_report.reviewed'
    end,
    'operations_reports',
    p_report_id,
    jsonb_build_object(
      'reviewStatus',
      v_report.review_status,
      'reviewNote',
      v_report.review_note,
      'materializedAt',
      v_report.materialized_at
    ),
    jsonb_build_object(
      'reviewStatus',
      v_updated_report.review_status,
      'reviewNote',
      v_updated_report.review_note,
      'materializedAt',
      v_updated_report.materialized_at
    ),
    coalesce(p_metadata, '{}'::jsonb)
      || jsonb_build_object(
        'materializedNow',
        v_materialized_now
      )
  );

  return jsonb_build_object(
    'id',
    v_updated_report.id,
    'workspaceId',
    v_updated_report.workspace_id,
    'reviewStatus',
    v_updated_report.review_status,
    'reviewedBy',
    v_updated_report.reviewed_by,
    'reviewedAt',
    v_updated_report.reviewed_at,
    'reviewNote',
    v_updated_report.review_note,
    'materializedAt',
    v_updated_report.materialized_at,
    'materializedNow',
    v_materialized_now,
    'updatedAt',
    v_updated_report.updated_at
  );
end;
$$;

revoke all
on function public.review_operations_report(
  uuid,
  text,
  text,
  uuid,
  jsonb
)
from public;

revoke execute
on function public.review_operations_report(
  uuid,
  text,
  text,
  uuid,
  jsonb
)
from anon, authenticated;

grant execute
on function public.review_operations_report(
  uuid,
  text,
  text,
  uuid,
  jsonb
)
to service_role;