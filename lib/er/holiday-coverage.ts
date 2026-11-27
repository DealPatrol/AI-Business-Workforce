import { CARRIERS } from '@/lib/er/tools';

/**
 * Holiday call coverage planner (executivereceptionist.com/tools/holiday-call-coverage-planner).
 * Everything runs in the browser. Dates are the 2026-27 calendar; weekdays checked by script.
 * Rules: no invented call-volume stats, no claims Ava texts anyone (text alerts are not live).
 */
export type HolidayDay = { id: string; label: string; date: string; weekday: string };

export const HOLIDAYS_2026: HolidayDay[] = [
  { id: 'christmas-eve', label: 'Christmas Eve', date: 'December 24, 2026', weekday: 'Thursday' },
  { id: 'christmas', label: 'Christmas Day', date: 'December 25, 2026', weekday: 'Friday' },
  { id: 'new-years-eve', label: 'New Year’s Eve', date: 'December 31, 2026', weekday: 'Thursday' },
  { id: 'new-years-day', label: 'New Year’s Day', date: 'January 1, 2027', weekday: 'Friday' },
];

export const HOLIDAY_PLANNER_PATH = '/tools/holiday-call-coverage-planner';

export type HolidayPlanInput = {
  shop: string;
  closedIds: string[];
  reopen: string;
  urgentMeans: string;
  carrier: string;
  forwardTo: string;
  safetyLine: boolean;
};

export type HolidayPlan = {
  closedDays: HolidayDay[];
  greeting: string;
  checklist: string[];
  forwardOn: string | null;
  forwardOff: string | null;
  carrierSteps: string[];
  carrierSource: { label: string; url: string } | null;
  receptionistNotes: string;
};

export function tenDigits(value: string) {
  const d = value.replace(/\D/g, '');
  const n = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  return n.length === 10 ? n : null;
}

function joinDays(days: HolidayDay[]) {
  const names = days.map((d) => `${d.label} (${d.weekday}, ${d.date})`);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function buildHolidayPlan(input: HolidayPlanInput): HolidayPlan {
  const shop = input.shop.trim() || '[Shop name]';
  const closedDays = HOLIDAYS_2026.filter((d) => input.closedIds.includes(d.id));
  const reopen = input.reopen.trim() || '[the day you reopen]';
  const urgent = input.urgentMeans.trim() || 'no heat, no water, or water leaking';
  const closedText = closedDays.length ? joinDays(closedDays) : '[the days you are closed]';

  const greeting = [
    `Thanks for calling ${shop}. Our office is closed for the holiday and we reopen ${reopen}.`,
    'Please stay on the line and tell us your name, callback number, address and what you need.',
    `If it is urgent, like ${urgent}, say so and we will put your call at the top of the list.`,
    input.safetyLine ? 'If you smell gas or anyone is in danger, hang up and call 911.' : '',
    'Thanks, and happy holidays.',
  ]
    .filter(Boolean)
    .join(' ');

  const carrier = CARRIERS.find((c) => c.carrier === input.carrier) ?? null;
  const number = tenDigits(input.forwardTo);
  const shown = number ?? '[10-digit number]';
  const everyCall = carrier?.codes.find((c) => /every call/i.test(c.what)) ?? null;
  const forwardOn = everyCall ? everyCall.on(shown) : null;
  const forwardOff = everyCall ? everyCall.off : null;

  const checklist = [
    `Pick your closed days: ${closedText}.`,
    'Update your Google Business Profile holiday hours so the map listing matches what callers will hear.',
    `Decide what counts as urgent for your shop (for example: ${urgent}) and who calls those customers back first.`,
    forwardOn
      ? `Before you leave on your last open day, dial ${forwardOn} from the shop phone and listen for the confirmation tone.`
      : 'Before you leave on your last open day, turn on call forwarding from the shop phone (steps below).',
    'Call your shop number from a different phone and make sure it rings through.',
    forwardOff
      ? `When you open ${reopen}, dial ${forwardOff} to turn forwarding off, then read the holiday call summaries first.`
      : `When you open ${reopen}, turn forwarding off and read the holiday call summaries first.`,
  ];

  const receptionistNotes = [
    `Business: ${shop}.`,
    `Closed: ${closedText}. Reopening ${reopen}.`,
    'On every call: get the caller’s name, callback number, service address and what they need.',
    `Mark as urgent: ${urgent}.`,
    'Do not promise a time a technician will arrive. Say the office will call back when it reopens, urgent calls first.',
    input.safetyLine ? 'Gas smell or danger: tell the caller to hang up and call 911.' : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    closedDays,
    greeting,
    checklist,
    forwardOn,
    forwardOff,
    carrierSteps: carrier && !carrier.codes.length ? carrier.steps ?? [] : [],
    carrierSource: carrier ? { label: carrier.sourceLabel, url: carrier.sourceUrl } : null,
    receptionistNotes,
  };
}

export const HOLIDAY_FAQS = [
  {
    q: 'How do I cover my business phone over Christmas and New Year’s?',
    a: 'Pick the days you are closed, record a holiday greeting, and forward the shop line before you leave on your last open day. Forward to an answering service or an AI receptionist if you want callers to reach someone who takes their details instead of voicemail. Turn forwarding off when you reopen.',
  },
  {
    q: 'What days are Christmas and New Year’s in 2026?',
    a: 'Christmas Eve is Thursday, December 24, 2026 and Christmas Day is Friday, December 25. New Year’s Eve is Thursday, December 31, 2026 and New Year’s Day is Friday, January 1, 2027. Both holidays run into a weekend, so a shop closed Friday may not reopen until Monday.',
  },
  {
    q: 'What should a holiday voicemail greeting say?',
    a: 'Your shop name, that you are closed for the holiday, the day you reopen, what to leave (name, callback number, address, what they need), how to flag an urgent call, and a 911 line for gas or danger. Keep it under 30 seconds.',
  },
  {
    q: 'Does Executive Receptionist charge extra on holidays?',
    a: 'No. Plans are a flat monthly price with included minutes, and holidays count the same as any other day. Overflow is $25 a month with 60 minutes and is the only plan with per-minute overage ($1.00 a minute after 60). Starter is $79 a month with 100 minutes, and its first month is $1.',
  },
  {
    q: 'Can I use Ava only for the holidays?',
    a: 'Plans are month to month, so you can start before the holidays and cancel after. You keep your own number and forward calls to Ava only when you want her to answer.',
  },
  {
    q: 'Does Ava text me or the caller over the holiday?',
    a: 'Not today. Ava answers, takes the details and emails you a summary after each call. Text alerts stay off until phone-carrier (10DLC) registration is approved.',
  },
];

export const HOLIDAY_HOWTO_STEPS = [
  { name: 'Pick your closed days', text: 'Choose which of Christmas Eve, Christmas Day, New Year’s Eve and New Year’s Day the shop is closed, and the day you reopen.' },
  { name: 'Write the holiday greeting', text: 'Say you are closed, when you reopen, what to leave, how to flag an urgent call, and the 911 line for gas or danger.' },
  { name: 'Match your Google hours', text: 'Set holiday hours on your Google Business Profile so the listing matches what callers hear.' },
  { name: 'Forward the line before you leave', text: 'Turn on call forwarding from the shop phone on your last open day, to an answering service or AI receptionist.' },
  { name: 'Test it', text: 'Call the shop number from another phone and make sure it reaches the greeting or receptionist.' },
  { name: 'Turn forwarding off when you reopen', text: 'Dial the off code or change the phone setting back, then call back urgent callers first.' },
];
