export const EXECUTIVE_VOICES = [
  {
    slug: 'claire',
    name: 'Claire',
    detail: 'Default. Composed, clear, and unhurried.',
    isDefault: true,
  },
  {
    slug: 'eleanor',
    name: 'Eleanor',
    detail: 'Warm and steady, suited to a private practice.',
    isDefault: false,
  },
  {
    slug: 'james',
    name: 'James',
    detail: 'Low, measured, and formal.',
    isDefault: false,
  },
  {
    slug: 'sofia',
    name: 'Sofia',
    detail: 'Bright and precise.',
    isDefault: false,
  },
  {
    slug: 'margaret',
    name: 'Margaret',
    detail: 'Calm, senior, and unhurried.',
    isDefault: false,
  },
  {
    slug: 'david',
    name: 'David',
    detail: 'Even and professional.',
    isDefault: false,
  },
] as const;

export type ExecutiveVoiceSlug = (typeof EXECUTIVE_VOICES)[number]['slug'];

export const DEFAULT_EXECUTIVE_VOICE: ExecutiveVoiceSlug = 'claire';

export const EXECUTIVE_INDUSTRIES = [
  {
    slug: 'dental',
    name: 'Dentists',
    line: 'New-patient calls, hours, and what to bring — taken while the front desk is with someone in the chair.',
    sample: 'A caller at 6:40 p.m. asks whether the practice is accepting patients and which insurance names the office can repeat.',
  },
  {
    slug: 'law',
    name: 'Law firms',
    line: 'A name, a number, and the kind of matter, in the words you approve. No advice and no conflict check.',
    sample: 'An after-hours caller asks to speak with an attorney about a contract dispute and leaves a callback.',
  },
  {
    slug: 'med-spa',
    name: 'Med spas',
    line: 'Consult requests and treatment questions answered from the menu you write, not from a guess.',
    sample: 'A caller asks about a consultation, your hours, and whether a particular treatment is offered.',
  },
  {
    slug: 'cpa',
    name: 'CPAs',
    line: 'Tax-season overflow: who is calling, what they need, and when someone at the firm should return it.',
    sample: 'A client calls during filing season asking for a callback about an extension.',
  },
  {
    slug: 'financial',
    name: 'Financial advisors',
    line: 'A polished greeting and a callback request. No recommendations and no account numbers.',
    sample: 'A prospect asks to schedule a conversation about retirement and leaves a number.',
  },
  {
    slug: 'real-estate',
    name: 'Real estate',
    line: 'Showing requests and new inquiries captured while you are in a house with another client.',
    sample: 'A buyer calls about a listing, asks the next open window, and leaves a number for the agent.',
  },
  {
    slug: 'chiropractic',
    name: 'Chiropractors',
    line: 'New-patient calls and schedule questions, without collecting a clinical history on the phone.',
    sample: 'A new patient calls at lunch asking whether you are taking patients and what the first visit involves.',
  },
] as const;

export const EXECUTIVE_FAQS = [
  {
    q: 'Is this a person in the office?',
    a: 'No. Executive Receptionist is an AI phone receptionist. The greeting says so. You approve the words, the questions, and where the lead text goes.',
  },
  {
    q: 'Can a dental or medical office use it for charts?',
    a: 'No. It is not a HIPAA product. Use it for hours, location, and a callback. Do not collect health details, insurance member IDs, or clinical notes.',
  },
  {
    q: 'Will it give legal, tax, or investment advice?',
    a: 'No. It repeats the hours and the sentences you approve, then texts you the name, number, and the reason for the call. Advice stays with the professional.',
  },
  {
    q: 'Can I choose the voice?',
    a: 'Yes. Claire is the default. Five other voices are on this page. The audio files play from this site when they are published.',
  },
  {
    q: 'What does it cost?',
    a: 'Starter, Growth, and Pro are monthly plans after a free 7-day trial, with $0 setup. Included minutes and the per-minute rate after that are printed on each plan.',
  },
] as const;

export const EXAMPLE_NOTES = [
  {
    practice: 'Example dental practice',
    quote: 'The after-hours line used to ring through to voicemail. Now the office gets a name and a number before the morning huddle.',
  },
  {
    practice: 'Example law firm',
    quote: 'Callers hear a calm greeting and leave a matter in plain language. The attorney still decides whether to take the call back.',
  },
  {
    practice: 'Example advisory firm',
    quote: 'Lunchtime inquiries no longer sit in a full mailbox. The callback list is a text, not a stack of slips.',
  },
] as const;
