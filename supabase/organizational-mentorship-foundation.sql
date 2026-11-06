-- Organizational mentorship foundation (staging migration; not yet applied).
-- All writes are mediated by authenticated server endpoints using a service role.
create table if not exists public.virtus_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  verified_domain text,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  billing_status text not null default 'pending' check (billing_status in ('pending','trialing','active','past_due','canceled','unpaid')),
  seat_limit integer not null default 0 check (seat_limit >= 0),
  created_at timestamptz not null default now()
);
create table if not exists public.virtus_organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.virtus_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  status text not null default 'active' check (status in ('active','suspended','removed')),
  joined_at timestamptz not null default now(),
  unique (organization_id,user_id)
);
create index if not exists virtus_org_members_user_idx on public.virtus_organization_members(user_id);
create table if not exists public.virtus_organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.virtus_organizations(id) on delete cascade,
  invited_email text not null,
  invited_role text not null default 'member' check (invited_role in ('admin','member')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);
create table if not exists public.virtus_organization_billing_events (
  stripe_event_id text primary key,
  organization_id uuid references public.virtus_organizations(id) on delete set null,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table public.virtus_organizations enable row level security;
alter table public.virtus_organization_members enable row level security;
alter table public.virtus_organization_invitations enable row level security;
alter table public.virtus_organization_billing_events enable row level security;
revoke all on public.virtus_organizations,public.virtus_organization_members,public.virtus_organization_invitations,public.virtus_organization_billing_events from anon,authenticated;
grant select on public.virtus_organizations,public.virtus_organization_members to authenticated;
create policy "org members read their own membership" on public.virtus_organization_members for select to authenticated
using (user_id = (select auth.uid()));
create policy "org owners see organization" on public.virtus_organizations for select to authenticated
using (owner_user_id = (select auth.uid()));
-- No client-side INSERT/UPDATE/DELETE policies. Invites and billing events remain service-only.
