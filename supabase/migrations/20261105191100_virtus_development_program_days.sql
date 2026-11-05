-- Extend prior client-owned goals without discarding any existing reflection.
alter table public.virtus_development_goals
  add column if not exists program_days smallint not null default 7;
alter table public.virtus_development_goals
  drop constraint if exists virtus_development_goals_program_days_check;
alter table public.virtus_development_goals
  add constraint virtus_development_goals_program_days_check
  check (program_days in (7,30,60,90));
