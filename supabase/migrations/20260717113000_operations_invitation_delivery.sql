alter table public.operations_invitations
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists sent_at timestamptz,
  add column if not exists last_delivery_attempt_at timestamptz,
  add column if not exists delivery_attempts integer not null default 0,
  add column if not exists delivery_error text;

do $$
begin
  alter table public.operations_invitations
    add constraint operations_invitations_delivery_attempts_check
    check (delivery_attempts >= 0);
exception
  when duplicate_object then null;
end;
$$;

create unique index if not exists operations_invitations_active_email_unique_idx
  on public.operations_invitations (workspace_id, lower(email))
  where status in ('pending_approval', 'approved', 'sent');

create unique index if not exists employees_workspace_user_unique_idx
  on public.employees (workspace_id, user_id)
  where user_id is not null;

create unique index if not exists employees_workspace_email_unique_idx
  on public.employees (workspace_id, lower(email))
  where email is not null;

create unique index if not exists operations_role_assignments_active_user_role_idx
  on public.operations_role_assignments (workspace_id, user_id, role)
  where user_id is not null and status = 'active';

create or replace function public.accept_operations_invitation(
  target_invitation_id uuid,
  target_user_id uuid,
  target_user_email text,
  target_user_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invitation public.operations_invitations%rowtype;
  employee_record public.employees%rowtype;
  manager_user_id uuid;
  role_assignment_id uuid;
  normalized_email text;
  display_name text;
  accepted_time timestamptz := now();
begin
  if target_invitation_id is null or target_user_id is null then
    raise exception 'Invitation and user are required.';
  end if;

  normalized_email := lower(btrim(coalesce(target_user_email, '')));

  if normalized_email = '' then
    raise exception 'Authenticated user email is required.';
  end if;

  select *
  into invitation
  from public.operations_invitations
  where id = target_invitation_id
  for update;

  if not found then
    raise exception 'Invitation not found.';
  end if;

  if invitation.status not in ('approved', 'sent') then
    raise exception 'Invitation is not available for acceptance.';
  end if;

  if invitation.expires_at is not null and invitation.expires_at <= accepted_time then
    update public.operations_invitations
    set status = 'expired',
        updated_at = accepted_time
    where id = invitation.id;

    raise exception 'Invitation has expired.';
  end if;

  if lower(invitation.email) <> normalized_email then
    raise exception 'Invitation email does not match the authenticated user.';
  end if;

  perform 1
  from public.workspaces
  where id = invitation.workspace_id
    and status not in ('archived', 'deleted');

  if not found then
    raise exception 'Workspace is not available.';
  end if;

  if invitation.department_id is not null then
    perform 1
    from public.departments
    where id = invitation.department_id
      and workspace_id = invitation.workspace_id
      and status = 'active';

    if not found then
      raise exception 'Invitation department is not available.';
    end if;
  end if;

  if invitation.reports_to_employee_id is not null then
    select user_id
    into manager_user_id
    from public.employees
    where id = invitation.reports_to_employee_id
      and workspace_id = invitation.workspace_id
      and employment_status = 'active';

    if not found then
      raise exception 'Invitation reporting manager is not available.';
    end if;
  end if;

  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    status,
    invited_by,
    joined_at
  )
  values (
    invitation.workspace_id,
    target_user_id,
    invitation.requested_role,
    'active',
    invitation.requested_by,
    accepted_time
  )
  on conflict (workspace_id, user_id)
  do update set
    role = case
      when public.workspace_members.role = 'owner'
        then public.workspace_members.role
      else excluded.role
    end,
    status = 'active',
    invited_by = coalesce(
      public.workspace_members.invited_by,
      excluded.invited_by
    ),
    joined_at = coalesce(
      public.workspace_members.joined_at,
      excluded.joined_at
    ),
    updated_at = accepted_time;

  select *
  into employee_record
  from public.employees
  where workspace_id = invitation.workspace_id
    and (
      user_id = target_user_id
      or (
        user_id is null
        and email is not null
        and lower(email) = normalized_email
      )
    )
  order by
    case when user_id = target_user_id then 0 else 1 end
  limit 1
  for update;

  display_name := coalesce(
    nullif(btrim(invitation.invited_name), ''),
    nullif(btrim(coalesce(target_user_name, '')), ''),
    normalized_email
  );

  if found then
    update public.employees
    set user_id = target_user_id,
        department_id = invitation.department_id,
        manager_user_id = manager_user_id,
        full_name = display_name,
        email = normalized_email,
        position_title = coalesce(
          position_title,
          initcap(replace(invitation.requested_role, '_', ' '))
        ),
        employment_status = 'active',
        updated_at = accepted_time
    where id = employee_record.id
    returning * into employee_record;
  else
    insert into public.employees (
      workspace_id,
      user_id,
      department_id,
      manager_user_id,
      full_name,
      email,
      position_title,
      employment_status,
      created_by
    )
    values (
      invitation.workspace_id,
      target_user_id,
      invitation.department_id,
      manager_user_id,
      display_name,
      normalized_email,
      initcap(replace(invitation.requested_role, '_', ' ')),
      'active',
      invitation.requested_by
    )
    returning * into employee_record;
  end if;

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
    invitation.workspace_id,
    target_user_id,
    employee_record.id,
    invitation.requested_role,
    invitation.department_id,
    invitation.reports_to_employee_id,
    invitation.requested_scope_type,
    'active',
    invitation.requested_by,
    coalesce(invitation.approved_by, invitation.requested_by),
    coalesce(invitation.approved_at, accepted_time)
  )
  on conflict (workspace_id, user_id, employee_id, role)
  do update set
    department_id = excluded.department_id,
    reports_to_employee_id = excluded.reports_to_employee_id,
    scope_type = excluded.scope_type,
    status = 'active',
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    updated_at = accepted_time
  returning id into role_assignment_id;

  update public.operations_invitations
  set status = 'accepted',
      accepted_by = target_user_id,
      accepted_at = accepted_time,
      auth_user_id = target_user_id,
      delivery_error = null,
      updated_at = accepted_time
  where id = invitation.id;

  update public.operations_approval_requests
  set status = 'approved',
      decided_by = coalesce(decided_by, invitation.approved_by),
      decided_at = coalesce(decided_at, invitation.approved_at, accepted_time),
      updated_at = accepted_time
  where related_table = 'operations_invitations'
    and related_id = invitation.id
    and status = 'pending';

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
    invitation.workspace_id,
    target_user_id,
    'invitation.accepted',
    'operations_invitations',
    invitation.id,
    to_jsonb(invitation),
    jsonb_build_object(
      'employeeId', employee_record.id,
      'roleAssignmentId', role_assignment_id,
      'userId', target_user_id
    ),
    jsonb_build_object(
      'source', 'accept_operations_invitation'
    )
  );

  return jsonb_build_object(
    'workspaceId', invitation.workspace_id,
    'employeeId', employee_record.id,
    'roleAssignmentId', role_assignment_id
  );
end;
$$;

revoke all on function public.accept_operations_invitation(uuid, uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.accept_operations_invitation(uuid, uuid, text, text)
  to service_role;