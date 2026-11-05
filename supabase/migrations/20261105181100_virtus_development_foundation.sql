-- Virtus Cognitive Development Engine: client-authored goals and behavioral check-ins.
-- No generated clinical scores, medical records or AI diagnoses.
create table if not exists public.virtus_development_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 120),
  focus_domain text not null check (focus_domain in (
    'self_awareness','emotional_regulation','communication','decision_making','habits','leadership'
  )),
  observed_behavior text not null check (char_length(observed_behavior) between 10 and 500),
  desired_behavior text not null check (char_length(desired_behavior) between 10 and 500),
  baseline_rating smallint not null check (baseline_rating between 1 and 5),
  status text not null default 'active' check (status in ('active','completed','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,user_id)
);
create index if not exists virtus_development_goals_owner_recent
  on public.virtus_development_goals(user_id,created_at desc);

create table if not exists public.virtus_development_checkins (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  evidence text not null check (char_length(evidence) between 10 and 1000),
  next_action text not null check (char_length(next_action) between 5 and 500),
  created_at timestamptz not null default now(),
  constraint virtus_development_checkins_owner_fk foreign key (goal_id,user_id)
    references public.virtus_development_goals(id,user_id) on delete cascade
);
create index if not exists virtus_development_checkins_owner_goal_recent
  on public.virtus_development_checkins(user_id,goal_id,created_at desc);

alter table public.virtus_development_goals enable row level security;
alter table public.virtus_development_checkins enable row level security;

revoke all on public.virtus_development_goals from anon;
revoke all on public.virtus_development_checkins from anon;
grant select,insert,update on public.virtus_development_goals to authenticated;
grant select,insert on public.virtus_development_checkins to authenticated;

create policy virtus_dev_goals_select_own on public.virtus_development_goals
  for select to authenticated using ((select auth.uid())=user_id);
create policy virtus_dev_goals_insert_own on public.virtus_development_goals
  for insert to authenticated with check ((select auth.uid())=user_id);
create policy virtus_dev_goals_update_own on public.virtus_development_goals
  for update to authenticated using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);

create policy virtus_dev_checkins_select_own on public.virtus_development_checkins
  for select to authenticated using ((select auth.uid())=user_id);
create policy virtus_dev_checkins_insert_own on public.virtus_development_checkins
  for insert to authenticated
  with check (
    (select auth.uid())=user_id
    and exists (
      select 1 from public.virtus_development_goals g
      where g.id=goal_id and g.user_id=(select auth.uid())
    )
  );
