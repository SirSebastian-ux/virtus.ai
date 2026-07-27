-- Separate company position identity from operational authority and scope.
-- Existing migrations remain immutable.

alter table public.workspace_organization_profiles
  add column if not exists daily_leader_access_role text
  not null default 'director';

alter table public.workspace_organization_profiles
  drop constraint if exists
    workspace_organization_profiles_daily_leader_access_role_check;

alter table public.workspace_organization_profiles
  add constraint
    workspace_organization_profiles_daily_leader_access_role_check
  check (
    daily_leader_access_role in (
      'owner',
      'director',
      'senior_manager',
      'department_manager',
      'supervisor',
      'employee'
    )
  );

alter table public.organization_positions
  add column if not exists access_scope_type text
  not null default 'self';

alter table public.organization_positions
  drop constraint if exists
    organization_positions_access_scope_type_check;

alter table public.organization_positions
  add constraint organization_positions_access_scope_type_check
  check (
    access_scope_type in (
      'company',
      'department',
      'team',
      'self'
    )
  );

update public.organization_positions
set access_scope_type = case access_role
  when 'owner' then 'company'
  when 'director' then 'company'
  when 'senior_manager' then 'company'
  when 'department_manager' then 'department'
  when 'supervisor' then 'team'
  else 'self'
end
where access_scope_type = 'self'
  and access_role is not null;

update public.workspace_organization_profiles profile
set
  daily_leader_access_role = position.access_role,
  updated_at = now()
from public.organization_positions position
where position.workspace_id = profile.workspace_id
  and position.system_key = 'daily_leader'
  and position.access_role is not null
  and profile.daily_leader_access_role
    is distinct from position.access_role;

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
    access_scope_type,
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
    new.daily_leader_access_role,
    'company',
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
    access_role = excluded.access_role,
    access_scope_type = 'company',
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
after insert or update of
  daily_leader_role,
  daily_leader_access_role,
  setup_status
on public.workspace_organization_profiles
for each row
when (new.setup_status = 'completed')
execute function public.sync_daily_leader_position();

