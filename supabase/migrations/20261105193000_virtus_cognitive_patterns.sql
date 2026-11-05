-- Client-controlled psychological reflection hypotheses. Never represent them as diagnoses.
create table if not exists public.virtus_cognitive_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 120),
  observed_situation text not null check (char_length(observed_situation) between 10 and 600),
  interpretation text not null check (char_length(interpretation) between 10 and 600),
  response text not null check (char_length(response) between 10 and 600),
  alternative_interpretation text not null check (char_length(alternative_interpretation) between 10 and 600),
  evidence text not null check (char_length(evidence) between 10 and 1000),
  status text not null default 'proposed' check (status in ('proposed','confirmed','rejected')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint virtus_pattern_confirmation_consistency check (
    (status='confirmed' and confirmed_at is not null) or
    (status<>'confirmed' and confirmed_at is null)
  )
);
create index if not exists virtus_cognitive_patterns_owner_recent
  on public.virtus_cognitive_patterns(user_id,created_at desc);
create index if not exists virtus_cognitive_patterns_confirmed
  on public.virtus_cognitive_patterns(user_id,status,updated_at desc);
alter table public.virtus_cognitive_patterns enable row level security;
revoke all on public.virtus_cognitive_patterns from anon, authenticated;
grant select,insert,update,delete on public.virtus_cognitive_patterns to authenticated;
-- TRUNCATE, REFERENCES and TRIGGER must not be accessible to authenticated users.
create policy virtus_patterns_select_own on public.virtus_cognitive_patterns
  for select to authenticated using ((select auth.uid())=user_id);
create policy virtus_patterns_insert_own on public.virtus_cognitive_patterns
  for insert to authenticated with check ((select auth.uid())=user_id);
create policy virtus_patterns_update_own on public.virtus_cognitive_patterns
  for update to authenticated using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);
create policy virtus_patterns_delete_own on public.virtus_cognitive_patterns
  for delete to authenticated using ((select auth.uid())=user_id);
