create or replace function public.virtus_organization_access(p_organization_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select auth.uid() is not null and exists (
   select 1 from public.virtus_organization_members m
   join public.virtus_organizations o on o.id=m.organization_id
   where m.organization_id=p_organization_id and m.user_id=auth.uid()
   and m.status='active' and o.billing_status in ('active','trialing')
   and o.seat_limit >= (
     select count(*) from public.virtus_organization_members a
     where a.organization_id=o.id and a.status='active'
   )
 );
$$;
revoke all on function public.virtus_organization_access(uuid) from public,anon;
grant execute on function public.virtus_organization_access(uuid) to authenticated;

alter table public.virtus_organizations add column if not exists stripe_last_event_created bigint not null default 0;
create or replace function public.virtus_reconcile_org_subscription(p_org uuid,p_event text,p_created bigint,p_subscription text,p_customer text,p_status text,p_seats integer,p_event_type text)
returns text language plpgsql security definer set search_path='' as $$
declare v public.virtus_organizations%rowtype;
begin
 if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
 if p_event is null or p_created <= 0 or p_subscription is null or p_customer is null or p_seats not between 1 and 10000 or p_status not in ('pending','active','trialing','past_due','unpaid','canceled') then raise exception 'Invalid billing event'; end if;
 select * into v from public.virtus_organizations where id=p_org for update;
 if not found then raise exception 'Organization not found'; end if;
 if exists(select 1 from public.virtus_organization_billing_events where stripe_event_id=p_event) then return 'duplicate'; end if;
 if v.stripe_subscription_id is not null and v.stripe_subscription_id <> p_subscription then raise exception 'Subscription mismatch'; end if;
 if p_created < v.stripe_last_event_created then
  insert into public.virtus_organization_billing_events(stripe_event_id,organization_id,event_type) values(p_event,p_org,p_event_type);
  return 'stale';
 end if;
 update public.virtus_organizations set stripe_customer_id=p_customer,stripe_subscription_id=p_subscription,billing_status=p_status,seat_limit=p_seats,stripe_last_event_created=p_created where id=p_org;
 insert into public.virtus_organization_billing_events(stripe_event_id,organization_id,event_type) values(p_event,p_org,p_event_type);
 return 'applied';
end; $$;
revoke all on function public.virtus_reconcile_org_subscription(uuid,text,bigint,text,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.virtus_reconcile_org_subscription(uuid,text,bigint,text,text,text,integer,text) to service_role;