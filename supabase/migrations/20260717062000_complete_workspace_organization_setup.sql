create or replace function public.complete_workspace_organization_setup(
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_company_name text,
  p_profile jsonb,
  p_departments text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace public.workspaces%rowtype;
  v_previous_profile jsonb;
  v_saved_profile public.workspace_organization_profiles%rowtype;
  v_normalized_departments text[];
  v_blocked_departments text[];
  v_department_name text;
  v_now timestamptz := now();
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
       from public.workspace_members wm
       where wm.workspace_id = p_workspace_id
         and wm.user_id = p_actor_user_id
         and wm.role = 'owner'
         and wm.status = 'active'
     ) then
    raise exception using
      errcode = '42501',
      message = 'Owner access required.';
  end if;

  if nullif(btrim(coalesce(p_company_name, '')), '') is null then
    raise exception using
      errcode = '22023',
      message = 'Company name is required.';
  end if;

  if char_length(btrim(p_company_name)) > 160 then
    raise exception using
      errcode = '22023',
      message = 'Company name cannot exceed 160 characters.';
  end if;

  if exists (
    select 1
    from public.workspace_members wm
    join public.workspaces w on w.id = wm.workspace_id
    where wm.user_id = p_actor_user_id
      and wm.status = 'active'
      and wm.workspace_id <> p_workspace_id
      and w.status <> 'deleted'
      and lower(btrim(w.name)) = lower(btrim(p_company_name))
  ) then
    raise exception using
      errcode = '23505',
      message = 'This company already exists.';
  end if;

  select coalesce(
    array_agg(items.department_name order by items.first_position),
    '{}'::text[]
  )
  into v_normalized_departments
  from (
    select
      (array_agg(btrim(source.department_name) order by source.position))[1]
        as department_name,
      min(source.position) as first_position
    from unnest(coalesce(p_departments, '{}'::text[]))
      with ordinality as source(department_name, position)
    where nullif(btrim(source.department_name), '') is not null
    group by lower(btrim(source.department_name))
  ) as items;

  if cardinality(v_normalized_departments) = 0 then
    raise exception using
      errcode = '22023',
      message = 'At least one department is required.';
  end if;

  if cardinality(v_normalized_departments) > 100 then
    raise exception using
      errcode = '22023',
      message = 'A maximum of 100 departments is allowed during setup.';
  end if;

  if exists (
    select 1
    from unnest(v_normalized_departments) as department(name)
    where char_length(department.name) > 120
  ) then
    raise exception using
      errcode = '22023',
      message = 'Department names cannot exceed 120 characters.';
  end if;

  select array_agg(d.name order by d.name)
  into v_blocked_departments
  from public.departments d
  where d.workspace_id = p_workspace_id
    and d.status = 'active'
    and not exists (
      select 1
      from unnest(v_normalized_departments) as requested(name)
      where lower(btrim(requested.name)) = lower(btrim(d.name))
    )
    and exists (
      select 1
      from public.employees e
      where e.workspace_id = p_workspace_id
        and e.department_id = d.id
        and e.employment_status = 'active'
    );

  if cardinality(v_blocked_departments) > 0 then
    raise exception using
      errcode = 'P0001',
      message = format(
        'Cannot archive departments with active employees: %s.',
        array_to_string(v_blocked_departments, ', ')
      ),
      detail = 'DEPARTMENT_IN_USE';
  end if;

  update public.operations_role_assignments
  set
    department_id = null,
    updated_at = v_now
  where workspace_id = p_workspace_id
    and user_id = p_actor_user_id
    and role = 'owner'
    and scope_type = 'company'
    and status = 'active';

  select array_agg(distinct d.name order by d.name)
  into v_blocked_departments
  from public.departments d
  join public.operations_role_assignments ora
    on ora.department_id = d.id
   and ora.workspace_id = p_workspace_id
   and ora.status = 'active'
  where d.workspace_id = p_workspace_id
    and d.status = 'active'
    and not exists (
      select 1
      from unnest(v_normalized_departments) as requested(name)
      where lower(btrim(requested.name)) = lower(btrim(d.name))
    );

  if cardinality(v_blocked_departments) > 0 then
    raise exception using
      errcode = 'P0001',
      message = format(
        'Cannot archive departments used by active role assignments: %s.',
        array_to_string(v_blocked_departments, ', ')
      ),
      detail = 'DEPARTMENT_IN_USE';
  end if;

  for v_department_name in
    select unnest(v_normalized_departments)
  loop
    update public.departments
    set
      status = 'active',
      updated_at = v_now
    where id = (
      select d.id
      from public.departments d
      where d.workspace_id = p_workspace_id
        and lower(btrim(d.name)) = lower(btrim(v_department_name))
      order by d.created_at
      limit 1
    );

    if not found then
      insert into public.departments (
        workspace_id,
        name,
        status,
        created_by
      )
      values (
        p_workspace_id,
        v_department_name,
        'active',
        p_actor_user_id
      );
    end if;
  end loop;

  update public.departments d
  set
    status = 'archived',
    updated_at = v_now
  where d.workspace_id = p_workspace_id
    and d.status = 'active'
    and not exists (
      select 1
      from unnest(v_normalized_departments) as requested(name)
      where lower(btrim(requested.name)) = lower(btrim(d.name))
    );

  select to_jsonb(profile)
  into v_previous_profile
  from public.workspace_organization_profiles profile
  where profile.workspace_id = p_workspace_id;

  update public.workspaces
  set
    name = btrim(p_company_name),
    updated_at = v_now
  where id = p_workspace_id;

  insert into public.workspace_organization_profiles (
    workspace_id,
    legal_name,
    industry,
    business_type,
    description,
    main_products,
    main_services,
    target_clients,
    daily_leader_role,
    leadership_structure,
    department_scale,
    departments_report_directly,
    company_stage,
    employee_range,
    annual_revenue_range,
    reporting_flow,
    headquarters,
    branches,
    daily_reports,
    weekly_reports,
    monthly_reports,
    approval_rules,
    kpis,
    ai_monitoring,
    setup_status,
    setup_completed_at,
    created_by,
    updated_by,
    updated_at
  )
  values (
    p_workspace_id,
    nullif(btrim(coalesce(p_profile->>'legalName', '')), ''),
    nullif(btrim(coalesce(p_profile->>'industry', '')), ''),
    nullif(btrim(coalesce(p_profile->>'businessType', '')), ''),
    nullif(btrim(coalesce(p_profile->>'description', '')), ''),
    nullif(btrim(coalesce(p_profile->>'mainProducts', '')), ''),
    nullif(btrim(coalesce(p_profile->>'mainServices', '')), ''),
    nullif(btrim(coalesce(p_profile->>'targetClients', '')), ''),
    coalesce(nullif(btrim(p_profile->>'dailyLeaderRole'), ''), 'ceo'),
    coalesce(nullif(btrim(p_profile->>'leadershipStructure'), ''), 'ceo_directors'),
    coalesce(nullif(btrim(p_profile->>'departmentScale'), ''), '1-3'),
    coalesce((p_profile->>'departmentsReportDirectly')::boolean, true),
    nullif(btrim(coalesce(p_profile->>'companyStage', '')), ''),
    nullif(btrim(coalesce(p_profile->>'employeeRange', '')), ''),
    nullif(btrim(coalesce(p_profile->>'annualRevenueRange', '')), ''),
    nullif(btrim(coalesce(p_profile->>'reportingFlow', '')), ''),
    nullif(btrim(coalesce(p_profile->>'headquarters', '')), ''),
    nullif(btrim(coalesce(p_profile->>'branches', '')), ''),
    coalesce((p_profile->>'dailyReports')::boolean, true),
    coalesce((p_profile->>'weeklyReports')::boolean, true),
    coalesce((p_profile->>'monthlyReports')::boolean, false),
    nullif(btrim(coalesce(p_profile->>'approvalRules', '')), ''),
    nullif(btrim(coalesce(p_profile->>'kpis', '')), ''),
    coalesce(
      array(
        select jsonb_array_elements_text(
          case
            when jsonb_typeof(p_profile->'aiMonitoring') = 'array'
              then p_profile->'aiMonitoring'
            else '[]'::jsonb
          end
        )
      ),
      '{}'::text[]
    ),
    'completed',
    v_now,
    p_actor_user_id,
    p_actor_user_id,
    v_now
  )
  on conflict (workspace_id)
  do update set
    legal_name = excluded.legal_name,
    industry = excluded.industry,
    business_type = excluded.business_type,
    description = excluded.description,
    main_products = excluded.main_products,
    main_services = excluded.main_services,
    target_clients = excluded.target_clients,
    daily_leader_role = excluded.daily_leader_role,
    leadership_structure = excluded.leadership_structure,
    department_scale = excluded.department_scale,
    departments_report_directly = excluded.departments_report_directly,
    company_stage = excluded.company_stage,
    employee_range = excluded.employee_range,
    annual_revenue_range = excluded.annual_revenue_range,
    reporting_flow = excluded.reporting_flow,
    headquarters = excluded.headquarters,
    branches = excluded.branches,
    daily_reports = excluded.daily_reports,
    weekly_reports = excluded.weekly_reports,
    monthly_reports = excluded.monthly_reports,
    approval_rules = excluded.approval_rules,
    kpis = excluded.kpis,
    ai_monitoring = excluded.ai_monitoring,
    setup_status = 'completed',
    setup_completed_at = v_now,
    updated_by = p_actor_user_id,
    updated_at = v_now
  returning *
  into v_saved_profile;

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
    'organization.setup_completed',
    'workspace_organization_profiles',
    p_workspace_id,
    v_previous_profile,
    to_jsonb(v_saved_profile),
    jsonb_build_object(
      'source', 'operations_organization_setup_api',
      'departments', to_jsonb(v_normalized_departments)
    )
  );

  return jsonb_build_object(
    'workspaceId', p_workspace_id,
    'companyName', btrim(p_company_name),
    'setupStatus', 'completed',
    'departmentCount', cardinality(v_normalized_departments)
  );
end;
$$;

revoke all on function public.complete_workspace_organization_setup(
  uuid,
  uuid,
  text,
  jsonb,
  text[]
) from public, anon, authenticated;

grant execute on function public.complete_workspace_organization_setup(
  uuid,
  uuid,
  text,
  jsonb,
  text[]
) to service_role;

comment on function public.complete_workspace_organization_setup(
  uuid,
  uuid,
  text,
  jsonb,
  text[]
) is
  'Atomically completes the organization setup profile and synchronizes initial departments.';