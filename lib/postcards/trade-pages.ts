export type PostcardTrade = { slug: string; trade: string; plural: string; concept: string; hooks: string[] };

export const POSTCARD_TRADES: readonly PostcardTrade[] = [
  { slug: 'landscaping', trade: 'landscaping', plural: 'landscapers', concept: 'a front-yard planting bed, edging, and fresh mulch', hooks: ['Spring and fall refreshes', 'Curb appeal before a home sale', 'Overgrown beds and bare spots'] },
  { slug: 'lawn-care', trade: 'lawn care', plural: 'lawn care companies', concept: 'a thick, striped lawn with clean edges', hooks: ['Thin or patchy lawns', 'Weekly mowing routes on the same street', 'Aeration and overseeding season'] },
  { slug: 'hardscaping', trade: 'hardscaping', plural: 'hardscape contractors', concept: 'a paver patio, walkway, or retaining wall', hooks: ['Backyards with no patio', 'Cracked concrete walkways', 'Sloped yards that need a wall'] },
  { slug: 'fencing', trade: 'fence', plural: 'fence companies', concept: 'a new privacy or picket fence along the property line', hooks: ['Leaning or missing fence panels', 'New homeowners with dogs', 'Corner lots with no privacy'] },
  { slug: 'roofing', trade: 'roofing', plural: 'roofers', concept: 'a new architectural shingle or metal roof', hooks: ['Older roofs in the same subdivision', 'Post-storm neighborhoods', 'Homes preparing to sell'] },
  { slug: 'exterior-painting', trade: 'exterior painting', plural: 'exterior painters', concept: 'a fresh exterior color, trim, and front door', hooks: ['Faded siding and trim', 'Dated color schemes', 'Peeling paint on older homes'] },
  { slug: 'pressure-washing', trade: 'pressure washing', plural: 'pressure washing companies', concept: 'clean driveways, siding, and walkways', hooks: ['Stained driveways', 'Green siding on shaded sides', 'Spring cleanup'] },
  { slug: 'pool-installation', trade: 'pool', plural: 'pool builders', concept: 'a backyard pool and deck', hooks: ['Large backyards with no pool', 'Neighborhoods where pools are common', 'Pre-summer planning season'] },
  { slug: 'outdoor-lighting', trade: 'outdoor lighting', plural: 'outdoor lighting installers', concept: 'path, uplighting, and holiday lighting', hooks: ['Dark front walks', 'Holiday lighting season', 'Homes with strong architecture'] },
  { slug: 'tree-service', trade: 'tree service', plural: 'tree service companies', concept: 'trimmed trees and cleared overhanging limbs', hooks: ['Limbs over roofs and driveways', 'Dead or leaning trees', 'Post-storm cleanup'] },
];

export const getPostcardTrade = (slug: string) => POSTCARD_TRADES.find((t) => t.slug === slug);

const POSTCARD_TRADE_SEO: Record<string, { title: string; description: string }> = {
  landscaping: {
    title: 'Landscaping Postcards Mailed for You, $3.54',
    description:
      'Addressed landscaping postcards show each home a planting concept, with a QR code to request an estimate. Mailed for you from $3.54.',
  },
  'lawn-care': {
    title: 'Lawn Care Postcards Mailed for You, $3.54 a Card',
    description:
      'Addressed lawn care postcards show each home a lawn concept, with a QR code to request an estimate. Mailed for you from $3.54 a card.',
  },
  hardscaping: {
    title: 'Hardscape Postcards Mailed for You, from $3.54',
    description:
      'Addressed hardscape postcards show each home a patio or wall concept, with a QR code to request an estimate. Mailed from $3.54.',
  },
  fencing: {
    title: 'Fence Company Postcards Mailed for You, $3.54',
    description:
      'Addressed fence postcards show each home a fence concept, with a QR code to request an estimate. Mailed for you from $3.54.',
  },
  roofing: {
    title: 'Roofing Postcards Mailed for You, from $3.54',
    description:
      'Addressed roofing postcards show each home a roof concept, with a QR code to request an estimate. Mailed for you from $3.54.',
  },
  'exterior-painting': {
    title: 'Exterior Painting Postcards, Mailed from $3.54',
    description:
      'Addressed painting postcards show each home a color concept, with a QR code to request an estimate. Mailed for you from $3.54.',
  },
  'pressure-washing': {
    title: 'Pressure Washing Postcards, Mailed from $3.54',
    description:
      'Addressed pressure-washing postcards show each home a clean exterior, with a QR code to request an estimate. Mailed from $3.54.',
  },
  'pool-installation': {
    title: 'Pool Builder Postcards Mailed for You, $3.54',
    description:
      'Addressed pool postcards show each home a backyard pool concept, with a QR code to request an estimate. Mailed from $3.54.',
  },
  'outdoor-lighting': {
    title: 'Outdoor Lighting Postcards, Mailed from $3.54',
    description:
      'Addressed lighting postcards show each home a lighting concept, with a QR code to request an estimate. Mailed for you from $3.54.',
  },
  'tree-service': {
    title: 'Tree Service Postcards Mailed for You, $3.54',
    description:
      'Addressed tree-service postcards show each home trimmed trees, with a QR code to request an estimate. Mailed for you from $3.54.',
  },
};

