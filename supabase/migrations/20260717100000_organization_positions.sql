create table if not exists public.organization_positions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  reports_to_position_id uuid references public.organization_positions(id) on delete set null,
  assigned_employee_id uuid references public.employees(id) on delete set null,

  title text not null check (
    nullif(btrim(title), '') is not null
    and char_length(btrim(title)) <= 160
  ),
  system_key text,
  position_type text not null default 'custom' check (
    position_type in (
      'executive',
      'director',
      'manager',
      'supervisor',
      'individual_contributor',
      'custom'
    )
  ),
  access_role text check (
    access_role is null
    or access_role in (
      'owner',
      'director',
      'senior_manager',
      'department_manager',
      'supervisor',
      'employee'
    )
  ),

  is_leadership boolean not null default false,
  status text not null default 'active' check (
    status in ('active', 'archived')
  ),
  sort_order integer not null default 0 check (
    sort_order >= 0
  ),

  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    reports_to_position_id is null
    or reports_to_position_id <> id
  )
);

create index if not exists organization_positions_workspace_status_idx
  on public.organization_positions (workspace_id, status);

create index if not exists organization_positions_department_idx
  on public.organization_positions (department_id);

create index if not exists organization_positions_assigned_employee_idx
  on public.organization_positions (assigned_employee_id);

create index if not exists organization_positions_reports_to_idx
  on public.organization_positions (reports_to_position_id);

create unique index if not exists organization_positions_system_key_idx
  on public.organization_positions (workspace_id, system_key)
  where system_key is not null;

alter table public.organization_positions enable row level security;

create or replace function public.validate_organization_position_links()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.department_id is not null
     and not exists (
       select 1
       from public.departments d
       where d.id = new.department_id
         and d.workspace_id = new.workspace_id
     ) then
    raise exception using
      errcode = '23503',
      message = 'Position department must belong to the same workspace.';
  end if;

  if new.assigned_employee_id is not null
     and not exists (
       select 1
       from public.employees e
       where e.id = new.assigned_employee_id
         and e.workspace_id = new.workspace_id
     ) then
    raise exception using
      errcode = '23503',
      message = 'Assigned employee must belong to the same workspace.';
  end if;

  if new.reports_to_position_id is not null
     and not exists (
       select 1
       from public.organization_positions parent
       where parent.id = new.reports_to_position_id
         and parent.workspace_id = new.workspace_id
     ) then
    raise exception using
      errcode = '23503',
      message = 'Parent position must belong to the same workspace.';
  end if;

  if new.reports_to_position_id is not null
     and exists (
       with recursive position_chain as (
         select
           position.id,
           position.reports_to_position_id
         from public.organization_positions position
         where position.id = new.reports_to_position_id

         union

         select
           parent.id,
           parent.reports_to_position_id
         from public.organization_positions parent
         join position_chain child
           on parent.id = child.reports_to_position_id
       )
       select 1
       from position_chain
       where id = new.id
     ) then
    raise exception using
      errcode = '23514',
      message = 'A reporting hierarchy cannot contain a cycle.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_organization_position_links_trigger
  on public.organization_positions;

create trigger validate_organization_position_links_trigger
before insert or update of
  workspace_id,
  department_id,
  reports_to_position_id,
  assigned_employee_id
on public.organization_positions
for each row
execute function public.validate_organization_position_links();

create or replace function public.sync_daily_leader_position()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  v_title := case new.daily_leader_role
    when 'ceo' then 'CEO'
    when 'managing_director' then 'Managing Director'
    when 'president' then 'President'
    when 'founder' then 'Founder'
    else 'Company Executive'
  end;

  insert into public.organization_positions (
    workspace_id,
    title,
    system_key,
    position_type,
    access_role,
    is_leadership,
    status,
    sort_order,
    created_by,
    updated_by
  )
  values (
    new.workspace_id,
    v_title,
    'daily_leader',
    'executive',
    'director',
    true,
    'active',
    10,
    coalesce(new.updated_by, new.created_by),
    coalesce(new.updated_by, new.created_by)
  )
  on conflict (workspace_id, system_key)
  where system_key is not null
  do update set
    title = excluded.title,
    position_type = 'executive',
    access_role = 'director',
    is_leadership = true,
    status = 'active',
    sort_order = 10,
    updated_by = coalesce(
      excluded.updated_by,
      public.organization_positions.updated_by
    ),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_daily_leader_position_trigger
  on public.workspace_organization_profiles;

create trigger sync_daily_leader_position_trigger
after insert or update of daily_leader_role
on public.workspace_organization_profiles
for each row
when (new.setup_status = 'completed')
execute function public.sync_daily_leader_position();

insert into public.organization_positions (
  workspace_id,
  title,
  system_key,
  position_type,
  access_role,
  is_leadership,
  status,
  sort_order,
  created_by,
  updated_by
)
select
  profile.workspace_id,
  case profile.daily_leader_role
    when 'ceo' then 'CEO'
    when 'managing_director' then 'Managing Director'
    when 'president' then 'President'
    when 'founder' then 'Founder'
    else 'Company Executive'
  end,
  'daily_leader',
  'executive',
  'director',
  true,
  'active',
  10,
  coalesce(profile.updated_by, profile.created_by),
  coalesce(profile.updated_by, profile.created_by)
from public.workspace_organization_profiles profile
where profile.setup_status = 'completed'
on conflict (workspace_id, system_key)
where system_key is not null
do update set
  title = excluded.title,
  position_type = 'executive',
  access_role = 'director',
  is_leadership = true,
  status = 'active',
  sort_order = 10,
  updated_by = coalesce(
    excluded.updated_by,
    public.organization_positions.updated_by
  ),
  updated_at = now();

comment on table public.organization_positions is
  'Workspace-scoped organizational positions supporting leadership, hierarchy, employee assignment and future permission generation.';

comment on column public.organization_positions.system_key is
  'Stable key for system-managed positions such as the company daily leader.';