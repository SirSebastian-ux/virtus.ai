create table if not exists public.virtus_org_learning_progress (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.virtus_organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 curriculum_type text not null check(curriculum_type in ('leadership','conscious_mind')),
 module_number integer not null check(module_number between 1 and 10),
 exercise_number integer not null check(exercise_number between 1 and 30),
 completed_at timestamptz not null default now(),
 unique(organization_id,user_id,curriculum_type,module_number,exercise_number)
);
create index if not exists virtus_org_learning_reporting on public.virtus_org_learning_progress(organization_id,curriculum_type,module_number);
alter table public.virtus_org_learning_progress enable row level security;
revoke all on public.virtus_org_learning_progress from anon,authenticated;
grant select,insert,delete on public.virtus_org_learning_progress to authenticated;
create policy "member reads own learning progress" on public.virtus_org_learning_progress for select to authenticated using(user_id=(select auth.uid()) and public.virtus_organization_access(organization_id));
create policy "member records own learning progress" on public.virtus_org_learning_progress for insert to authenticated with check(user_id=(select auth.uid()) and public.virtus_organization_access(organization_id));
create policy "member removes own learning progress" on public.virtus_org_learning_progress for delete to authenticated using(user_id=(select auth.uid()) and public.virtus_organization_access(organization_id));
create or replace function public.virtus_org_aggregate_learning(p_org uuid)
returns table(curriculum_type text,module_number integer,participants bigint,completed_exercises bigint)
language sql stable security definer set search_path='' as $$
 with permitted as (
  select 1 from public.virtus_organization_members m
  where m.organization_id=p_org and m.user_id=auth.uid() and m.role in ('owner','admin') and m.status='active'
 ), cohorts as (
  select l.curriculum_type,l.module_number,count(distinct l.user_id) as participants,count(*) as completed_exercises
  from public.virtus_org_learning_progress l
  where l.organization_id=p_org and public.virtus_organization_access(p_org)
  group by l.curriculum_type,l.module_number
 )
 select c.curriculum_type,c.module_number,c.participants,c.completed_exercises
 from cohorts c where exists(select 1 from permitted) and c.participants>=5;
$$;
revoke all on function public.virtus_org_aggregate_learning(uuid) from public,anon;
grant execute on function public.virtus_org_aggregate_learning(uuid) to authenticated;