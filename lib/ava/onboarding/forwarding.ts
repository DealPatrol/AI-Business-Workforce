/**
 * Carrier call-forwarding codes for sending a business line to Ava.
 * GSM carriers (AT&T, T-Mobile and most MVNOs on them) use the standard ** codes, which also let the owner
 * set how long the phone rings before an unanswered call goes to Ava. Verizon uses *71/*72/*73 and does
 * not take a ring time by code. Landlines and VoIP systems use the provider's portal.
 */
export type CarrierKey = 'att' | 'tmobile' | 'verizon' | 'other';
export type ForwardMode = 'all' | 'missed';

export const CARRIERS: Array<{ key: CarrierKey; label: string }> = [
  { key: 'att', label: 'AT&T (and Cricket)' },
  { key: 'tmobile', label: 'T-Mobile (and Metro, Mint)' },
  { key: 'verizon', label: 'Verizon (and Visible)' },
  { key: 'other', label: 'Landline, VoIP, or another carrier' },
];

/** Ring times the ** no-answer code accepts, in seconds. About 6 seconds per ring. */
export const RING_SECONDS = [5, 10, 15, 20, 25, 30] as const;

export function digitsOnly(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
}

export function ringsLabel(seconds: number) {
  const rings = Math.max(1, Math.round(seconds / 6));
  return `about ${rings} ring${rings === 1 ? '' : 's'}`;
}

export type ForwardingSteps = {
  dial: string[];
  undo: string[];
  notes: string[];
};

export function forwardingSteps(carrier: CarrierKey, mode: ForwardMode, avaNumber: string, ringSeconds = 20): ForwardingSteps {
  const n = digitsOnly(avaNumber) || 'AVANUMBER';
  const seconds = (RING_SECONDS as readonly number[]).includes(ringSeconds) ? ringSeconds : 20;
  if (carrier === 'att' || carrier === 'tmobile') {
    if (mode === 'all') {
      return { dial: [`**21*${n}#`], undo: ['##21#'], notes: ['Every call goes straight to Ava. Your phone will not ring.'] };
    }
    return {
      dial: [`**61*${n}**${seconds}#`, `**67*${n}#`, `**62*${n}#`],
      undo: ['##61#', '##67#', '##62#'],
      notes: [
        `Your phone rings for ${seconds} seconds (${ringsLabel(seconds)}) first. If nobody answers, Ava picks up.`,
        'The second code sends calls to Ava when you are on another call; the third when your phone is off or out of signal.',
      ],
    };
  }
  if (carrier === 'verizon') {
    if (mode === 'all') {
      return { dial: [`*72${n}`], undo: ['*73'], notes: ['Press call after the code and wait for the confirmation tone.'] };
    }
    return {
      dial: [`*71${n}`],
      undo: ['*73'],
      notes: [
        'Calls go to Ava when you do not answer or are on another call.',
        'Verizon sets the ring time on its side (usually about 4 to 5 rings); it cannot be changed with a code.',
      ],
    };
  }
  return {
    dial: [],
    undo: [],
    notes: [
      mode === 'all'
        ? `In your phone provider’s portal or app, set “forward all calls” to ${formatUs(n)}.`
        : `In your phone provider’s portal or app, set “forward when busy / no answer” to ${formatUs(n)}, and pick how many rings first.`,
      'Most VoIP systems (RingCentral, Google Voice, Ooma, Comcast Business) have this under call forwarding or call handling.',
    ],
  };
}

export function formatUs(digits: string) {
  const d = digitsOnly(digits);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : digits;
}
