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

export const EXECUTIVE_FOCUS_INDUSTRIES = [
  {
    slug: 'hvac',
    name: 'HVAC',
    line: 'No-cool and no-heat calls taken while both hands are on a repair — name, number, and what the system is doing.',
    sample: 'The receptionist asks whether the house has heat or cooling, what the system is doing, and when someone can be home.',
  },
  {
    slug: 'plumbing',
    name: 'Plumbing',
    line: 'Leak, no-hot-water, and clogged-line calls captured so you can call back and book the job yourself.',
    sample: 'The receptionist asks where the leak is, whether water can be shut off, and a callback number.',
  },
  {
    slug: 'roofing',
    name: 'Roofing',
    line: 'Storm-damage and active-leak calls taken while the crew is on a roof — name, number, and whether water is coming inside.',
    sample: 'The receptionist asks about missing shingles, interior dripping, and a time for an inspection.',
  },
  {
    slug: 'electrical',
    name: 'Electrical',
    line: 'No-power, breaker, and panel-upgrade calls captured while you are already in someone else’s panel.',
    sample: 'The receptionist checks for smoke or a burning smell, then takes the address and what went dark.',
  },
  {
    slug: 'auto-repair',
    name: 'Auto repair',
    line: 'No-start, breakdown, and drop-off calls taken while both hands are under a hood.',
    sample: 'The receptionist asks for the vehicle, whether it will start, and a drop-off window.',
  },
] as const;

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
    a: 'No. Executive Receptionist is an AI phone receptionist. The greeting says so. You approve the words, the questions, and the email the summary is sent to.',
  },
  {
    q: 'Can a dental or medical office use it for charts?',
    a: 'Not now. Dental offices, med spas, and law firms are on hold for a later wave. It is not a HIPAA product. Do not collect health details, insurance member IDs, or clinical notes.',
  },
  {
    q: 'Will it give legal, tax, or investment advice?',
    a: 'No. It repeats the hours and the sentences you approve, then emails you the name, number, and the reason for the call. Advice stays with the professional.',
  },
  {
    q: 'Can I choose the voice?',
    a: 'Yes. Madison is the default. Grace, Charlotte, James, Bella, and Ryan are the other voices on this page. Each clip is the receptionist’s side of a sample call.',
  },
  {
    q: 'What does it cost?',
    a: 'Free 14-day pilot, then $0 until the first booked job, then $25 per booked job, capped at $297 a month. Setup is in person in Gadsden.',
  },
  {
    q: 'Can I hear a demo for my kind of shop?',
    a: 'Yes. Play a sample HVAC, plumbing, roofing, electrical, or auto-repair call on this page, then talk to that receptionist in your browser. Your browser will ask for microphone permission. Each live demo is a fictional shop, not a real dispatch line.',
  },
] as const;

export const EXAMPLE_NOTES = [
  {
    practice: 'Example HVAC shop',
    quote: 'The after-hours no-cool line used to ring through to voicemail. Now the owner gets a name, a number, and what the system is doing by email.',
  },
  {
    practice: 'Example plumbing company',
    quote: 'Leak calls reach the owner as an emailed summary instead of a missed-call notification with no details.',
  },
  {
    practice: 'Example home-service shop',
    quote: 'Lunchtime inquiries no longer sit in a full mailbox. The callback list arrives by email, not a stack of slips.',
  },
] as const;
