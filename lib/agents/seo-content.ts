import type { AgentId } from '@/lib/agents/catalog';

/**
 * Search copy for each free writing agent page (/agents/[slug]).
 * Titles name the search people type ("review reply generator", "follow-up text after an estimate").
 * Example drafts are hand-written to follow the same rules the agent follows:
 * no invented prices, licenses, review counts, or guarantees.
 */
export type AgentSeo = {
  metaTitle: string;
  metaDescription: string;
  intro: string;
  steps: string[];
  exampleInput: { label: string; value: string }[];
  exampleDraft: string;
  tips: string[];
  faqs: { q: string; a: string }[];
};

export const AGENT_SEO: Record<AgentId, AgentSeo> = {
  estimate: {
    metaTitle: 'Free Estimate Note Writer for Contractors',
    metaDescription:
      'Turn what the customer said into a short estimate note you can edit and send. Free, no login. It never adds a price you did not give it.',
    intro:
      'Paste what the customer told you on the phone. The estimate writer turns it into a short, clear note you can send by text or email after you edit it.',
    steps: [
      'Type your business name and trade.',
      'Paste what the customer said, in their words.',
      'Add prices only if you already publish them, such as a diagnostic fee. Leave the box blank otherwise.',
      'Edit the draft and send it yourself.',
    ],
    exampleInput: [
      { label: 'Business', value: 'Northside Heating' },
      { label: 'Trade', value: 'HVAC' },
      { label: 'What the customer said', value: 'No cool upstairs. Two-story house in Hanceville.' },
      { label: 'Prices', value: '(blank)' },
    ],
    exampleDraft:
      'Hi, this is Northside Heating. Thanks for calling about the upstairs not cooling. On a two-story home this can be airflow, refrigerant, or the system size, so we need to look at it before we can price the repair. We can come out to diagnose it and give you a firm number on site. Reply with a day that works.',
    tips: [
      'Keep the customer’s own words for the problem. It shows you listened.',
      'If you charge a trip or diagnostic fee, put it in the price box so it appears in the note.',
    ],
    faqs: [
      {
        q: 'Will the estimate writer make up a price?',
        a: 'No. If the price box is blank, the draft says the price depends on a visit and includes no dollar amount.',
      },
      {
        q: 'Is the estimate writer free?',
        a: 'Yes. It is free to use without an account. Use is rate-limited per network.',
      },
    ],
  },
  'review-reply': {
    metaTitle: 'Free Review Reply Generator for Home-Service Pros',
    metaDescription:
      'Paste a Google review and get a short public reply to edit. Free, no login. It does not post anything or invent details.',
    intro:
      'Paste a customer review and the star rating. The review reply writer drafts a short public reply, under 90 words, that you can edit and post yourself.',
    steps: [
      'Type your business name and the star rating.',
      'Paste the review text exactly as the customer wrote it.',
      'Say how you want to sound, such as short and plain.',
      'Edit the draft, then post it from your Google Business Profile.',
    ],
    exampleInput: [
      { label: 'Business', value: 'Cole’s Lawn Care' },
      { label: 'Rating', value: '5' },
      { label: 'Review', value: 'Showed up on time and the yard looks sharp.' },
      { label: 'Tone', value: 'Short and plain' },
    ],
    exampleDraft:
      'Thank you for the review. Glad the crew was on time and the yard looks sharp. We appreciate you trusting Cole’s Lawn Care with it and look forward to the next cut.',
    tips: [
      'Reply to every review, including short ones. Owners who answer look active to the next customer reading.',
      'For a bad review, thank them, take it offline with a phone number, and do not argue in public.',
    ],
    faqs: [
      {
        q: 'Does the review reply generator post to Google for me?',
        a: 'No. It returns a draft you copy. You post it from your own Google Business Profile.',
      },
      {
        q: 'Can it reply to a 1-star review?',
        a: 'Yes. It drafts a calm reply that thanks the customer without inventing details that are not in the review. Read it carefully before posting.',
      },
    ],
  },
  'job-ad': {
    metaTitle: 'Free Job Post and Ad Writer for Trade Businesses',
    metaDescription:
      'Draft a hiring post or a short service ad from facts you supply. Free, no login. It does not add pay, benefits, or licenses you did not list.',
    intro:
      'Give the role or offer and the facts that are true. The job and ad writer drafts one short hiring post or service ad that uses only those facts.',
    steps: [
      'Type your business name and trade.',
      'Name the role, such as crew lead, or the offer, such as a roof inspection ad.',
      'List only facts that are true: city, pay range if you want it public, license if you hold one.',
      'Edit the draft and post it where you hire or advertise.',
    ],
    exampleInput: [
      { label: 'Business', value: 'Peak Roofing' },
      { label: 'Trade', value: 'Roofing' },
      { label: 'Role', value: 'Crew lead' },
      { label: 'Facts', value: 'Cullman County. Year-round work. Must have a valid driver’s license.' },
    ],
    exampleDraft:
      'Peak Roofing is hiring a crew lead in Cullman County. This is year-round work. You will run a roofing crew on residential jobs. A valid driver’s license is required. Call or message us to apply.',
    tips: [
      'Put the pay range in the facts if you are willing to publish it. Posts with pay usually get more serious applicants.',
      'Leave out anything you cannot back up, such as benefits you do not offer yet.',
    ],
    faqs: [
      {
        q: 'Will the job ad writer add benefits I did not list?',
        a: 'No. It is told to use only the facts you give it and to leave out pay, benefits, and licenses that are not in your notes.',
      },
      {
        q: 'Can it write a service ad instead of a job post?',
        a: 'Yes. Put the offer in the role box, such as a fall gutter cleaning ad, and list the true facts.',
      },
    ],
  },
  'follow-up': {
    metaTitle: 'Free Follow-Up Text Writer After an Estimate',
    metaDescription:
      'Draft a short follow-up text for a quote that went quiet. Free, no login. It drafts the text only and never sends it.',
    intro:
      'Describe the quote that went quiet and what you want the customer to do next. The follow-up writer drafts one text under 320 characters for you to copy and send.',
    steps: [
      'Type your business name and the customer’s first name if you want it used.',
      'Say what happened, such as a quote sent Tuesday with no reply.',
      'Say what you want them to do, such as reply with an install day.',
      'Copy the draft into your own phone and send it.',
    ],
    exampleInput: [
      { label: 'Business', value: 'Harbor Plumbing' },
      { label: 'Customer', value: 'Maria' },
      { label: 'What happened', value: 'We quoted a water heater Tuesday and have not heard back.' },
      { label: 'Ask', value: 'Reply with a day for the install' },
    ],
    exampleDraft:
      'Hi Maria, it’s Harbor Plumbing following up on the water heater quote from Tuesday. If you’d like to go ahead, reply with a day that works for the install and we’ll get you on the schedule.',
    tips: [
      'Send the first follow-up a few days after the quote, not weeks.',
      'Ask for one specific thing, such as a day, so it is easy to answer.',
    ],
    faqs: [
      {
        q: 'Does the follow-up writer text my customer?',
        a: 'No. It returns a draft. You copy it and send it from your own phone.',
      },
      {
        q: 'How long is the follow-up text?',
        a: 'Under 320 characters, which is about two standard text messages.',
      },
    ],
  },
  'service-page': {
    metaTitle: 'Free Service-Area Page Writer for Local Trades',
    metaDescription:
      'Draft one honest service page for a city you really work in. Free, no login. No fake rankings, review counts, or stuffed city lists.',
    intro:
      'Name one city you serve and the jobs you really do there. The service-area page writer drafts a headline, two short sections, and a closing line for your website.',
    steps: [
      'Type your business name and service.',
      'Name one city you actually work in.',
      'List the jobs you really do there, and the ones you do not.',
      'Edit the draft, add your own photos and details, and publish it.',
    ],
    exampleInput: [
      { label: 'Business', value: 'Clean Halls Co.' },
      { label: 'Service', value: 'House cleaning' },
      { label: 'City', value: 'Hanceville, Alabama' },
      { label: 'Jobs', value: 'Recurring cleans and move-outs. No commercial kitchens.' },
    ],
    exampleDraft:
      'House Cleaning in Hanceville, Alabama\n\nRecurring cleans: Clean Halls Co. offers weekly and every-other-week house cleaning for homes in Hanceville.\n\nMove-out cleans: Moving out? We clean the home top to bottom so it is ready for the next owner or your deposit walk-through.\n\nWe do not clean commercial kitchens. Call Clean Halls Co. to set up a cleaning in Hanceville.',
    tips: [
      'Write one page per city you really serve. Copying the same page across dozens of towns can hurt more than it helps.',
      'Add a real photo from a job in that city and a line about where you are based.',
    ],
    faqs: [
      {
        q: 'Should I make a page for every town near me?',
        a: 'Only for towns where you really work and have something specific to say. Thin, copied city pages are what search engines treat as spam.',
      },
      {
        q: 'Will the page writer claim I rank number one?',
        a: 'No. It is told not to claim rankings or review counts, and to mention only the city and jobs you give it.',
      },
    ],
  },
  'invoice-reminder': {
    metaTitle: 'Free Payment Reminder Writer for Unpaid Invoices',
    metaDescription:
      'Draft a polite reminder for an invoice that is due or late. Free, no login. It does not email the customer or create an invoice.',
    intro:
      'Say what is due and when. The invoice reminder writer drafts a polite payment reminder you can send by text or email.',
    steps: [
      'Type your business name and the customer’s first name.',
      'Add the amount only if the invoice already shows it.',
      'Say what is due and when, such as invoice 1044 due Friday.',
      'Edit the draft and send it yourself.',
    ],
    exampleInput: [
      { label: 'Business', value: 'Northside Heating' },
      { label: 'Customer', value: 'James' },
      { label: 'Amount', value: '$480' },
      { label: 'What is due', value: 'Invoice 1044 for the April tune-up, due Friday.' },
    ],
    exampleDraft:
      'Hi James, this is Northside Heating. A friendly reminder that invoice 1044 for the April tune-up, $480, is due Friday. Let us know if you have any questions about it. Thank you for your business.',
    tips: [
      'Send the first reminder a day or two before the due date, not after.',
      'Include the invoice number so the customer can find it fast.',
    ],
    faqs: [
      {
        q: 'Does the reminder writer send the invoice?',
        a: 'No. It drafts the reminder text only. It does not email the customer or create an invoice.',
      },
      {
        q: 'What if I leave the amount blank?',
        a: 'The reminder leaves the dollar amount out and refers to the existing invoice instead.',
      },
    ],
  },
};

export function agentSeo(id: AgentId): AgentSeo {
  return AGENT_SEO[id];
}
