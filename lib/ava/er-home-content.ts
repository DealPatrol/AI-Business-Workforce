/**
 * Copy for the executivereceptionist.com home page.
 * Keep every claim to what Ava does in production today. Texting stays "coming" until
 * carrier registration is approved. Do not claim a live handoff to a person.
 */
import { AVA_OFFER } from '@/lib/ava/pricing';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';

export const ER_HOME_STEPS = [
  {
    title: 'Tell us about your shop',
    detail:
      'Send your website and a few notes: services, hours, service area, and what counts as urgent. Cole writes Ava’s greeting and questions from that.',
    chip: 'yourshop.com',
    chipNote: 'Services, hours, service area',
  },
  {
    title: 'Forward your line',
    detail:
      'Keep the number your customers already call. Forward every call, or only the ones you miss or can’t take while the line is busy.',
    chip: 'Your business line',
    chipNote: 'Forwarded to Ava',
  },
  {
    title: 'Every call gets answered',
    detail:
      'Ava picks up, says she is an AI receptionist, takes the details, and emails you a summary. Each call also lands in your Desk.',
    chip: 'New lead · summary emailed',
    chipNote: 'Name, number, address, the job',
  },
] as const;

export type ErFeature = {
  key: string;
  tab: string;
  title: string;
  body: string;
  status?: 'coming';
  mock: { label: string; lines: Array<{ who: 'caller' | 'ava' | 'note'; text: string }> };
};

export const ER_HOME_FEATURES: ErFeature[] = [
  {
    key: 'always-on',
    tab: '24/7 answering',
    title: 'Nights, weekends, and the middle of a repair',
    body: 'Ava answers the calls nobody in the shop can get to: after hours, on Sundays, and when you are already on another call. No voicemail box filling up while the next shop picks up.',
    mock: {
      label: 'Answered 11:42 PM · Sunday',
      lines: [
        { who: 'caller', text: 'Our AC quit and it’s 88 in the house.' },
        { who: 'ava', text: 'I’m sorry. Let’s get you on the list. What’s your name and the best number to reach you?' },
      ],
    },
  },
  {
    key: 'honest',
    tab: 'Says it’s AI',
    title: 'Honest from the first hello',
    body: 'Owners told us they want callers to know up front. Ava’s greeting says she is an AI receptionist for your business, in a natural voice you pick, then gets straight to helping.',
    mock: {
      label: 'Greeting you approve',
      lines: [
        { who: 'ava', text: 'Thanks for calling Porchlight Heating & Air. I’m Ava, the AI receptionist. How can I help?' },
      ],
    },
  },
  {
    key: 'intake',
    tab: 'Call summaries',
    title: 'A summary you can act on, every call',
    body: 'Ava asks the questions you would ask: name, callback number, address, and what is going on. She repeats the number back, then emails you a clean summary instead of a garbled voicemail.',
    mock: {
      label: 'Emailed to you',
      lines: [
        { who: 'note', text: 'Mark E. · 256-555-0148 · 412 Walnut St' },
        { who: 'note', text: 'AC blowing warm since this afternoon. Wants a morning visit.' },
      ],
    },
  },
  {
    key: 'booking',
    tab: 'Books the visit',
    title: 'Books into your calendar while the caller is on the line',
    body: 'Once your hours are set in your Desk, Ava checks what is actually open, offers a couple of windows, and reads the time back only after the booking is saved. If nothing fits, she takes the details for a callback.',
    mock: {
      label: 'Visit booked · saved to your Desk',
      lines: [
        { who: 'ava', text: 'I have Tuesday 8 to 10 or Tuesday 1 to 3. Which works?' },
        { who: 'caller', text: 'Morning, please.' },
        { who: 'ava', text: 'You’re booked for Tuesday, 8 to 10 AM.' },
      ],
    },
  },
  {
    key: 'urgent',
    tab: 'Urgent rules',
    title: 'You decide what counts as urgent',
    body: 'No heat in January, water running, a gas smell: write the rules once and Ava flags those calls at the top of the summary so they never wait in the pile.',
    mock: {
      label: 'Flagged urgent',
      lines: [
        { who: 'caller', text: 'Water is coming through the ceiling.' },
        { who: 'note', text: 'URGENT · active leak · 1912 Ridgeview' },
      ],
    },
  },
  {
    key: 'spanish',
    tab: 'English + Spanish',
    title: 'Answers in Spanish when the caller does',
    body: 'If a caller starts in Spanish, Ava switches and keeps going.',
    mock: {
      label: 'Switched to Spanish',
      lines: [
        { who: 'caller', text: 'Hola, ¿pueden venir mañana?' },
        { who: 'ava', text: 'Claro. ¿Me da su nombre y un número para llamarle?' },
      ],
    },
  },
  {
    key: 'desk',
    tab: 'Simple call log',
    title: 'Every call in one plain list',
    body: 'Your Desk shows each call Ava took with her summary, the transcript, and the recording, plus your leads and bookings. No dashboard to learn.',
    mock: {
      label: 'Your Desk',
      lines: [
        { who: 'note', text: '9:14 PM · No-cool · Mark E. · booked Tue 8–10' },
        { who: 'note', text: '7:02 PM · Price question · Dana R. · callback' },
      ],
    },
  },
  {
    key: 'texts',
    tab: 'Text confirmations',
    status: 'coming',
    title: 'Text confirmations after carrier approval',
    body: 'Booking confirmations by text are built and waiting on phone-carrier registration. Until that is approved, confirmations and lead alerts go out by email. We will tell you the day texts turn on.',
    mock: {
      label: 'Coming soon',
      lines: [{ who: 'note', text: 'You’re booked for Tue 8–10 AM. The team will confirm before the visit.' }],
    },
  },
];

