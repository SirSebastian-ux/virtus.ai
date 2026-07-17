create table if not exists public.workspace_organization_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,

  legal_name text,
  industry text,
  business_type text,
  description text,
  main_products text,
  main_services text,
  target_clients text,

  daily_leader_role text not null default 'ceo' check (
    daily_leader_role in ('ceo', 'managing_director', 'president', 'founder')
  ),
  leadership_structure text not null default 'ceo_directors' check (
    leadership_structure in (
      'executive_only',
      'ceo_directors',
      'director_managers',
      'custom'
    )
  ),
  department_scale text not null default '1-3' check (
    department_scale in ('1-3', '4-8', '9+')
  ),
  departments_report_directly boolean not null default true,

  company_stage text,
  employee_range text,
  annual_revenue_range text,

  reporting_flow text,
  headquarters text,
  branches text,

  daily_reports boolean not null default true,
  weekly_reports boolean not null default true,
  monthly_reports boolean not null default false,
  approval_rules text,

  kpis text,
  ai_monitoring text[] not null default '{}'::text[],

  setup_status text not null default 'draft' check (
    setup_status in ('draft', 'completed')
  ),
  setup_completed_at timestamptz,

  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_organization_profiles_setup_status_idx
  on public.workspace_organization_profiles (setup_status);

alter table public.workspace_organization_profiles enable row level security;

comment on table public.workspace_organization_profiles is
  'Persistent company foundation configuration created by the Operations Intelligence setup wizard.';