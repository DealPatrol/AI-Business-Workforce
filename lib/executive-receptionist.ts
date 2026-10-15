export const EXECUTIVE_VOICES = [
  {
    slug: 'madison',
    name: 'Madison',
    detail: 'Polished, warm American female.',
    isDefault: true,
  },
  {
    slug: 'grace',
    name: 'Grace',
    detail: 'Mature and calm, for law and financial callers.',
    isDefault: false,
  },
  {
    slug: 'charlotte',
    name: 'Charlotte',
    detail: 'Crisp British.',
    isDefault: false,
  },
  {
    slug: 'james',
    name: 'James',
    detail: 'Smooth American male in his 40s.',
    isDefault: false,
  },
  {
    slug: 'bella',
    name: 'Bella',
    detail: 'Bright and upbeat, for dental and med spa.',
    isDefault: false,
  },
  {
    slug: 'ryan',
    name: 'Ryan',
    detail: 'Friendly, down-to-earth male.',
    isDefault: false,
  },
] as const;

export type ExecutiveVoiceSlug = (typeof EXECUTIVE_VOICES)[number]['slug'];

export const DEFAULT_EXECUTIVE_VOICE: ExecutiveVoiceSlug = 'madison';

export const EXECUTIVE_INDUSTRIES = [
  {
    slug: 'dental',
    name: 'Dentists',
    line: 'New-patient calls, hours, and what to bring — taken while the front desk is with someone in the chair.',
    sample: 'The receptionist asks about swelling or severe pain, offers two times, and confirms the visit.',
  },
  {
    slug: 'law',
    name: 'Law firms',
    line: 'A name, a number, and the kind of matter, in the words you approve. No advice and no conflict check.',
    sample: 'The receptionist asks whether the caller is safe and whether a police report was filed, then offers consultation times.',
  },
  {
    slug: 'med-spa',
    name: 'Med spas',
    line: 'Consult requests and treatment questions answered from the menu you write, not from a guess.',
    sample: 'The receptionist offers a complimentary consultation and two Saturday times.',
  },
  {
    slug: 'cpa',
    name: 'CPAs',
    line: 'Tax-season overflow: who is calling, what they need, and when someone at the firm should return it.',
    sample: 'The receptionist schedules a notice review and asks the caller to have the letter ready.',
  },
  {
    slug: 'financial',
    name: 'Financial advisors',
    line: 'A polished greeting and a callback request. No recommendations and no account numbers.',
    sample: 'The receptionist offers an introductory meeting, in person or by video.',
  },
  {
    slug: 'real-estate',
    name: 'Real estate',
    line: 'Showing requests and new inquiries captured while you are in a house with another client.',
    sample: 'The receptionist confirms the listing is available and offers two showing times.',
  },
  {
    slug: 'chiropractic',
    name: 'Chiropractors',
    line: 'New-patient calls and schedule questions, without collecting a clinical history on the phone.',
    sample: 'The receptionist asks about numbness and offers a new-patient visit the same day.',
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
    a: 'Yes. Madison is the default. Grace, Charlotte, James, Bella, and Ryan are the other voices on this page. Each clip is the receptionist’s side of a sample call.',
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