export const ER_HOME_COMPARISON = {
  columns: ['Voicemail', 'Typical answering service', 'Executive Receptionist'],
  rows: [
    { label: 'Picks up 24/7, every time', values: ['No', 'Usually', 'Yes'] },
    { label: 'Asks your intake questions', values: ['No', 'A script', 'Yes, written for your shop'] },
    { label: 'Books the visit on the call', values: ['No', 'Sometimes', 'Yes, once your hours are set'] },
    { label: 'Tells callers it is AI', values: ['—', '—', 'Yes, in the greeting'] },
    { label: 'Summary of every call', values: ['A recording', 'A message', 'Email summary + transcript'] },
    { label: 'Pricing', values: ['Free', 'Varies by provider', 'Flat monthly plan, no overage fees'] },
  ],
} as const;

export const ER_HOME_TRY_LINES = [
  'My AC quit and it’s 88 in here',
  'Can someone come out tomorrow?',
  'How much is a service call?',
  '¿Hablan español?',
] as const;

export const ER_HOME_FAQS = [
  {
    q: 'Do I need a sales call first?',
    a: `No. Talk to Ava in your browser on this page or call the demo line at ${AVA_DEMO_LINE.display}, then pick a plan and check out. Cole follows up to set up your greeting and forwarding. If you would rather talk first, call ${AVA_OFFER.contactPhoneDisplay}.`,
  },
  {
    q: 'Does Ava pretend to be a person?',
    a: 'No. Her greeting says she is an AI receptionist for your business.',
  },
  {
    q: 'What does Ava do on a call?',
    a: 'She answers questions from the information you approve, takes the caller’s name, callback number, address, and what they need, flags anything that matches your urgent rules, and emails you a summary. Once your hours are set in your Desk, she can book the visit during the call.',
  },
  {
    q: 'How does booking work?',
    a: 'You set your hours and appointment windows in your Desk. Ava checks what is open during the call, offers a couple of windows, and reads the time back only after the booking saves. If the calendar cannot be reached or nothing fits, she takes the details so you can call back.',
  },
  {
    q: 'Can I keep my phone number?',
    a: 'Yes. Your carrier forwards calls to Ava. Forward every call, or only the ones you miss or can’t take while busy, so Ava covers overflow and after hours.',
  },
  {
    q: 'Will it text me or the caller?',
    a: 'Not yet. Text confirmations are built and turn on after phone-carrier registration is approved. Until then, summaries and lead alerts arrive by email.',
  },
  {
    q: 'What languages does she speak?',
    a: 'English and Spanish. She switches when the caller does.',
  },
  {
    q: 'What does it cost?',
    a: `${AVA_OFFER.summary} ${AVA_OFFER.overageNote}`,
  },
  {
    q: 'Is there a contract or a free trial?',
    a: 'No contract and no free trial. Plans are month to month and you can cancel anytime.',
  },
  {
    q: 'Can I hear the call history?',
    a: 'Yes. Your Desk lists every call Ava answered with her summary, the transcript, and the recording.',
  },
  {
    q: 'Is it HIPAA compliant?',
    a: 'No. Executive Receptionist is not a HIPAA product, so it should not collect health details, insurance IDs, or clinical notes.',
  },
] as const;
