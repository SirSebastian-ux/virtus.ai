alter table public.virtus_organizations add column if not exists domain_verification_token_hash text;
alter table public.virtus_organizations add column if not exists domain_verification_requested text;
alter table public.virtus_organizations add column if not exists domain_verified_at timestamptz;
create index if not exists virtus_org_domain_verification_idx on public.virtus_organizations(domain_verification_requested) where domain_verification_requested is not null;
