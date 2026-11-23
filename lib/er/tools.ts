export type ErTool = { href: string; label: string; blurb: string };

export const ER_TOOLS: ErTool[] = [
  {
    href: '/ava/missed-call-cost-calculator',
    label: 'Missed-call cost calculator',
    blurb: 'Your calls, your job value, your close rate. See the monthly math.',
  },
  {
    href: '/tools/answering-service-cost-calculator',
    label: 'Answering service cost calculator',
    blurb: 'Compare a per-minute or per-call service with a flat monthly plan.',
  },
  {
    href: '/tools/call-forwarding-codes',
    label: 'Call forwarding codes',
    blurb: 'Verizon and T-Mobile dial codes, AT&T settings steps, from each carrier’s own page.',
  },
  {
    href: '/tools/after-hours-greeting-generator',
    label: 'After-hours greeting generator',
    blurb: 'Write a clear after-hours voicemail greeting for your shop in a minute.',
  },
];

/** Carrier forwarding steps, copied from each carrier's own support page on 2026-11-22. */
export const FORWARDING_CHECKED = 'November 22, 2026';

export type CarrierSteps = {
  carrier: string;
  sourceUrl: string;
  sourceLabel: string;
  note: string;
  codes: { what: string; on: (n: string) => string; off: string }[];
  steps?: string[];
};

export const CARRIERS: CarrierSteps[] = [
  {
    carrier: 'Verizon',
    sourceUrl: 'https://www.verizon.com/support/call-forwarding-faqs/',
    sourceLabel: 'verizon.com/support/call-forwarding-faqs',
    note: 'Verizon’s page gives these codes for mobile phones. You should hear a confirmation tone.',
    codes: [
      { what: 'Only calls you don’t answer', on: (n) => `*71${n}`, off: '*73' },
      { what: 'Every call', on: (n) => `*72${n}`, off: '*73' },
    ],
  },
  {
    carrier: 'T-Mobile',
    sourceUrl: 'https://www.t-mobile.com/support/plans-features/self-service-short-codes',
    sourceLabel: 't-mobile.com/support/plans-features/self-service-short-codes',
    note: 'T-Mobile lists these short codes. Its table writes the number as 1 plus the 10-digit number.',
    codes: [
      { what: 'Calls you don’t answer (no reply)', on: (n) => `**61*1${n}#`, off: '##61#' },
      { what: 'Calls while you’re on another call (busy)', on: (n) => `**67*1${n}#`, off: '##67#' },
      { what: 'Calls when your phone is off or out of signal', on: (n) => `**62*1${n}#`, off: '##62#' },
      { what: 'Every call', on: (n) => `**21*1${n}#`, off: '##21#' },
    ],
  },
  {
    carrier: 'AT&T',
    sourceUrl: 'https://www.att.com/support/article/wireless/KM1011513/',
    sourceLabel: 'att.com/support/article/wireless/KM1011513',
    note: 'AT&T’s support page does not publish dial codes. It says call forwarding is changed only from the phone itself, not online, and that forwarding overrides your voicemail.',
    codes: [],
    steps: [
      'Open your phone’s call settings and find Call forwarding (on iPhone and Android the menu names vary).',
      'Pick when to forward: always, when busy, when unanswered, or when unreachable, if your phone offers them.',
      'Enter the number you want calls sent to and turn it on.',
      'Call your number from another phone to test it.',
    ],
  },
];
