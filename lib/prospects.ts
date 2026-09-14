export type ProspectIndustry = 'HVAC' | 'Plumbing';

export type ProspectStatus =
  | 'queued'
  | 'contacted'
  | 'demo_sent'
  | 'opened'
  | 'called_ava'
  | 'replied'
  | 'conversation'
  | 'pilot_proposed'
  | 'passed';

export type SampleLeadSummary = {
  callerName: string;
  callerPhone: string;
  serviceType: string;
  address: string;
  urgency: string;
  summary: string;
  recommendedNextStep: string;
};

export type Prospect = {
  slug: string;
  companyName: string;
  ownerName: string;
  industry: ProspectIndustry;
  employees: string;
  phone: string;
  email?: string;
  website?: string;
  serviceArea: string;
  emergencyService: boolean;
  callCenterLikely: boolean;
  brandColor: string;
  accentColor: string;
  logoInitials: string;
  tagline: string;
  tasks: [string, string, string];
  sampleLead: SampleLeadSummary;
  personalizedDemo: boolean;
  outreachAngle: string;
  status: ProspectStatus;
};

export const PROSPECTS: Prospect[] = [
  {
    slug: 'acexperts',
    companyName: 'ACExperts',
    ownerName: 'Landon Jahnke',
    industry: 'HVAC',
    employees: '3–8',
    phone: '(251) 383-4822',
    website: 'https://www.acexperts251.com',
    serviceArea: 'Baldwin County, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#1a4d6e',
    accentColor: '#3b9fd9',
    logoInitials: 'AC',
    tagline: 'Owner-operated HVAC — answered live 24/7 across Baldwin County.',
    tasks: [
      'Answer after-hours AC and heating emergency calls when Landon is on a job site',
      'Capture caller name, address, system issue, and urgency before dispatch',
      'Send Landon a qualified lead summary so he can call back between jobs',
    ],
    sampleLead: {
      callerName: 'Karen Mitchell',
      callerPhone: '(251) 555-0142',
      serviceType: 'AC not cooling — upstairs unit blowing warm air',
      address: '1247 Bayview Dr, Daphne, AL 36526',
      urgency: 'Same-day — elderly parent in home, indoor temp 82°F',
      summary:
        'Karen called at 6:15 PM while the team was finishing a repair in Fairhope. Ava confirmed the upstairs unit is running but not cooling, noted the elderly occupant, and captured a callback number. Landon can prioritize this as a same-day comfort emergency.',
      recommendedNextStep: 'Call Karen back within 30 minutes and schedule a diagnostic visit.',
    },
    personalizedDemo: true,
    outreachAngle: 'Built a demo showing how Ava handles missed calls while you are on a Baldwin County job.',
    status: 'queued',
  },
  {
    slug: 'family-comfort-hvac',
    companyName: 'Family Comfort HVAC',
    ownerName: 'Aneil Panjwani',
    industry: 'HVAC',
    employees: '2–4',
    phone: '(205) 937-0088',
    website: 'https://familycomforthvac.com',
    serviceArea: 'Jefferson County & Birmingham, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#2d5016',
    accentColor: '#6fba44',
    logoInitials: 'FC',
    tagline: 'Two-person team — emergency HVAC when Birmingham homeowners need help fast.',
    tasks: [
      'Cover emergency calls when both technicians are on active jobs',
      'Qualify heating and cooling issues and collect property access details',
      'Deliver a structured lead summary to Aneil’s phone and email after each call',
    ],
    sampleLead: {
      callerName: 'Marcus Williams',
      callerPhone: '(205) 555-0198',
      serviceType: 'No heat — furnace clicking but not igniting',
      address: '892 Oak Ridge Rd, Birmingham, AL 35209',
      urgency: 'Tonight — family with small children, outdoor temp dropping',
      summary:
        'Marcus reported the furnace clicking repeatedly without igniting. Ava confirmed everyone is safe, captured the address in Oak Ridge, and flagged this as an after-hours heating emergency for a two-person crew.',
      recommendedNextStep: 'Return the call and dispatch for an emergency furnace diagnostic.',
    },
    personalizedDemo: true,
    outreachAngle: 'Your two-person team cannot be in two places at once — I built a demo for Family Comfort.',
    status: 'queued',
  },
  {
    slug: 'after-hours-hvacr',
    companyName: 'After Hours HVACR',
    ownerName: 'John M. King',
    industry: 'HVAC',
    employees: '4–12',
    phone: '(205) 994-6402',
    website: 'https://afterhourshvacr.com',
    serviceArea: 'Birmingham metro — Jefferson & Shelby Counties',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#1c2f4a',
    accentColor: '#e8a838',
    logoInitials: 'AH',
    tagline: 'Licensed contractor dispatch — after-hours HVAC across the Birmingham metro.',
    tasks: [
      'Handle overflow calls when John is on a complex repair and cannot answer',
      'Gather system type, symptoms, and appointment preferences before dispatch',
      'Send written lead summaries that match your “estimate before work begins” standard',
    ],
    sampleLead: {
      callerName: 'Diane Foster',
      callerPhone: '(205) 555-0173',
      serviceType: 'Heat pump frozen — outdoor unit iced over, no warm air inside',
      address: '4101 Valleydale Rd, Hoover, AL 35242',
      urgency: 'Within 2 hours — home office, needs heat restored tonight',
      summary:
        'Diane called at 8:40 PM reporting a frozen heat pump and no warm air. Ava documented the outdoor icing, confirmed she is working from home, and captured a direct callback number for John’s after-hours dispatch.',
      recommendedNextStep: 'Call Diane, confirm dispatch window, and provide a written estimate range.',
    },
    personalizedDemo: true,
    outreachAngle: 'Even after-hours specialists miss calls on the job — demo built for After Hours HVACR.',
    status: 'queued',
  },
  {
    slug: 'underwood-hvac',
    companyName: 'Underwood Heating & Air',
    ownerName: 'Joseph Underwood',
    industry: 'HVAC',
    employees: '3–10',
    phone: '(334) 555-0100',
    website: 'https://underwoodhvacpros.com',
    serviceArea: 'Phenix City & East Alabama',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#8b1a1a',
    accentColor: '#d94a4a',
    logoInitials: 'UH',
    tagline: 'EPA-certified, owner-led HVAC — upfront pricing and 24/7 emergency repairs.',
    tasks: [
      'Answer calls Joseph misses while running diagnostics in the field',
      'Explain your upfront-pricing approach and collect job details before scheduling',
      'Send lead summaries that include problem description, address, and urgency level',
    ],
    sampleLead: {
      callerName: 'Robert Chen',
      callerPhone: '(334) 555-0161',
      serviceType: 'AC compressor not starting — breaker keeps tripping',
      address: '156 Lee Road 270, Phenix City, AL 36867',
      urgency: 'Tomorrow morning preferred — rental property, tenant complaint',
      summary:
        'Robert manages a rental and reported the AC compressor tripping the breaker. Ava confirmed the tenant contacted him, captured the Lee Road address, and noted he wants upfront pricing before authorizing repair.',
      recommendedNextStep: 'Call Robert with a diagnostic fee quote and schedule a morning visit.',
    },
    personalizedDemo: true,
    outreachAngle: 'Built a quick demo so you can hear how Ava handles missed calls for Underwood HVAC.',
    status: 'queued',
  },
  {
    slug: 'posey-family-plumbing',
    companyName: 'Posey Family Plumbing',
    ownerName: 'Brian Posey',
    industry: 'Plumbing',
    employees: '3–6',
    phone: '(314) 620-4809',
    website: 'https://poseyfamilyplumbing.com',
    serviceArea: 'Washington, MO & Franklin, Jefferson, St. Charles Counties',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#1e3a5f',
    accentColor: '#4a90c2',
    logoInitials: 'PF',
    tagline: 'Call Brian directly — owner-operated plumbing across eastern Missouri.',
    tasks: [
      'Answer when Brian is under a house and cannot pick up the phone',
      'Handle burst pipe, water heater, and drain emergency intake questions',
      'Send Brian a lead summary with caller info so he can call back between jobs',
    ],
    sampleLead: {
      callerName: 'Linda Hartman',
      callerPhone: '(636) 555-0134',
      serviceType: 'Burst pipe under kitchen sink — water shut off but still leaking',
      address: '221 Main St, Washington, MO 63090',
      urgency: 'Immediate — water damage spreading to basement ceiling',
      summary:
        'Linda called while Brian was on another job. Ava confirmed the main shutoff is closed, documented active leaking into the basement, and captured her direct line for an emergency callback.',
      recommendedNextStep: 'Call Linda immediately and route to the Main St job as top priority.',
    },
    personalizedDemo: true,
    outreachAngle: 'You answer every call yourself — demo shows what happens when you physically cannot.',
    status: 'queued',
  },
  {
    slug: 'kcd-plumbing',
    companyName: 'KCD Plumbing',
    ownerName: 'Kevin Cronin',
    industry: 'Plumbing',
    employees: '4–8',
    phone: '(805) 555-0120',
    website: 'https://www.kcdplumbinginc.com',
    serviceArea: 'Santa Maria & Central Coast, CA',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#0d4f4f',
    accentColor: '#2ec4b6',
    logoInitials: 'KC',
    tagline: 'Family-owned Santa Maria plumbers — no call center, just the crew.',
    tasks: [
      'Cover weekend and after-hours calls when Kevin and Daniel are on jobs',
      'Qualify repipe, leak, and water heater emergencies before dispatch',
      'Send structured lead summaries to Kevin’s phone after every captured call',
    ],
    sampleLead: {
      callerName: 'James Ortiz',
      callerPhone: '(805) 555-0187',
      serviceType: 'Water heater leaking from base — pilot light out',
      address: '1842 N Western Ave, Santa Maria, CA 93458',
      urgency: 'Same day — garage flooding, needs shutoff guidance',
      summary:
        'James reported active leaking from the water heater base with the pilot out. Ava walked through safe shutoff steps, confirmed the leak location, and queued a same-day callback for Kevin’s crew.',
      recommendedNextStep: 'Call James, confirm shutoff status, and schedule replacement assessment.',
    },
    personalizedDemo: false,
    outreachAngle: 'No call center — demo shows how Ava covers nights and weekends for KCD.',
    status: 'queued',
  },
  {
    slug: 'owens-family-plumbing',
    companyName: 'Owens Family Plumbing',
    ownerName: 'Owens Family',
    industry: 'Plumbing',
    employees: '5–12',
    phone: '(815) 555-0145',
    website: 'https://owensfamilyplumbing.com',
    serviceArea: 'Joliet & Morris, IL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#1a365d',
    accentColor: '#3182ce',
    logoInitials: 'OF',
    tagline: 'Family-owned 24-hour emergency plumbers serving Will County.',
    tasks: [
      'Handle overnight emergency calls when the on-call tech is asleep or on a job',
      'Capture overflow, burst pipe, and sewer backup details for dispatch',
      'Send lead summaries formatted for your 24-hour emergency workflow',
    ],
    sampleLead: {
      callerName: 'Patricia Gomez',
      callerPhone: '(815) 555-0156',
      serviceType: 'Sewer backup — basement floor drain overflowing',
      address: '742 Maple Ave, Joliet, IL 60435',
      urgency: 'Immediate — raw sewage in finished basement',
      summary:
        'Patricia called at 11 PM with a basement sewer backup affecting a finished space. Ava flagged biohazard urgency, confirmed no one is using plumbing fixtures, and captured her callback number.',
      recommendedNextStep: 'Emergency dispatch — sewer backup with active overflow.',
    },
    personalizedDemo: false,
    outreachAngle: '24-hour service means every missed ring is a lost emergency job.',
    status: 'queued',
  },
  {
    slug: 'ray-esser-plumbing',
    companyName: 'Ray Esser & Sons Plumbing',
    ownerName: 'Ray Esser',
    industry: 'Plumbing',
    employees: '4–8',
    phone: '(440) 324-2018',
    website: 'https://esserplumbing.com',
    serviceArea: 'Elyria & Lorain County, OH',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#7c2d12',
    accentColor: '#ea580c',
    logoInitials: 'RE',
    tagline: 'Local Elyria plumbing — six-person team, no corporate call center.',
    tasks: [
      'Answer when all six techs are spread across Lorain County jobs',
      'Qualify drain, water heater, and repipe inquiries before scheduling',
      'Send the owner a lead summary with caller details and job type',
    ],
    sampleLead: {
      callerName: 'Tom Bradley',
      callerPhone: '(440) 555-0199',
      serviceType: 'Clogged main line — multiple fixtures backing up',
      address: '830 Walnut St area, Elyria, OH 44035',
      urgency: 'Today — only one bathroom in the house',
      summary:
        'Tom reported multiple fixtures backing up simultaneously. Ava confirmed it affects the only bathroom, captured the Walnut St area address, and flagged this as a main line priority.',
      recommendedNextStep: 'Call Tom and schedule main line jetting or camera inspection.',
    },
    personalizedDemo: false,
    outreachAngle: 'Six techs, one phone line — demo for Ray Esser & Sons.',
    status: 'queued',
  },
  {
    slug: 'rescue-air-blountsville',
    companyName: 'Rescue Air LLC',
    ownerName: 'Rescue Air Team',
    industry: 'HVAC',
    employees: '3–8',
    phone: '(205) 555-0110',
    serviceArea: 'Blountsville & North Alabama',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#0c4a6e',
    accentColor: '#38bdf8',
    logoInitials: 'RA',
    tagline: 'Owner-operated HVAC with direct accountability on every call.',
    tasks: [
      'Cover calls when the owner is on a rooftop unit repair',
      'Capture emergency AC and heating details for rural North Alabama addresses',
      'Send lead summaries with GPS-friendly directions when callers provide landmarks',
    ],
    sampleLead: {
      callerName: 'Betty Sanders',
      callerPhone: '(205) 555-0122',
      serviceType: 'AC completely out — 90°F day, single-wide mobile home',
      address: 'County Road 26 near Blountsville, AL',
      urgency: 'Same day — elderly homeowner, no backup cooling',
      summary:
        'Betty called from a mobile home off CR-26 with total AC failure on a hot day. Ava noted elderly occupant, no backup cooling, and captured landmark directions for rural dispatch.',
      recommendedNextStep: 'Priority same-day AC repair — elderly occupant, extreme heat.',
    },
    personalizedDemo: false,
    outreachAngle: 'Rural addresses and missed calls — built a demo for Rescue Air.',
    status: 'queued',
  },
  {
    slug: 'calvin-air-mobile',
    companyName: 'Calvin Air',
    ownerName: 'Calvin',
    industry: 'HVAC',
    employees: '3–10',
    phone: '(251) 555-0130',
    serviceArea: 'Mobile & Baldwin County, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#14532d',
    accentColor: '#22c55e',
    logoInitials: 'CA',
    tagline: 'Mobile-area emergency AC repair — owner on every job.',
    tasks: [
      'Handle calls Calvin misses during emergency compressor replacements',
      'Qualify coastal humidity and salt-air corrosion questions for dispatch',
      'Send lead summaries with equipment age and symptom details',
    ],
    sampleLead: {
      callerName: 'Steve Nguyen',
      callerPhone: '(251) 555-0144',
      serviceType: 'Outside unit not running — breaker OK, no humming sound',
      address: '4520 Government Blvd, Mobile, AL 36693',
      urgency: 'Today — home daycare, 6 children present',
      summary:
        'Steve runs a home daycare and reported the outdoor unit is completely silent. Ava flagged the childcare occupancy, confirmed breaker status, and captured a same-day callback request.',
      recommendedNextStep: 'Same-day dispatch — commercial occupancy with children present.',
    },
    personalizedDemo: false,
    outreachAngle: 'Home daycare cannot wait on voicemail — demo for Calvin Air.',
    status: 'queued',
  },
  {
    slug: 'comfort-zone-huntsville',
    companyName: 'Comfort Zone Heating & Cooling',
    ownerName: 'Owner-Operator',
    industry: 'HVAC',
    employees: '5–15',
    phone: '(256) 555-0155',
    serviceArea: 'Huntsville & Madison County, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#312e81',
    accentColor: '#818cf8',
    logoInitials: 'CZ',
    tagline: 'Madison County HVAC — emergency service without a call center.',
    tasks: [
      'Answer overflow calls during peak summer AC season',
      'Capture system age, brand, and failure symptoms for faster diagnostics',
      'Route qualified leads to the on-call technician with full context',
    ],
    sampleLead: {
      callerName: 'Angela Price',
      callerPhone: '(256) 555-0167',
      serviceType: 'Upstairs AC zone not cooling — rest of house fine',
      address: '7823 Bailey Cove Rd SE, Huntsville, AL 35802',
      urgency: 'This week — guest arriving Friday',
      summary:
        'Angela has a zoned system with only the upstairs failing. Ava documented the Trane system age (8 years), confirmed the rest of the house cools normally, and noted a Friday guest deadline.',
      recommendedNextStep: 'Schedule zone damper or thermostat diagnostic before Friday.',
    },
    personalizedDemo: false,
    outreachAngle: 'Peak season means missed calls — demo for Comfort Zone.',
    status: 'queued',
  },
  {
    slug: 'all-star-plumbing-decatur',
    companyName: 'All Star Plumbing',
    ownerName: 'Owner-Operator',
    industry: 'Plumbing',
    employees: '4–10',
    phone: '(256) 555-0178',
    serviceArea: 'Decatur & Morgan County, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#713f12',
    accentColor: '#f59e0b',
    logoInitials: 'AS',
    tagline: 'Decatur emergency plumbing — local crew, direct owner contact.',
    tasks: [
      'Cover after-hours calls when the crew is on emergency drain jobs',
      'Qualify slab leak, water heater, and gas line concerns before dispatch',
      'Send owner-ready lead summaries with photos-request prompts',
    ],
    sampleLead: {
      callerName: 'Greg Holloway',
      callerPhone: '(256) 555-0181',
      serviceType: 'Water pressure dropped suddenly — brown water from taps',
      address: '1205 6th Ave SW, Decatur, AL 35601',
      urgency: 'Tonight — possible main line break',
      summary:
        'Greg reported sudden pressure loss and discolored water across all fixtures. Ava flagged a possible main line issue, confirmed he shut off the main valve, and captured emergency callback info.',
      recommendedNextStep: 'Emergency call — possible main line break with water discoloration.',
    },
    personalizedDemo: false,
    outreachAngle: 'Brown water emergencies do not leave voicemail — demo for All Star.',
    status: 'queued',
  },
  {
    slug: 'premier-plumbing-florence',
    companyName: 'Premier Plumbing Services',
    ownerName: 'Owner-Operator',
    industry: 'Plumbing',
    employees: '3–8',
    phone: '(256) 555-0190',
    serviceArea: 'Florence & Shoals Area, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#164e63',
    accentColor: '#06b6d4',
    logoInitials: 'PP',
    tagline: 'Shoals-area plumbing — family business, phone-first customers.',
    tasks: [
      'Handle calls when both trucks are on opposite sides of the Shoals',
      'Capture well water and septic-specific questions common in rural jobs',
      'Send lead summaries with service history prompts for repeat customers',
    ],
    sampleLead: {
      callerName: 'Nancy Cooper',
      callerPhone: '(256) 555-0193',
      serviceType: 'Well pump cycling every 2 minutes — pressure tank issue suspected',
      address: '2840 County Road 47, Florence, AL 35633',
      urgency: 'This week — pump may burn out if not addressed',
      summary:
        'Nancy described rapid well pump cycling on a rural property. Ava captured CR-47 directions, noted the pressure tank symptom pattern, and flagged pump burnout risk if delayed.',
      recommendedNextStep: 'Schedule pressure tank and pump inspection within 48 hours.',
    },
    personalizedDemo: false,
    outreachAngle: 'Two trucks, wide service area — demo for Premier Plumbing.',
    status: 'queued',
  },
  {
    slug: 'southern-comfort-tuscaloosa',
    companyName: 'Southern Comfort HVAC',
    ownerName: 'Owner-Operator',
    industry: 'HVAC',
    employees: '5–12',
    phone: '(205) 555-0201',
    serviceArea: 'Tuscaloosa & West Alabama',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#7f1d1d',
    accentColor: '#ef4444',
    logoInitials: 'SC',
    tagline: 'West Alabama HVAC — game-day traffic and emergency calls, same small team.',
    tasks: [
      'Cover calls during UA game weekends when call volume spikes',
      'Handle dorm and rental property AC emergencies with tenant details',
      'Send lead summaries that include property manager contact when applicable',
    ],
    sampleLead: {
      callerName: 'University Properties LLC',
      callerPhone: '(205) 555-0204',
      serviceType: 'AC out in 4-plex — 3 of 4 units without cooling',
      address: '1800 McFarland Blvd E, Tuscaloosa, AL 35404',
      urgency: 'Today — tenants threatening lease violations',
      summary:
        'Property manager reported 3 of 4 units lost cooling simultaneously. Ava captured the McFarland Blvd address, tenant count, and lease violation threats for priority dispatch.',
      recommendedNextStep: 'Same-day multi-unit diagnostic — possible compressor or electrical issue.',
    },
    personalizedDemo: false,
    outreachAngle: 'Game weekends crush small HVAC teams — demo for Southern Comfort.',
    status: 'queued',
  },
  {
    slug: 'blue-flame-plumbing-bham',
    companyName: 'Blue Flame Plumbing',
    ownerName: 'Owner-Operator',
    industry: 'Plumbing',
    employees: '4–10',
    phone: '(205) 555-0210',
    serviceArea: 'Birmingham & Shelby County, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#1e40af',
    accentColor: '#3b82f6',
    logoInitials: 'BF',
    tagline: 'Birmingham emergency plumbing — owner answers, until he cannot.',
    tasks: [
      'Handle calls during long commercial repipe jobs',
      'Qualify gas leak and water heater emergencies with safety checklists',
      'Send lead summaries formatted for your commercial vs residential routing',
    ],
    sampleLead: {
      callerName: 'Mike Sullivan',
      callerPhone: '(205) 555-0213',
      serviceType: 'Gas smell near water heater — mild odor in utility room',
      address: '3201 Independence Dr, Birmingham, AL 35209',
      urgency: 'Immediate — gas odor reported',
      summary:
        'Mike reported a mild gas smell near the water heater. Ava confirmed he opened windows, avoided switches and flames, and flagged this as a gas safety emergency requiring immediate callback.',
      recommendedNextStep: 'Emergency callback — gas odor near water heater. Advise to wait outside if smell intensifies.',
    },
    personalizedDemo: false,
    outreachAngle: 'Gas emergencies cannot go to voicemail — demo for Blue Flame.',
    status: 'queued',
  },
  {
    slug: 'delta-hvac-montgomery',
    companyName: 'Delta HVAC Services',
    ownerName: 'Owner-Operator',
    industry: 'HVAC',
    employees: '6–15',
    phone: '(334) 555-0220',
    serviceArea: 'Montgomery & River Region, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#065f46',
    accentColor: '#10b981',
    logoInitials: 'DH',
    tagline: 'River Region HVAC — commercial rooftops and residential emergencies.',
    tasks: [
      'Cover commercial emergency calls when the crew is on a rooftop unit',
      'Capture RTU model numbers and failure symptoms for parts ordering',
      'Send lead summaries with tenant impact details for commercial properties',
    ],
    sampleLead: {
      callerName: 'Riverfront Office Park',
      callerPhone: '(334) 555-0223',
      serviceType: 'Rooftop unit down — suite 200 at 78°F and rising',
      address: '100 Commerce St, Montgomery, AL 36104',
      urgency: 'Within 4 hours — medical office waiting room affected',
      summary:
        'Office manager reported RTU failure affecting suite 200 with rising temps. Ava captured the medical office context, current temperature, and requested RTU access details for rooftop dispatch.',
      recommendedNextStep: 'Commercial emergency — medical office occupancy, dispatch within 4 hours.',
    },
    personalizedDemo: false,
    outreachAngle: 'Rooftop emergencies while you are on another roof — demo for Delta HVAC.',
    status: 'queued',
  },
  {
    slug: 'patriot-plumbing-auburn',
    companyName: 'Patriot Plumbing',
    ownerName: 'Owner-Operator',
    industry: 'Plumbing',
    employees: '3–8',
    phone: '(334) 555-0230',
    serviceArea: 'Auburn & Opelika, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#991b1b',
    accentColor: '#dc2626',
    logoInitials: 'PP',
    tagline: 'Auburn-area plumbing — game day rentals and year-round emergencies.',
    tasks: [
      'Handle overflow calls during Auburn football weekends',
      'Qualify rental property and short-term rental plumbing emergencies',
      'Send lead summaries with property access codes when provided',
    ],
    sampleLead: {
      callerName: 'Sarah Kim',
      callerPhone: '(334) 555-0233',
      serviceType: 'Toilet overflowing in Airbnb — guests checking in at 4 PM',
      address: '425 S College St, Auburn, AL 36830',
      urgency: 'Before 4 PM — guest check-in deadline',
      summary:
        'Sarah manages a College St Airbnb with a toilet overflow and 4 PM guest arrival. Ava captured the access code, confirmed water shutoff status, and flagged the hard check-in deadline.',
      recommendedNextStep: 'Priority job — complete repair before 4 PM guest check-in.',
    },
    personalizedDemo: false,
    outreachAngle: 'Airbnb emergencies on game weekends — demo for Patriot Plumbing.',
    status: 'queued',
  },
  {
    slug: 'apex-hvac-gadsden',
    companyName: 'Apex Heating & Air',
    ownerName: 'Owner-Operator',
    industry: 'HVAC',
    employees: '4–10',
    phone: '(256) 555-0240',
    serviceArea: 'Gadsden & Etowah County, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#4338ca',
    accentColor: '#6366f1',
    logoInitials: 'AP',
    tagline: 'Etowah County HVAC — mountain homes, steep driveways, one crew.',
    tasks: [
      'Answer calls when the crew is on a mountain home install',
      'Capture driveway access and equipment location details for dispatch',
      'Send lead summaries with heating vs cooling priority for seasonal routing',
    ],
    sampleLead: {
      callerName: 'Frank Delaney',
      callerPhone: '(256) 555-0243',
      serviceType: 'Heat pump aux heat running constantly — electric bill doubled',
      address: 'Lookout Mountain Pkwy, Gadsden, AL 35904',
      urgency: 'This week — steep driveway, need 4WD access confirmation',
      summary:
        'Frank reported aux heat running nonstop with a doubled electric bill. Ava noted the steep driveway access requirement and captured the Lookout Mountain address for 4WD-capable dispatch.',
      recommendedNextStep: 'Schedule diagnostic with 4WD vehicle — possible aux heat lockout or defrost issue.',
    },
    personalizedDemo: false,
    outreachAngle: 'Mountain access jobs take all day — demo for Apex Heating & Air.',
    status: 'queued',
  },
  {
    slug: 'quick-flow-plumbing-mobile',
    companyName: 'Quick Flow Plumbing',
    ownerName: 'Owner-Operator',
    industry: 'Plumbing',
    employees: '5–12',
    phone: '(251) 555-0250',
    serviceArea: 'Mobile & Spanish Fort, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#0369a1',
    accentColor: '#0ea5e9',
    logoInitials: 'QF',
    tagline: 'Coastal Alabama plumbing — hurricane season and daily emergencies.',
    tasks: [
      'Handle surge calls during tropical weather events',
      'Qualify flood-related plumbing and backflow emergencies',
      'Send lead summaries with insurance documentation prompts when relevant',
    ],
    sampleLead: {
      callerName: 'Carlos Mendez',
      callerPhone: '(251) 555-0253',
      serviceType: 'Sump pump failure during heavy rain — garage flooding',
      address: '7890 US-98, Spanish Fort, AL 36527',
      urgency: 'Immediate — active flooding during storm',
      summary:
        'Carlos reported sump pump failure with active garage flooding during heavy rain. Ava confirmed he is safe, documented water depth, and flagged insurance documentation may be needed.',
      recommendedNextStep: 'Emergency dispatch — active flooding, sump pump replacement likely.',
    },
    personalizedDemo: false,
    outreachAngle: 'Storm surge buries small plumbing crews — demo for Quick Flow.',
    status: 'queued',
  },
  {
    slug: 'elite-hvac-dothan',
    companyName: 'Elite Climate Control',
    ownerName: 'Owner-Operator',
    industry: 'HVAC',
    employees: '4–12',
    phone: '(334) 555-0260',
    serviceArea: 'Dothan & Wiregrass Region, AL',
    emergencyService: true,
    callCenterLikely: false,
    brandColor: '#4c1d95',
    accentColor: '#8b5cf6',
    logoInitials: 'EC',
    tagline: 'Wiregrass HVAC — peanut country heat, one team covering three counties.',
    tasks: [
      'Cover calls when both techs are in rural Wiregrass locations',
      'Capture crop dusting season AC filter and coil questions for ag properties',
      'Send lead summaries with property type (residential, ag, commercial) tags',
    ],
    sampleLead: {
      callerName: 'Wesley Farms',
      callerPhone: '(334) 555-0263',
      serviceType: 'Office AC out — farm office, computers overheating',
      address: 'CR-53 near Headland, AL 36345',
      urgency: 'Today — payroll processing deadline tomorrow',
      summary:
        'Farm office manager reported total AC failure with computers at risk. Ava captured CR-53 directions, noted the payroll deadline, and flagged commercial ag property type.',
      recommendedNextStep: 'Same-day dispatch — commercial ag office, equipment at risk.',
    },
    personalizedDemo: false,
    outreachAngle: 'Three-county coverage with one crew — demo for Elite Climate Control.',
    status: 'queued',
  },
];

export function getProspectBySlug(slug: string): Prospect | undefined {
  return PROSPECTS.find((p) => p.slug === slug);
}

export function getPersonalizedDemos(): Prospect[] {
  return PROSPECTS.filter((p) => p.personalizedDemo);
}

export function getProspectDemoUrl(slug: string, baseUrl?: string): string {
  const origin = baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${origin.replace(/\/$/, '')}/demo/${slug}`;
}

export function buildOutreachMessage(prospect: Prospect): string {
  return `Hi ${prospect.ownerName.split(' ')[0]} — I built a quick AI receptionist demo using ${prospect.companyName} so you can hear how it would handle a missed customer call. Want me to send it over?

${getProspectDemoUrl(prospect.slug)}`;
}
