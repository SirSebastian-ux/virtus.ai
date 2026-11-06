-- Reuse EWS's preexisting, numbered leadership knowledge sources.
-- Mapping does not approve rights, accuracy or the published edition.
insert into public.virtus_ews_curriculum_units
  (curriculum_id,unit_number,title,source_id,review_status)
select registry.id,s.module_number,
  left(coalesce(nullif(btrim(s.module_title),''),s.title),180),
  s.id,'pending'
from public.virtus_ews_curriculum_registry registry
join public.virtus_library_sources s
  on s.library_key='ews-leadership-module-'||s.module_number::text
 and s.module_number between 1 and 10
where registry.library_key='ews-leadership-stability-10'
  and exists (select 1 from public.virtus_library_chunks c where c.source_id=s.id)
on conflict (curriculum_id,unit_number) do nothing;

update public.virtus_ews_curriculum_registry registry
set source_status='in_review',version_label='unverified'
where registry.library_key='ews-leadership-stability-10'
  and registry.source_status='awaiting_originals'
  and (select count(*) from public.virtus_ews_curriculum_units u
       where u.curriculum_id=registry.id)=registry.expected_units;
