-- Run after creating the contractor in Supabase Authentication.
-- Replace the email and public app URL before running this in the Supabase SQL Editor.
do $$
declare
  contractor_id uuid;
  demo_campaign_id uuid;
begin
  select id
  into contractor_id
  from auth.users
  where email = 'contractor@example.com';

  if contractor_id is null then
    raise exception 'Create the contractor@example.com Auth user first, or replace the email in this file.';
  end if;

  insert into public.campaigns (
    owner_id,
    name,
    business_name,
    business_phone,
    business_email,
    status
  )
  values (
    contractor_id,
    'Founding campaign demo',
    'Cole''s Landscaping',
    '(555) 555-0123',
    'contractor@example.com',
    'active'
  )
  returning id into demo_campaign_id;

  insert into public.campaign_recipients (
    campaign_id,
    homeowner_name,
    address_line_1,
    city,
    state,
    postal_code,
    concept_summary
  )
  values
    (
      demo_campaign_id,
      'Jamie',
      '101 Oak Street',
      'Raleigh',
      'NC',
      '27601',
      'A refreshed front bed with clean edging, evergreen structure, and seasonal color.'
    ),
    (
      demo_campaign_id,
      'Taylor',
      '103 Oak Street',
      'Raleigh',
      'NC',
      '27601',
      'A low-maintenance landscape concept designed to sharpen the home''s curb appeal.'
    ),
    (
      demo_campaign_id,
      null,
      '105 Oak Street',
      'Raleigh',
      'NC',
      '27601',
      'A practical front-yard update with defined planting beds and fresh mulch.'
    );
end $$;

-- Copy each resulting URL into Canva's QR Code app.
select
  campaign_recipients.address_line_1,
  'https://your-production-domain.com/q/' || campaign_recipients.public_token as qr_url
from public.campaign_recipients
join public.campaigns on campaigns.id = campaign_recipients.campaign_id
where campaigns.name = 'Founding campaign demo'
order by campaign_recipients.address_line_1;
