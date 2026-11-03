/** Prints before/after owner-alert SMS text, encoding, and segment counts. Run: pnpm sms:segments */
import { formatAvaLeadSmsBody, smsSegmentInfo } from '@/lib/ava/sms-format';

/** The pre-fix format, kept here only to show the before/after segment counts. */
function legacyLeadSmsBody(lead: {
  caller_name?: string | null;
  caller_phone?: string | null;
  service_job_type?: string | null;
  business_name?: string | null;
}) {
  return [
    'New Executive Receptionist lead',
    lead.caller_name,
    lead.service_job_type,
    lead.caller_phone,
    lead.business_name,
  ]
    .filter(Boolean)
    .join(' \u2014 ')
    .slice(0, 320);
}


const samples = {
  typical: {
    caller_name: 'Dana Whitfield',
    caller_phone: '+12565550142',
    service_job_type: 'No heat',
    business_name: 'Porchlight Heating & Air',
  },
  'typical with a dash and curly apostrophe': {
    caller_name: 'Dana Whitfield',
    caller_phone: '+12565550142',
    service_job_type: 'No heat \u2014 furnace won\u2019t start',
    business_name: 'Porchlight Heating & Air',
  },
  'long fields': {
    caller_name: 'Bartholomew Featherstonehaugh-Montgomery the Third',
    caller_phone: '+12565550142',
    service_job_type:
      'Furnace will not ignite, strange clicking noise, and a smell of burning dust from the vents',
    business_name: 'Porchlight Heating & Air Conditioning and Plumbing of North Alabama LLC',
  },
};

for (const [label, lead] of Object.entries(samples)) {
  const before = legacyLeadSmsBody(lead);
  const after = formatAvaLeadSmsBody(lead);
  const b = smsSegmentInfo(before);
  const a = smsSegmentInfo(after);
  console.log(`\n== ${label}`);
  console.log(`BEFORE [${b.encoding}, ${b.length} units, ${b.segments} segment(s)]\n  ${before}`);
  console.log(`AFTER  [${a.encoding}, ${a.length} units, ${a.segments} segment(s)]\n  ${after}`);
}
