-- Virtus AI Organizations: access licences do not transfer employee records to employers.
create table if not exists public.virtus_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{3,100}$'),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  seat_limit integer not null default 0 check (seat_limit between 0 and 100000),
  billing_status text not null default 'pending' check (billing_status in ('pending','active','past_due','canceled')),
  paid_through timestamptz,
  status text not null default 'draft' check (status in ('draft','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists virtus_org_owner_idx on public.virtus_organizations(owner_user_id);

create table if not exists public.virtus_org_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.virtus_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  unique(organization_id,user_id)
);
create index if not exists virtus_org_member_user_idx on public.virtus_org_memberships(user_id,status);

create table if not exists public.virtus_org_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.virtus_organizations(id) on delete cascade,
  invited_email text not null check (char_length(invited_email) between 5 and 254 and invited_email = lower(invited_email)),
  token_hash text not null unique check (char_length(token_hash)=64),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists virtus_org_invite_org_status on public.virtus_org_invitations(organization_id,status,expires_at);
create unique index if not exists virtus_org_invite_pending_email on public.virtus_org_invitations(organization_id,invited_email) where status='pending';

create table if not exists public.virtus_org_audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.virtus_organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 3 and 70),
  target_id text,
  created_at timestamptz not null default now()
);
create index if not exists virtus_org_audit_recent on public.virtus_org_audit_events(organization_id,created_at desc);

-- Curriculum publication is separate from employer billing and individual development history.
create table if not exists public.virtus_ews_curriculum_registry (
  id uuid primary key default gen_random_uuid(),
  library_key text not null unique,
  title text not null,
  collection_kind text not null check (collection_kind in ('leadership_architecture','conscious_mind','other')),
  expected_units integer not null check (expected_units between 1 and 120),
  source_status text not null default 'awaiting_originals' check (source_status in ('awaiting_originals','in_review','approved')),
  version_label text not null default 'unverified',
  created_at timestamptz not null default now()
);
insert into public.virtus_ews_curriculum_registry (library_key,title,collection_kind,expected_units)
values
 ('ews-leadership-stability-10','EWS Leadership Stability & Decision Architecture','leadership_architecture',10),
 ('ews-architecture-conscious-mind-8','The Architecture of the Conscious Mind','conscious_mind',8)
on conflict (library_key) do nothing;

-- Trigger serializes seat claims under an organization lock, preventing over-allocation.
create schema if not exists virtus_private;
create or replace function virtus_private.guard_org_membership_seats()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_org public.virtus_organizations%rowtype;
        v_used integer;
begin
  if new.role <> 'member' or new.status <> 'active' then return new; end if;
  select * into v_org from public.virtus_organizations
   where id=new.organization_id for update;
  if not found or v_org.status <> 'active' or v_org.billing_status <> 'active'
     or v_org.paid_through is null or v_org.paid_through <= now() then
    raise exception 'Organization has no active paid entitlement';
  end if;
  select count(*) into v_used from public.virtus_org_memberships
    where organization_id=new.organization_id and role='member' and status='active'
      and id<>new.id;
  if v_used >= v_org.seat_limit then
    raise exception 'No available organization seat';
  end if;
  return new;
end;
$$;
revoke all on function virtus_private.guard_org_membership_seats() from public,anon,authenticated;
drop trigger if exists virtus_org_membership_seat_guard on public.virtus_org_memberships;
create trigger virtus_org_membership_seat_guard
before insert or update of role,status on public.virtus_org_memberships
for each row execute function virtus_private.guard_org_membership_seats();

-- Organization role and billing changes stay server-owned.
alter table public.virtus_organizations enable row level security;
alter table public.virtus_org_memberships enable row level security;
alter table public.virtus_org_invitations enable row level security;
alter table public.virtus_org_audit_events enable row level security;
alter table public.virtus_ews_curriculum_registry enable row level security;
revoke all on public.virtus_organizations,public.virtus_org_memberships,
 public.virtus_org_invitations,public.virtus_org_audit_events,
 public.virtus_ews_curriculum_registry from public,anon,authenticated;
grant select on public.virtus_organizations,public.virtus_org_memberships to authenticated;
create policy virtus_org_self_select on public.virtus_organizations for select to authenticated
 using (owner_user_id=(select auth.uid()) or exists
 (select 1 from public.virtus_org_memberships m
 where m.organization_id=virtus_organizations.id and m.user_id=(select auth.uid()) and m.status='active'));
create policy virtus_org_membership_self_select on public.virtus_org_memberships
 for select to authenticated using (user_id=(select auth.uid()));
-- Zero authenticated grants for invitation tokens, audit events, curriculum editing.
-- Employer never receives SELECT privileges for employee conversations or reflections.
