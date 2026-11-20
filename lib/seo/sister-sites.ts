/**
 * Official live sites Cole Collins operates. Used for footer "from the same maker"
 * lists, /about, and founder Organization/Person schema (owns), not as sameAs on
 * a single brand. Unrelated brands stay as name-only mentions; related ones may
 * also get a short descriptor.
 */
export type SisterCluster =
  | 'home-services'
  | 'reviews'
  | 'phone'
  | 'creator'
  | 'commerce'
  | 'gifts'
  | 'memorial'
  | 'devtools'
  | 'local-al'
  | 'other';

export type SisterSite = {
  name: string;
  url: string;
  blurb: string;
  clusters: SisterCluster[];
};

export const SISTER_SITES: SisterSite[] = [
  {
    name: 'Executive Receptionist',
    url: 'https://executivereceptionist.com',
    blurb: 'An AI receptionist named Ava for HVAC, plumbing, and other small businesses.',
    clusters: ['home-services', 'phone'],
  },
  {
    name: 'Front Porch Growth',
    url: 'https://frontporchgrowth.com',
    blurb: 'Postcards, Google profile setup, and local growth tools for home-service shops.',
    clusters: ['home-services', 'reviews'],
  },
  {
    name: 'ReputationFlow',
    url: 'https://tryreputationflow.com',
    blurb: 'Review-request links and QR codes for local businesses.',
    clusters: ['home-services', 'reviews'],
  },
  {
    name: 'AllInOneBio',
    url: 'https://allinonebio.com',
    blurb: 'A free link-in-bio page. Pro is $6 a month.',
    clusters: ['creator'],
  },
  {
    name: 'Creator Climb',
    url: 'https://getcreatorclimb.com',
    blurb: 'YouTube growth help for small channels.',
    clusters: ['creator'],
  },
  {
    name: 'Sell on Quay',
    url: 'https://sellonquay.com',
    blurb: 'Sell digital downloads on your own site for $12 a month, with 0% platform fees.',
    clusters: ['creator', 'commerce'],
  },
  {
    name: 'Custom Gifts Online',
    url: 'https://customgiftsonline.com',
    blurb: 'Personalized gifts, including custom lake maps and ornaments.',
    clusters: ['commerce', 'gifts'],
  },
  {
    name: 'Wick & Whisker',
    url: 'https://wickwhisker.com',
    blurb: 'Black-cat vintage gothic decor and gifts.',
    clusters: ['commerce', 'gifts'],
  },
  {
    name: 'The Hand Drawn Press',
    url: 'https://thehanddrawnpress.com',
    blurb: 'Hand drawn PNG designs for shirts and sublimation.',
    clusters: ['commerce', 'gifts', 'creator'],
  },
  {
    name: 'MemorialsQR',
    url: 'https://memorialsqr.com',
    blurb: 'Memorial QR codes for loved ones and pets.',
    clusters: ['memorial', 'gifts'],
  },
  {
    name: 'Tailkept',
    url: 'https://tailkept.com',
    blurb: 'A pet portrait turned into a keepsake.',
    clusters: ['gifts', 'memorial'],
  },
  {
    name: 'Dropship Scout',
    url: 'https://getdropshipscout.com',
    blurb: 'Dropshipping product research and margin checks.',
    clusters: ['commerce', 'devtools'],
  },
  {
    name: 'RepoFuse',
    url: 'https://repofuse.com',
    blurb: 'Find reusable apps hidden in your existing code.',
    clusters: ['devtools'],
  },
  {
    name: 'Mechanical Bull of the South',
    url: 'https://mechanicalbullofthesouth.com',
    blurb: 'Mobile mechanical bull rental from Hanceville, Alabama.',
    clusters: ['local-al'],
  },
  {
    name: 'Open Door Line',
    url: 'https://opendoorline.vercel.app',
    blurb: 'A 24/7 help line for churches.',
    clusters: ['phone'],
  },
  {
    name: 'NoSpamCalls',
    url: 'https://nospamcalls.vercel.app',
    blurb: 'Look up a spam number and learn how to stop the next one.',
    clusters: ['phone'],
  },
  {
    name: 'Ask Her Twice',
    url: 'https://askhertwice.com',
    blurb: 'Wear pink, ask twice, and care harder around postpartum crisis.',
    clusters: ['other'],
  },
];

export function siteByUrl(url: string) {
  const normalized = url.replace(/\/$/, '');
  return SISTER_SITES.find((site) => site.url.replace(/\/$/, '') === normalized);
}

export function relatedSisterSites(clusters: SisterCluster[], excludeUrl: string) {
  const exclude = excludeUrl.replace(/\/$/, '');
  const wanted = new Set(clusters);
  return SISTER_SITES.filter((site) => {
    if (site.url.replace(/\/$/, '') === exclude) return false;
    return site.clusters.some((cluster) => wanted.has(cluster));
  });
}

export function otherSisterSites(excludeUrl: string, alreadyListed: SisterSite[] = []) {
  const skip = new Set(
    [excludeUrl, ...alreadyListed.map((site) => site.url)].map((url) => url.replace(/\/$/, '')),
  );
  return SISTER_SITES.filter((site) => !skip.has(site.url.replace(/\/$/, '')));
}

/** Official live properties for founder/owner schema, not brand sameAs. */
export function ownedOrganizationNodes() {
  return SISTER_SITES.map((site) => ({
    '@type': 'Organization' as const,
    name: site.name,
    url: site.url,
  }));
}
