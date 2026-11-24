import { AVA_GUIDES } from '@/lib/ava/trade-pages';
import { MERGED_AVA_GUIDES } from '@/lib/seo/receptionist-home';
import { COMPETITORS } from '@/lib/er/competitors';
import { CALL_SCRIPTS } from '@/lib/er/call-scripts';
import { ER_TOOLS } from '@/lib/er/tools';

export type ErLink = { href: string; label: string; blurb?: string };

/** Main nav on every Executive Receptionist template. Every href is a real page. */
export const ER_NAV: ErLink[] = [
  { href: '/ava', label: 'Ava' },
  { href: '/industries', label: 'Industries' },
  { href: '/compare', label: 'Compare' },
  { href: '/tools', label: 'Free tools' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Guides' },
];

/** Stand-alone vertical pages (their own templates). */
export const ER_VERTICAL_PAGES: ErLink[] = [
  { href: '/hvac', label: 'HVAC', blurb: 'No-cool and no-heat calls, after hours and mid-repair.' },
  { href: '/dental', label: 'Dental offices', blurb: 'New-patient and appointment calls while the front desk is busy.' },
  { href: '/law', label: 'Law firms', blurb: 'Intake calls that come in while you are in court or with a client.' },
  { href: '/salon', label: 'Salons', blurb: 'Booking and hours questions while your hands are full.' },
  { href: '/auto-repair', label: 'Auto repair', blurb: 'No-start, drop-off and estimate calls from the bay.' },
  { href: '/med-spa', label: 'Med spas', blurb: 'Consult and booking questions after hours.' },
  { href: '/real-estate', label: 'Real estate', blurb: 'Showing and listing calls while you are out with clients.' },
  { href: '/business', label: 'Any small business', blurb: 'Offices and service companies that miss calls while the owner works.' },
];

function visibleGuides() {
  return AVA_GUIDES.filter((guide) => !(guide.slug in MERGED_AVA_GUIDES));
}

/** Trade answering-service pages under /ava. */
export function erTradeLinks(): ErLink[] {
  return visibleGuides()
    .filter((guide) => guide.kind === 'trade')
    .map((guide) => ({ href: `/ava/${guide.slug}`, label: guide.navLabel, blurb: guide.blurb }));
}

/** Topic guides under /ava (after hours, Spanish, local, buyer guides). */
export function erGuideLinks(): ErLink[] {
  return visibleGuides()
    .filter((guide) => guide.kind !== 'trade')
    .map((guide) => ({ href: `/ava/${guide.slug}`, label: guide.navLabel, blurb: guide.blurb }));
}

export function erCompareLinks(): ErLink[] {
  return COMPETITORS.map((c) => ({ href: `/compare/${c.slug}`, label: `Ava vs ${c.name}`, blurb: c.oneLine }));
}

export function erToolLinks(): ErLink[] {
  return ER_TOOLS.map((tool) => ({ href: tool.href, label: tool.label, blurb: tool.blurb }));
}

export function erTemplateLinks(): ErLink[] {
  return CALL_SCRIPTS.map((script) => ({ href: `/templates/${script.slug}`, label: script.navLabel, blurb: script.blurb }));
}

/** Footer columns. Every trade page and hub is linked from here so none are orphans. */
export function erFooterColumns(): { heading: string; links: ErLink[] }[] {
  return [
    { heading: 'Industries', links: [{ href: '/industries', label: 'All industries' }, ...ER_VERTICAL_PAGES, ...erTradeLinks()] },
    { heading: 'Compare', links: [{ href: '/compare', label: 'All comparisons' }, ...erCompareLinks()] },
    {
      heading: 'Free tools',
      links: [{ href: '/tools', label: 'All tools' }, ...erToolLinks(), { href: '/templates', label: 'Call scripts' }, ...erTemplateLinks()],
    },
    { heading: 'Guides', links: [{ href: '/blog', label: 'Blog' }, ...erGuideLinks()] },
    {
      heading: 'Company',
      links: [
        { href: '/', label: 'Home' },
        { href: '/ava', label: 'Meet Ava' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/receptionist/packages', label: 'Packages: Ava + Google profile' },
        { href: '/receptionist/book-a-demo', label: 'Book a demo' },
        { href: '/receptionist-demo', label: 'Demo' },
        { href: '/about', label: 'About' },
        { href: '/privacy', label: 'Privacy' },
        { href: '/terms', label: 'Terms' },
        { href: '/sms', label: 'SMS terms' },
        { href: '/sms-consent', label: 'SMS consent' },
        { href: '/desk', label: 'Log in' },
      ],
    },
  ];
}
