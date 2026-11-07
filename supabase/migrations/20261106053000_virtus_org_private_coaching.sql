create table if not exists public.virtus_org_private_conversations (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.virtus_organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.virtus_org_private_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.virtus_org_private_conversations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('user','assistant')),
 content text not null check(length(content) between 1 and 20000),
 created_at timestamptz not null default now()
);
create index if not exists virtus_org_private_conversations_owner on public.virtus_org_private_conversations(user_id,organization_id);
create index if not exists virtus_org_private_messages_thread on public.virtus_org_private_messages(conversation_id,created_at);
alter table public.virtus_org_private_conversations enable row level security;
alter table public.virtus_org_private_messages enable row level security;
revoke all on public.virtus_org_private_conversations,public.virtus_org_private_messages from anon,authenticated;
grant select,insert on public.virtus_org_private_conversations,public.virtus_org_private_messages to authenticated;
create policy "owner reads private conversations" on public.virtus_org_private_conversations for select to authenticated using (user_id=(select auth.uid()) and public.virtus_organization_access(organization_id));
create policy "owner creates private conversations" on public.virtus_org_private_conversations for insert to authenticated with check (user_id=(select auth.uid()) and public.virtus_organization_access(organization_id));
create policy "owner reads private messages" on public.virtus_org_private_messages for select to authenticated using (user_id=(select auth.uid()) and exists(select 1 from public.virtus_org_private_conversations c where c.id=conversation_id and c.user_id=(select auth.uid()) and public.virtus_organization_access(c.organization_id)));