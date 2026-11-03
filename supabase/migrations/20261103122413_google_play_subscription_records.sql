-- Applied to the Virtus AI Supabase project: 20261103122413.
-- Server-owned Google Play records. Do not expose access to anon/authenticated.
create table if not exists public.google_play_subscriptions (
  purchase_token_hash text primary key check (purchase_token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null check (product_id in ('virtus_life_coach','virtus_trainer','virtus_mentor')),
  base_plan_id text not null default 'monthly',
  subscription_state text not null,
  expires_at timestamptz,
  acknowledgement_state text,
  google_order_id text,
  linked_purchase_token_hash text,
  last_verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists google_play_subscriptions_user_idx
  on public.google_play_subscriptions(user_id, expires_at desc);
alter table public.google_play_subscriptions enable row level security;
revoke all on public.google_play_subscriptions from anon, authenticated, public;
comment on table public.google_play_subscriptions is
  'Server-side Google Play purchase records. Hashed purchase tokens only; service-role access, no client grants. Entitlement reconciliation staged separately.';
