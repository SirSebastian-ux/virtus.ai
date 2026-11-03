-- Applied to Virtus AI project jcafmluioohtzyxuyosd on 2026-11-03.
-- Separate entitlement sources permit safe Stripe + Google Play coexistence.
create table if not exists public.virtus_billing_entitlements (
  provider text not null check (provider in ('manual','stripe','google_play')),
  provider_subscription_id text not null check (char_length(provider_subscription_id) between 1 and 200),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('life_coach','plus','premium')),
  status text not null check (status in ('active','trialing','past_due','grace','cancelled','expired','inactive')),
  expires_at timestamptz,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (provider, provider_subscription_id)
);
create index if not exists virtus_billing_entitlements_user_idx on public.virtus_billing_entitlements(user_id);
alter table public.virtus_billing_entitlements enable row level security;
revoke all on public.virtus_billing_entitlements from anon,authenticated,public;
alter table public.profiles add column if not exists billing_managed boolean not null default false;

-- Existing non-Stripe premium users retain previously assigned memberships.
insert into public.virtus_billing_entitlements
 (provider, provider_subscription_id, user_id, plan, status)
select 'manual', p.id::text, p.id, p.plan, 'active'
from public.profiles p
where p.plan in ('life_coach','plus','premium')
  and p.plan_status in ('active','trialing')
  and p.stripe_customer_id is null
on conflict (provider,provider_subscription_id) do nothing;

create or replace function public.virtus_record_billing_entitlement(
 p_user_id uuid, p_provider text, p_provider_subscription_id text,
 p_plan text, p_status text, p_expires_at timestamptz default null
)
returns table(effective_plan text,effective_status text)
language plpgsql security definer set search_path = ''
as $function$
declare
 v_profile public.profiles%rowtype;
 v_selected record;
 v_updated int;
begin
 if p_user_id is null or p_provider not in ('stripe','google_play') or
    p_provider_subscription_id is null or length(p_provider_subscription_id) not between 1 and 200 or
    p_plan not in ('life_coach','plus','premium') or
    p_status not in ('active','trialing','past_due','grace','cancelled','expired','inactive') then
   raise exception 'Invalid verified billing event';
 end if;
 if p_provider='google_play' and p_provider_subscription_id !~ '^[0-9a-f]{64}$' then
   raise exception 'Expected hashed Google purchase token';
 end if;
 select * into v_profile from public.profiles where id=p_user_id for update;
 if not found then raise exception 'No matching Virtus account'; end if;

 insert into public.virtus_billing_entitlements
 (provider,provider_subscription_id,user_id,plan,status,expires_at,verified_at)
 values (p_provider,p_provider_subscription_id,p_user_id,p_plan,p_status,p_expires_at,now())
 on conflict (provider,provider_subscription_id)
 do update set plan=excluded.plan,status=excluded.status,
               expires_at=excluded.expires_at,verified_at=now()
 where public.virtus_billing_entitlements.user_id=excluded.user_id;
 get diagnostics v_updated = row_count;
 if v_updated <> 1 then raise exception 'Billing purchase belongs to another account'; end if;

 select be.plan,
   case when be.provider='stripe' and be.status in ('trialing','past_due')
     then be.status else 'active' end as resolved_status
 into v_selected
 from public.virtus_billing_entitlements be
 where be.user_id=p_user_id and (
   (be.provider='manual' and be.status='active')
   or
   (be.provider='stripe' and be.status in ('active','trialing','past_due')
    and (be.expires_at is null or be.expires_at>now()))
   or
   (be.provider='google_play' and be.status in ('active','grace','cancelled')
    and be.expires_at>now())
 )
 order by case be.plan when 'premium' then 3 when 'plus' then 2 else 1 end desc,
          case be.provider when 'manual' then 1 when 'stripe' then 2 else 3 end
 limit 1;
 update public.profiles
   set plan=coalesce(v_selected.plan,'free'),
       plan_status=coalesce(v_selected.resolved_status,'active'),
       billing_managed=true,updated_at=now()
 where id=p_user_id;
 return query select coalesce(v_selected.plan,'free')::text,
                     coalesce(v_selected.resolved_status,'active')::text;
end;
$function$;
revoke all on function public.virtus_record_billing_entitlement(uuid,text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.virtus_record_billing_entitlement(uuid,text,text,text,text,timestamptz) to service_role;
