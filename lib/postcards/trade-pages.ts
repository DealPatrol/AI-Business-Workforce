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