export function postcardTradeSeo(slug: string) {
  return POSTCARD_TRADE_SEO[slug];
}

/**
 * Trade-specific copy for /postcards/[trade]. Each page answers the questions an owner in that
 * trade asks before mailing: when to mail, which homes, what the card shows, what to offer,
 * and what to avoid. Timing is typical for most of the US and shifts with local climate.
 * No response rates or results are claimed here.
 */
export type PostcardTradeDetail = {
  whenToMail: string;
  whichHomes: string;
  cardShows: string;
  offer: string;
  avoid: string;
  sizeTip: string;
  faqs: { q: string; a: string }[];
};

const POSTCARD_TRADE_DETAILS: Record<string, PostcardTradeDetail> = {
  landscaping: {
    whenToMail:
      'Mail in late winter, two to four weeks before spring planting starts, so the card lands while homeowners are planning the yard. A second run in late summer catches fall bed refreshes and mulch.',
    whichHomes:
      'Start with streets where you already maintain a property, so your trucks are a familiar sight. Homes with bare or overgrown front beds, and homes that just sold, are the strongest fits.',
    cardShows:
      'The front of that home with a planted bed, clean edging, and fresh mulch. Homeowners see their own house finished, not a stock photo of someone else’s.',
    offer:
      'Ask for a free design walk-through rather than a discount. It gives you a reason to visit and price the real job.',
    avoid:
      'Do not put a price on the card for a design you have not measured. Bed size and plant choice change the number too much.',
    sizeTip:
      'The 6×9 card shows more of the yard and is worth it for bigger installs. The 4×6 card is fine for mulch and refresh work.',
    faqs: [
      {
        q: 'Can I send landscaping postcards only to streets I already service?',
        a: 'Yes. You pick the streets. Starting where your crews already work keeps drive time down on the jobs that come back.',
      },
      {
        q: 'Will the card show plants that do not grow in my area?',
        a: 'You approve every design before it mails. If a concept shows the wrong plants, swap or regenerate it.',
      },
    ],
  },
  'lawn-care': {
    whenToMail:
      'Mail in late winter so the card arrives before the first mow, when homeowners pick a service for the season. Late summer is the second window, ahead of aeration and overseeding.',
    whichHomes:
      'Homes on the streets of your current route come first, because each new stop adds little drive time. Thin or patchy lawns next to well-kept ones are good targets.',
    cardShows:
      'That home’s lawn thick, striped, and edged along the walk and driveway.',
    offer:
      'Offer a free first-visit quote, or a route price for neighbors on the same street. Route density is where lawn care makes its margin.',
    avoid:
      'Do not mail a whole ZIP code at once. Mail a few streets, see who answers, then widen.',
    sizeTip:
      'The 4×6 card is usually enough for weekly mowing. Use 6×9 when you are selling a bigger lawn renovation.',
    faqs: [
      {
        q: 'Should lawn care postcards go to the same street as my current customers?',
        a: 'Usually yes. A new stop next to an existing one costs almost no extra drive time, so those leads are worth the most.',
      },
      {
        q: 'How do homeowners respond to the card?',
        a: 'They scan the QR code, which opens an estimate request page for your business. The request comes to you.',
      },
    ],
  },
  hardscaping: {
    whenToMail:
      'Mail in late winter and early spring, when homeowners plan outdoor projects and you are booking the season. A late-summer run catches fall patio and wall projects before the ground freezes.',
    whichHomes:
      'Backyards with no patio, cracked concrete walks, and sloped lots that need a wall. Newer subdivisions often have builder-grade concrete that owners want to replace.',
    cardShows:
      'A paver patio, walkway, or retaining wall on that property, so the owner can picture the finished space.',
    offer:
      'Offer an on-site design consult. Hardscape jobs are large enough that the visit is the real sale.',
    avoid:
      'Do not promise a finish date on the card. Material lead times and weather move the schedule.',
    sizeTip:
      'Use the 6×9 card. Patio and wall concepts need the extra room to read clearly.',
    faqs: [
      {
        q: 'Is a postcard worth it for big hardscape jobs?',
        a: 'Compare the campaign total on this page to one average job. For most hardscape shops a single patio is larger than a 250-card run.',
      },
      {
        q: 'Can the card show a specific paver style?',
        a: 'You approve every design before it mails, and you can regenerate a concept that does not match what you install.',
      },
    ],
  },
  fencing: {
    whenToMail:
      'Mail in early spring, before homeowners with dogs and kids are outside all summer. Another run after a storm season catches damaged fence lines.',
    whichHomes:
      'Homes with leaning or missing panels, corner lots with no privacy, and recently sold homes where new owners have a dog to keep in.',
    cardShows:
      'A new privacy or picket fence along that home’s property line.',
    offer:
      'Offer a free measure and quote. Fence pricing depends on linear feet, so the measure is the step that closes the job.',
    avoid:
      'Do not suggest a fence line on the card that crosses a property line or ignores HOA rules. Keep the concept to the obvious yard.',
    sizeTip:
      'The 4×6 card works for most fence concepts. Use 6×9 for long runs or corner lots.',
    faqs: [
      {
        q: 'Who should get fence company postcards first?',
        a: 'New homeowners and homes with visibly damaged fencing. You choose the streets before anything mails.',
      },
      {
        q: 'Does the card include my license or HOA approval details?',
        a: 'No. Mention those on the call or in the quote. The card shows the concept and a QR code to request an estimate.',
      },
    ],
  },
  roofing: {
    whenToMail:
      'Mail in spring and early fall, before storm season and before winter. After a hail or wind event, mail the affected neighborhoods only after you have inspected the area.',
    whichHomes:
      'Older roofs in the same subdivision, where homes were built and roofed around the same year. Homes preparing to sell are another fit.',
    cardShows:
      'That home with a new architectural shingle or metal roof, so the owner sees the change from the street.',
    offer:
      'Offer a free roof inspection with photos. Owners trust a roofer who shows them the damage instead of telling them.',
    avoid:
      'Do not claim storm damage on the card. Many states restrict how roofers can solicit after storms. Check yours before a storm mailing.',
    sizeTip:
      'Use the 6×9 card. A roof replacement is a large purchase and the bigger image reads better.',
    faqs: [
      {
        q: 'Can I mail roofing postcards after a storm?',
        a: 'Yes, but check your state’s rules on post-storm solicitation first and keep the card to an inspection offer, not a damage claim.',
      },
      {
        q: 'Is direct mail worth it for roofers?',
        a: 'Compare the campaign total on this page to one replacement job. You decide from your own numbers, not ours.',
      },
    ],
  },
  'exterior-painting': {
    whenToMail:
      'Mail in late winter so the card lands while owners plan spring projects, ahead of the dry months painters book first.',
    whichHomes:
      'Homes with faded siding or peeling trim, older homes with dated colors, and homes being prepared for sale.',
    cardShows:
      'That home in a fresh exterior color, with painted trim and front door.',
    offer:
      'Offer a free color consult and estimate. Choosing a color is the step most owners put off.',
    avoid:
      'Do not promise an exact color match from a postcard image. Printed colors shift. Confirm with samples on site.',
    sizeTip:
      'Use the 6×9 card. Color changes need room to show.',
    faqs: [
      {
        q: 'Will the color on the card match the paint?',
        a: 'Not exactly. Printing shifts color. Use the card to start the conversation and confirm colors with samples on site.',
      },
      {
        q: 'Can I pick the color the card shows?',
        a: 'You approve every design before it mails, and you can regenerate concepts until the color direction fits.',
      },
    ],
  },
  'pressure-washing': {
    whenToMail:
      'Mail in early spring after pollen and winter grime build up, and again in late summer before fall gatherings.',
    whichHomes:
      'Homes with stained driveways, green siding on the shaded side, and dirty walkways. Streets where one neighbor’s clean driveway makes the others stand out are strong.',
    cardShows:
      'That home’s driveway, walkways, and siding cleaned, so the before and after is obvious.',
    offer:
      'Offer a driveway-and-walkway package price, or a discount when neighbors book the same day. Same-street jobs keep your rig in one place.',
    avoid:
      'Do not mail during a stretch of freezing weather. Owners will not book until it warms up.',
    sizeTip:
      'The 4×6 card is enough for driveway and siding concepts.',
    faqs: [
      {
        q: 'When should pressure washing companies send postcards?',
        a: 'Early spring and late summer are the usual windows. Mail a few streets at a time so you can work them in one trip.',
      },
      {
        q: 'Can I offer a neighbor discount on the card?',
        a: 'Yes. You approve the card copy before it mails.',
      },
    ],
  },
  'pool-installation': {
    whenToMail:
      'Mail in fall and winter. Pool builds are planned months ahead, and owners who sign in winter swim in summer.',
    whichHomes:
      'Large backyards with no pool, in neighborhoods where pools are already common.',
    cardShows:
      'A pool and deck in that home’s backyard, sized to the space you can see.',
    offer:
      'Offer a backyard design consult. A pool sale starts with layout and budget, not a coupon.',
    avoid:
      'Do not show a pool where setbacks, easements, or slope rule it out. Keep the concept realistic for the lot.',
    sizeTip:
      'Use the 6×9 card. The backyard concept needs the room.',
    faqs: [
      {
        q: 'When should pool builders mail postcards?',
        a: 'Fall and winter, so owners can plan, finance, and permit before summer.',
      },
      {
        q: 'Is one card enough for a pool sale?',
        a: 'Usually not. Plan a second card to the same homes a few weeks later. You choose the streets and quantities for each run.',
      },
    ],
  },
  'outdoor-lighting': {
    whenToMail:
      'Mail in late summer for landscape lighting, and in early fall for holiday lighting so owners book before the season fills.',
    whichHomes:
      'Homes with dark front walks, strong architecture, or mature trees that would light well.',
    cardShows:
      'That home at dusk with path lights, uplighting on the trees and front, or holiday lighting.',
    offer:
      'Offer a free evening demo. Lighting sells best when owners see it on their own house at night.',
    avoid:
      'Do not wait until late fall for holiday lighting cards. By then most owners have already booked or decided to skip it.',
    sizeTip:
      'Use the 6×9 card. Night lighting concepts need size to read.',
    faqs: [
      {
        q: 'When should outdoor lighting installers send holiday postcards?',
        a: 'Early fall, well before the holidays, so the card arrives while owners are still deciding.',
      },
      {
        q: 'Can one campaign cover both landscape and holiday lighting?',
        a: 'Run them separately. The timing and the offer are different, and each card should show one idea.',
      },
    ],
  },
  'tree-service': {
    whenToMail:
      'Mail in late winter, when bare branches make dead and overhanging limbs easy to see, and again before storm season.',
    whichHomes:
      'Homes with limbs over the roof or driveway, dead or leaning trees, and older neighborhoods with mature trees.',
    cardShows:
      'That home’s trees trimmed back, with limbs cleared from the roof and driveway.',
    offer:
      'Offer a free tree assessment. Owners worry about safety and cost, and an assessment answers both.',
    avoid:
      'Do not claim a tree is dangerous from a postcard image. Say so only after an on-site look.',
    sizeTip:
      'The 4×6 card works for trimming concepts. Use 6×9 for large removals.',
    faqs: [
      {
        q: 'When is the best time to mail tree service postcards?',
        a: 'Late winter, when bare trees show problem limbs, and before storm season.',
      },
      {
        q: 'Should the card mention storm damage?',
        a: 'Keep it to an assessment offer. Confirm any damage on site before you talk about it.',
      },
    ],
  },
};

export function postcardTradeDetail(slug: string): PostcardTradeDetail | undefined {
  return POSTCARD_TRADE_DETAILS[slug];
}