create or replace function public.complete_workspace_organization_setup(
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_company_name text,
  p_profile jsonb,
  p_departments text[],
  p_daily_leader_access_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_access_role text;
begin
  v_access_role := lower(
    btrim(
      coalesce(
        p_daily_leader_access_role,
        ''
      )
    )
  );

  if v_access_role not in (
    'owner',
    'director',
    'senior_manager',
    'department_manager',
    'supervisor',
    'employee'
  ) then
    raise exception using
      errcode = '22023',
      message = 'Invalid daily leader authority role.';
  end if;

  v_result :=
    public.complete_workspace_organization_setup(
      p_workspace_id,
      p_actor_user_id,
      p_company_name,
      p_profile,
      p_departments
    );

  update public.workspace_organization_profiles
  set
    daily_leader_access_role = v_access_role,
    updated_by = p_actor_user_id,
    updated_at = now()
  where workspace_id = p_workspace_id;

  return v_result || jsonb_build_object(
    'dailyLeaderAccessRole',
    v_access_role
  );
end;
$$;

revoke all on function
  public.complete_workspace_organization_setup(
    uuid,
    uuid,
    text,
    jsonb,
    text[],
    text
  )
from public, anon, authenticated;

grant execute on function
  public.complete_workspace_organization_setup(
    uuid,
    uuid,
    text,
    jsonb,
    text[],
    text
  )
to service_role;

create or replace function public.save_organization_position(
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_position_id uuid,
  p_title text,
  p_position_type text,
  p_access_role text,
  p_access_scope_type text,
  p_department_id uuid,
  p_reports_to_position_id uuid,
  p_assigned_employee_id uuid,
  p_is_leadership boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_workspace public.workspaces%rowtype;
  v_current_position public.organization_positions%rowtype;
  v_saved_position public.organization_positions%rowtype;
  v_employee public.employees%rowtype;
  v_previous_employee public.employees%rowtype;
  v_manager_employee_id uuid;
  v_manager_user_id uuid;
  v_previous_membership_role text;
  v_title text;
  v_position_type text;
  v_access_role text;
  v_scope_type text;
  v_now timestamptz := now();
  v_sort_order integer;
  v_previous_data jsonb;
  v_has_other_position boolean;
  v_previous_is_owner boolean;
begin
  if p_workspace_id is null or p_actor_user_id is null then
    raise exception using
      errcode = '22023',
      message = 'workspaceId and actorUserId are required.';
  end if;

  select *
  into v_workspace
  from public.workspaces
  where id = p_workspace_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Workspace not found.';
  end if;

  if v_workspace.status in ('archived', 'deleted') then
    raise exception using
      errcode = 'P0001',
      message = 'Cannot modify an archived or deleted workspace.',
      detail = 'WORKSPACE_READ_ONLY';
  end if;

  if v_workspace.owner_user_id <> p_actor_user_id
     and not exists (
       select 1
       from public.workspace_members member
       where member.workspace_id = p_workspace_id
         and member.user_id = p_actor_user_id
         and member.role = 'owner'
         and member.status = 'active'
     ) then
    raise exception using
      errcode = '42501',
      message = 'Owner access required.';
  end if;

  v_title := btrim(coalesce(p_title, ''));
  v_position_type := lower(btrim(coalesce(p_position_type, '')));
  v_access_role := lower(btrim(coalesce(p_access_role, '')));
  v_scope_type := lower(btrim(coalesce(p_access_scope_type, '')));

  if v_title = '' or char_length(v_title) > 160 then
    raise exception using
      errcode = '22023',
      message = 'Position title is required and cannot exceed 160 characters.';
  end if;

  if v_position_type not in (
    'executive',
    'director',
    'manager',
    'supervisor',
    'individual_contributor',
    'custom'
  ) then
    raise exception using
      errcode = '22023',
      message = 'Invalid position type.';
  end if;

  if v_access_role not in (
    'owner',
    'director',
    'senior_manager',
    'department_manager',
    'supervisor',
    'employee'
  ) then
    raise exception using
      errcode = '22023',
      message = 'Invalid authority role.';
  end if;

  if v_scope_type not in (
    'company',
    'department',
    'team',
    'self'
  ) then
    raise exception using
      errcode = '22023',
      message = 'Invalid authority scope.';
  end if;

  if v_access_role = 'department_manager'
     and p_department_id is null then
    raise exception using
      errcode = '22023',
      message = 'A department manager position requires a department.';
  end if;

  if p_department_id is not null
     and not exists (
       select 1
       from public.departments department
       where department.id = p_department_id
         and department.workspace_id = p_workspace_id
         and department.status = 'active'
     ) then
    raise exception using
      errcode = '23503',
      message = 'Position department is not available.';
  end if;

  if p_reports_to_position_id is not null
     and not exists (
       select 1
       from public.organization_positions parent
       where parent.id = p_reports_to_position_id
         and parent.workspace_id = p_workspace_id
         and parent.status = 'active'
     ) then
    raise exception using
      errcode = '23503',
      message = 'Reporting position is not available.';
  end if;

  if p_assigned_employee_id is not null then
    select *
    into v_employee
    from public.employees employee
    where employee.id = p_assigned_employee_id
      and employee.workspace_id = p_workspace_id
      and employee.employment_status = 'active'
    for update;

    if not found then
      raise exception using
        errcode = '23503',
        message = 'Assigned employee is not available.';
    end if;

    if exists (
      select 1
      from public.organization_positions position
      where position.workspace_id = p_workspace_id
        and position.status = 'active'
        and position.assigned_employee_id = p_assigned_employee_id
        and position.id <> coalesce(
          p_position_id,
          '00000000-0000-0000-0000-000000000000'::uuid
        )
    ) then
      raise exception using
        errcode = '23505',
        message = 'This employee already occupies another active position.';
    end if;

    if v_employee.user_id = v_workspace.owner_user_id
       and v_access_role <> 'owner' then
      raise exception using
        errcode = '22023',
        message = 'The workspace owner must retain owner authority.';
    end if;

    select member.role
    into v_previous_membership_role
    from public.workspace_members member
    where member.workspace_id = p_workspace_id
      and member.user_id = v_employee.user_id
      and member.status = 'active';

    if v_previous_membership_role = 'owner'
       and v_access_role <> 'owner' then
      raise exception using
        errcode = '22023',
        message = 'An active owner must retain owner authority.';
    end if;
  end if;

  if exists (
    select 1
    from public.organization_positions position
    where position.workspace_id = p_workspace_id
      and position.status = 'active'
      and lower(btrim(position.title)) = lower(v_title)
      and position.department_id is not distinct from p_department_id
      and position.id <> coalesce(
        p_position_id,
        '00000000-0000-0000-0000-000000000000'::uuid
      )
  ) then
    raise exception using
      errcode = '23505',
      message = 'This active position already exists.';
  end if;

  if p_position_id is not null then
    select *
    into v_current_position
    from public.organization_positions position
    where position.id = p_position_id
      and position.workspace_id = p_workspace_id
      and position.status = 'active'
    for update;

    if not found then
      raise exception using
        errcode = 'P0002',
        message = 'Active position not found.';
    end if;

    v_previous_data := to_jsonb(v_current_position);

    if p_reports_to_position_id = p_position_id then
      raise exception using
        errcode = '23514',
        message = 'A position cannot report to itself.';
    end if;

    if v_current_position.assigned_employee_id is not null then
      select *
      into v_previous_employee
      from public.employees employee
      where employee.id = v_current_position.assigned_employee_id
      for update;
    end if;

    if v_current_position.access_role = 'department_manager'
       and v_current_position.department_id is not null
       and v_previous_employee.user_id is not null
       and (
         v_current_position.department_id
           is distinct from p_department_id
         or v_current_position.assigned_employee_id
           is distinct from p_assigned_employee_id
         or v_access_role <> 'department_manager'
       ) then
      update public.departments
      set
        manager_user_id = null,
        updated_at = v_now
      where id = v_current_position.department_id
        and workspace_id = p_workspace_id
        and manager_user_id = v_previous_employee.user_id;
    end if;

    update public.organization_positions
    set
      department_id = p_department_id,
      reports_to_position_id = p_reports_to_position_id,
      assigned_employee_id = p_assigned_employee_id,
      title = v_title,
      position_type = v_position_type,
      access_role = v_access_role,
      access_scope_type = v_scope_type,
      is_leadership = coalesce(p_is_leadership, false),
      updated_by = p_actor_user_id,
      updated_at = v_now
    where id = p_position_id
      and workspace_id = p_workspace_id
    returning *
    into v_saved_position;
  else
    select coalesce(max(position.sort_order), 0) + 10
    into v_sort_order
    from public.organization_positions position
    where position.workspace_id = p_workspace_id;

    insert into public.organization_positions (
      workspace_id,
      department_id,
      reports_to_position_id,
      assigned_employee_id,
      title,
      position_type,
      access_role,
      access_scope_type,
      is_leadership,
      status,
      sort_order,
      created_by,
      updated_by
    )
    values (
      p_workspace_id,
      p_department_id,
      p_reports_to_position_id,
      p_assigned_employee_id,
      v_title,
      v_position_type,
      v_access_role,
      v_scope_type,
      coalesce(p_is_leadership, false),
      'active',
      v_sort_order,
      p_actor_user_id,
      p_actor_user_id
    )
    returning *
    into v_saved_position;
  end if;

  if v_previous_employee.id is not null
     and v_previous_employee.id
       is distinct from p_assigned_employee_id then
    select exists (
      select 1
      from public.organization_positions position
      where position.workspace_id = p_workspace_id
        and position.status = 'active'
        and position.assigned_employee_id = v_previous_employee.id
    )
    into v_has_other_position;

    if not v_has_other_position then
      update public.employees
      set
        department_id = null,
        manager_user_id = null,
        position_title = null,
        updated_at = v_now
      where id = v_previous_employee.id;

      if v_previous_employee.user_id is not null then
        select
          (
            v_previous_employee.user_id = v_workspace.owner_user_id
            or exists (
              select 1
              from public.workspace_members member
              where member.workspace_id = p_workspace_id
                and member.user_id = v_previous_employee.user_id
                and member.role = 'owner'
                and member.status = 'active'
            )
          )
        into v_previous_is_owner;

        if v_previous_is_owner then
          insert into public.workspace_members (
            workspace_id,
            user_id,
            role,
            status,
            invited_by,
            joined_at
          )
          values (
            p_workspace_id,
            v_previous_employee.user_id,
            'owner',
            'active',
            p_actor_user_id,
            v_now
          )
          on conflict (workspace_id, user_id)
          do update set
            role = 'owner',
            status = 'active',
            invited_by = coalesce(
              public.workspace_members.invited_by,
              excluded.invited_by
            ),
            joined_at = coalesce(
              public.workspace_members.joined_at,
              excluded.joined_at
            ),
            updated_at = v_now;

          update public.operations_role_assignments
          set
            status = 'revoked',
            updated_at = v_now
          where workspace_id = p_workspace_id
            and employee_id = v_previous_employee.id
            and status = 'active'
            and role <> 'owner';

          insert into public.operations_role_assignments (
            workspace_id,
            user_id,
            employee_id,
            role,
            department_id,
            reports_to_employee_id,
            scope_type,
            status,
            created_by,
            approved_by,
            approved_at
          )
          values (
            p_workspace_id,
            v_previous_employee.user_id,
            v_previous_employee.id,
            'owner',
            null,
            null,
            'company',
            'active',
            p_actor_user_id,
            p_actor_user_id,
            v_now
          )
          on conflict (
            workspace_id,
            user_id,
            employee_id,
            role
          )
          do update set
            department_id = null,
            reports_to_employee_id = null,
            scope_type = 'company',
            status = 'active',
            approved_by = excluded.approved_by,
            approved_at = excluded.approved_at,
            updated_at = v_now;
        else
          insert into public.workspace_members (
            workspace_id,
            user_id,
            role,
            status,
            invited_by,
            joined_at
          )
          values (
            p_workspace_id,
            v_previous_employee.user_id,
            'employee',
            'active',
            p_actor_user_id,
            v_now
          )
          on conflict (workspace_id, user_id)
          do update set
            role = 'employee',
            status = 'active',
            invited_by = coalesce(
              public.workspace_members.invited_by,
              excluded.invited_by
            ),
            joined_at = coalesce(
              public.workspace_members.joined_at,
              excluded.joined_at
            ),
            updated_at = v_now;

          update public.operations_role_assignments
          set
            status = 'revoked',
            updated_at = v_now
          where workspace_id = p_workspace_id
            and employee_id = v_previous_employee.id
            and status = 'active';

          insert into public.operations_role_assignments (
            workspace_id,
            user_id,
            employee_id,
            role,
            department_id,
            reports_to_employee_id,
            scope_type,
            status,
            created_by,
            approved_by,
            approved_at
          )
          values (
            p_workspace_id,
            v_previous_employee.user_id,
            v_previous_employee.id,
            'employee',
            null,
            null,
            'self',
            'active',
            p_actor_user_id,
            p_actor_user_id,
            v_now
          )
          on conflict (
            workspace_id,
            user_id,
            employee_id,
            role
          )
          do update set
            department_id = null,
            reports_to_employee_id = null,
            scope_type = 'self',
            status = 'active',
            approved_by = excluded.approved_by,
            approved_at = excluded.approved_at,
            updated_at = v_now;
        end if;
      end if;
    end if;
  end if;

  if p_assigned_employee_id is not null then
    select parent.assigned_employee_id
    into v_manager_employee_id
    from public.organization_positions parent
    where parent.id = p_reports_to_position_id
      and parent.workspace_id = p_workspace_id
      and parent.status = 'active';

    if v_manager_employee_id is not null then
      select employee.user_id
      into v_manager_user_id
      from public.employees employee
      where employee.id = v_manager_employee_id
        and employee.workspace_id = p_workspace_id
        and employee.employment_status = 'active';
    end if;

    update public.employees
    set
      department_id = p_department_id,
      manager_user_id = v_manager_user_id,
      position_title = v_title,
      updated_at = v_now
    where id = p_assigned_employee_id
      and workspace_id = p_workspace_id
    returning *
    into v_employee;

    if v_employee.user_id is not null then
      insert into public.workspace_members (
        workspace_id,
        user_id,
        role,
        status,
        invited_by,
        joined_at
      )
      values (
        p_workspace_id,
        v_employee.user_id,
        v_access_role,
        'active',
        p_actor_user_id,
        v_now
      )
      on conflict (workspace_id, user_id)
      do update set
        role = excluded.role,
        status = 'active',
        invited_by = coalesce(
          public.workspace_members.invited_by,
          excluded.invited_by
        ),
        joined_at = coalesce(
          public.workspace_members.joined_at,
          excluded.joined_at
        ),
        updated_at = v_now;

      update public.operations_role_assignments
      set
        status = 'revoked',
        updated_at = v_now
      where workspace_id = p_workspace_id
        and (
          employee_id = v_employee.id
          or user_id = v_employee.user_id
        )
        and status = 'active'
        and role <> v_access_role;

      insert into public.operations_role_assignments (
        workspace_id,
        user_id,
        employee_id,
        role,
        department_id,
        reports_to_employee_id,
        scope_type,
        status,
        created_by,
        approved_by,
        approved_at
      )
      values (
        p_workspace_id,
        v_employee.user_id,
        v_employee.id,
        v_access_role,
        p_department_id,
        v_manager_employee_id,
        v_scope_type,
        'active',
        p_actor_user_id,
        p_actor_user_id,
        v_now
      )
      on conflict (
        workspace_id,
        user_id,
        employee_id,
        role
      )
      do update set
        department_id = excluded.department_id,
        reports_to_employee_id = excluded.reports_to_employee_id,
        scope_type = excluded.scope_type,
        status = 'active',
        approved_by = excluded.approved_by,
        approved_at = excluded.approved_at,
        updated_at = v_now;
    end if;

    if v_access_role = 'department_manager'
       and p_department_id is not null
       and v_employee.user_id is not null then
      update public.departments
      set
        manager_user_id = v_employee.user_id,
        updated_at = v_now
      where id = p_department_id
        and workspace_id = p_workspace_id
        and status = 'active';
    end if;
  end if;

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
    p_workspace_id,
    p_actor_user_id,
    case
      when p_position_id is null
        then 'organization_position.created'
      else 'organization_position.updated'
    end,
    'organization_positions',
    v_saved_position.id,
    v_previous_data,
    to_jsonb(v_saved_position),
    jsonb_build_object(
      'source',
      'save_organization_position',
      'assignedEmployeeId',
      p_assigned_employee_id,
      'accessRole',
      v_access_role,
      'accessScopeType',
      v_scope_type
    )
  );

  return jsonb_build_object(
    'workspaceId',
    p_workspace_id,
    'positionId',
    v_saved_position.id,
    'assignedEmployeeId',
    v_saved_position.assigned_employee_id,
    'accessRole',
    v_saved_position.access_role,
    'accessScopeType',
    v_saved_position.access_scope_type
  );
end;
$$;

revoke all on function public.save_organization_position(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  uuid,
  boolean
)
from public, anon, authenticated;

grant execute on function public.save_organization_position(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  uuid,
  boolean
)
to service_role;

comment on column
  public.workspace_organization_profiles.daily_leader_access_role
is
  'Independent operational authority assigned to the company daily-leader position.';

comment on column public.organization_positions.access_scope_type
is
  'Operational permission scope generated when an employee occupies this position.';

comment on function public.save_organization_position(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  uuid,
  boolean
)
is
  'Owner-authorized transactional organization-position create/update and assignment synchronization.';
