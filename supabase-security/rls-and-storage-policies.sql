-- Virtus AI Supabase RLS and Storage Security Policies
-- Created after production security audit stabilization.
-- Purpose:
-- 1. Protect user-owned public tables with RLS.
-- 2. Protect user-files storage bucket by authenticated user folder.
-- 3. Keep this file as a project record of the policies applied manually in Supabase.

-- Expected protected tables:
-- profiles
-- user_files
-- chat_sessions
-- capture_notes
-- project_spaces
-- user_reasoning_preferences

-- Storage bucket:
-- user-files must remain private: public = false.

-- Storage object policies applied:
-- user_files_select_own_folder
-- user_files_insert_own_folder
-- user_files_update_own_folder
-- user_files_delete_own_folder

-- Important storage rule:
-- auth.uid()::text must match the first folder in storage object name:
-- auth.uid()::text = (storage.foldername(name))[1]

-- Public table policies added for chat_sessions:

alter table public.chat_sessions enable row level security;

drop policy if exists "Users can read own chat sessions" on public.chat_sessions;
drop policy if exists "Users can insert own chat sessions" on public.chat_sessions;
drop policy if exists "Users can update own chat sessions" on public.chat_sessions;
drop policy if exists "Users can delete own chat sessions" on public.chat_sessions;

create policy "Users can read own chat sessions"
on public.chat_sessions
for select
to authenticated
using (auth.uid()::text = user_id::text);

create policy "Users can insert own chat sessions"
on public.chat_sessions
for insert
to authenticated
with check (auth.uid()::text = user_id::text);

create policy "Users can update own chat sessions"
on public.chat_sessions
for update
to authenticated
using (auth.uid()::text = user_id::text)
with check (auth.uid()::text = user_id::text);

create policy "Users can delete own chat sessions"
on public.chat_sessions
for delete
to authenticated
using (auth.uid()::text = user_id::text);


-- Public table policies added for user_files:

alter table public.user_files enable row level security;

drop policy if exists "Users can read own files" on public.user_files;
drop policy if exists "Users can insert own files" on public.user_files;
drop policy if exists "Users can update own files" on public.user_files;
drop policy if exists "Users can delete own files" on public.user_files;

create policy "Users can read own files"
on public.user_files
for select
to authenticated
using (auth.uid()::text = user_id::text);

create policy "Users can insert own files"
on public.user_files
for insert
to authenticated
with check (auth.uid()::text = user_id::text);

create policy "Users can update own files"
on public.user_files
for update
to authenticated
using (auth.uid()::text = user_id::text)
with check (auth.uid()::text = user_id::text);

create policy "Users can delete own files"
on public.user_files
for delete
to authenticated
using (auth.uid()::text = user_id::text);


-- Storage policies applied for user-files bucket:

drop policy if exists "Allow public read access 84ce0l_0" on storage.objects;
drop policy if exists "Allow authenticated uploads 84ce0l_0" on storage.objects;

create policy "user_files_select_own_folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'user-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "user_files_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "user_files_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'user-files'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'user-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "user_files_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);


-- Verification query:

select
  t.tablename,
  t.rowsecurity as rls_enabled,
  count(p.policyname) as policy_count,
  string_agg(p.policyname || ' [' || p.cmd || ']', ', ' order by p.policyname) as policies
from pg_tables t
left join pg_policies p
  on p.schemaname = t.schemaname
 and p.tablename = t.tablename
where t.schemaname = 'public'
  and t.tablename in (
    'profiles',
    'user_files',
    'chat_sessions',
    'capture_notes',
    'project_spaces',
    'user_reasoning_preferences'
  )
group by t.tablename, t.rowsecurity
order by t.tablename;
