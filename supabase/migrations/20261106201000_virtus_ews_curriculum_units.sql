-- EWS-controlled source mapping: never mark material approved without reviewed originals.
create table if not exists public.virtus_ews_curriculum_units (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.virtus_ews_curriculum_registry(id) on delete cascade,
  unit_number integer not null check (unit_number between 1 and 120),
  title text not null check (char_length(title) between 3 and 180),
  source_id uuid not null references public.virtus_library_sources(id) on delete restrict,
  review_status text not null default 'pending' check (review_status in ('pending','reviewed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(curriculum_id,unit_number),
  unique(curriculum_id,source_id)
);
alter table public.virtus_ews_curriculum_units enable row level security;
revoke all on public.virtus_ews_curriculum_units from anon,authenticated;
-- This mapping is only managed by the existing EWS/Virtus admin API.
-- Employees and company admins cannot publish EWS works or view unapproved sources.

create table if not exists public.virtus_org_programme_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.virtus_organizations(id) on delete cascade,
  curriculum_id uuid not null references public.virtus_ews_curriculum_registry(id) on delete restrict,
  status text not null default 'paused' check (status in ('active','paused')),
  assigned_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(organization_id,curriculum_id)
);
alter table public.virtus_org_programme_assignments enable row level security;
revoke all on public.virtus_org_programme_assignments from anon,authenticated;
-- Company admins can request assignments through a permission-checked server route.
-- Individual employee progress remains private in user-owned tables.
