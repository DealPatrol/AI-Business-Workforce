-- SAMPLE Demo Blast 10 campaign (10 clearly labeled placeholder cards).
-- Apply migrations through 20260925131044_demo_blast_10.sql first.
-- Replace contractor@example.com with Cole's authenticated Supabase user email.
do $$
declare
  contractor_id uuid;
  sample_campaign_id constant uuid := 'd0100000-0000-4000-8000-000000000010';
begin
  select id into contractor_id
  from auth.users
  where email = 'contractor@example.com';

  if contractor_id is null then
    raise exception
      'Create contractor@example.com in Supabase Auth, or replace the email in supabase/seed_demo10.sql.';
  end if;

  insert into public.campaigns (
    id,
    owner_id,
    name,
    business_name,
    business_phone,
    business_email,
    status,
    campaign_type,
    trade,
    is_sample
  )
  values (
    sample_campaign_id,
    contractor_id,
    'SAMPLE — Demo Blast 10',
    'Sample North Alabama Landscaping',
    '(256) 555-0110',
    'contractor@example.com',
    'active',
    'demo_10',
    'landscaping',
    true
  )
  on conflict (id) do update set
    owner_id = excluded.owner_id,
    name = excluded.name,
    business_name = excluded.business_name,
    business_phone = excluded.business_phone,
    business_email = excluded.business_email,
    status = excluded.status,
    campaign_type = excluded.campaign_type,
    trade = excluded.trade,
    is_sample = excluded.is_sample;

  delete from public.campaign_recipients
  where campaign_id = sample_campaign_id;

  insert into public.campaign_recipients (
    id,
    campaign_id,
    public_token,
    homeowner_name,
    address_line_1,
    city,
    state,
    postal_code,
    concept_image_url,
    concept_summary,
    current_image_url,
    current_image_source,
    current_image_usage,
    after_image_url,
    after_image_provider,
    after_prompt_version,
    concept_json,
    review_status,
    imagery_status
  )
  select
    ('d0100000-0000-4000-8100-' || lpad(card_number::text, 12, '0'))::uuid,
    sample_campaign_id,
    'sample-demo10-card-' || lpad(card_number::text, 2, '0'),
    null,
    (100 + card_number * 2)::text || ' Sample Oak Drive',
    'Cullman',
    'AL',
    '35055',
    'https://ai-business-workforce.vercel.app/postcard-yard.png',
    'SAMPLE / PLACEHOLDER: clean and simple North Alabama curb-appeal concept for review workflow testing.',
    'https://ai-business-workforce.vercel.app/service-landscaping.png',
    'owner_upload',
    'print_source',
    'https://ai-business-workforce.vercel.app/postcard-yard.png',
    'sample_placeholder',
    'demo10-multitrade-v1',
    jsonb_build_object(
      'sample', true,
      'trade', 'landscaping',
      'scopeBullets', jsonb_build_array(
        'Define and edge front beds',
        'Add restrained evergreen structure',
        'Refresh mulch and limited seasonal color'
      ),
      'selectedCatalogItems', jsonb_build_array(
        jsonb_build_object('id', 'boxwood-dwarf', 'name', 'Dwarf boxwood', 'category', 'evergreen shrub'),
        jsonb_build_object('id', 'hydrangea-oakleaf', 'name', 'Oakleaf hydrangea', 'category', 'flowering shrub'),
        jsonb_build_object('id', 'mulch-brown-hardwood', 'name', 'Brown hardwood mulch', 'category', 'bed material')
      ),
      'catalogDisclosure',
      'Inspired by what a local Lowe''s garden center typically carries. Curated reference only — not a live store inventory feed.'
    ),
    'pending_review',
    'ready'
  from generate_series(1, 10) as card_number;
end
$$;

select
  campaigns.name,
  campaigns.id as campaign_id,
  count(campaign_recipients.id) as reviewable_cards
from public.campaigns
join public.campaign_recipients
  on campaign_recipients.campaign_id = campaigns.id
where campaigns.id = 'd0100000-0000-4000-8000-000000000010'
group by campaigns.name, campaigns.id;
