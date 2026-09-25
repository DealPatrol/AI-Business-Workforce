import gardenCatalog from '@/lib/catalogs/local-garden-center.json';

export const TRADE_KEYS = [
  'landscaping',
  'roofing',
  'pressure_washing',
  'exterior_painting',
  'fencing',
  'tree_service',
  'hardscaping',
  'outdoor_lighting',
  'gutter',
  'concrete',
  'siding',
] as const;

export type TradeKey = (typeof TRADE_KEYS)[number];

export type CatalogChoice = {
  id: string;
  name: string;
  category: string;
  note: string;
};

export type ConceptProfile = {
  label: string;
  promptStyle: string;
  scopeTemplates: string[];
  catalogLabel: string;
  catalogDisclosure: string;
  choices: CatalogChoice[];
};

const CURATED_DISCLOSURE =
  'Curated design reference only — not live supplier inventory, availability, or pricing.';

const choices = (
  category: string,
  values: Array<[id: string, name: string, note: string]>,
): CatalogChoice[] => values.map(([id, name, note]) => ({ id, name, category, note }));

const gardenChoices: CatalogChoice[] = gardenCatalog.items.map((item) => ({
  id: item.id,
  name: item.commonName,
  category: item.category,
  note: item.look,
}));

export const CONCEPT_PROFILES: Record<TradeKey, ConceptProfile> = {
  landscaping: {
    label: 'Landscaping',
    promptStyle:
      'Clean and simple North Alabama curb appeal. Preserve the property, use realistic mature spacing, and avoid mansion-garden density.',
    scopeTemplates: ['Define and edge front beds', 'Add restrained evergreen structure', 'Refresh mulch and limited seasonal color'],
    catalogLabel: gardenCatalog.name,
    catalogDisclosure: gardenCatalog.disclosure,
    choices: gardenChoices,
  },
  roofing: {
    label: 'Roofing',
    promptStyle: 'Replace only visible roofing components. Preserve roof geometry and use a believable architectural-shingle finish.',
    scopeTemplates: ['Architectural shingle replacement', 'Coordinated ridge caps and flashing', 'Jobsite protection and cleanup'],
    catalogLabel: 'Curated roofing finish reference',
    catalogDisclosure: CURATED_DISCLOSURE,
    choices: choices('shingle finish', [
      ['roof-charcoal', 'Charcoal architectural shingle', 'Neutral dark gray dimensional finish.'],
      ['roof-weathered-wood', 'Weathered wood architectural shingle', 'Warm brown-gray dimensional finish.'],
      ['roof-pewter', 'Pewter gray architectural shingle', 'Mid-gray finish with subtle variation.'],
    ]),
  },
  pressure_washing: {
    label: 'Pressure Washing',
    promptStyle: 'Show cleaned existing surfaces only. Do not replace materials, recolor surfaces, or make wet concrete look painted.',
    scopeTemplates: ['Low-pressure house wash', 'Driveway and walkway surface clean', 'Final rinse and site check'],
    catalogLabel: 'Curated cleaning scope reference',
    catalogDisclosure: CURATED_DISCLOSURE,
    choices: choices('cleaning scope', [
      ['wash-house', 'House wash', 'Siding and trim cleaning concept.'],
      ['wash-concrete', 'Concrete surface clean', 'Drive and walk cleaning concept.'],
      ['wash-curb', 'Curb and entry detail', 'Small high-visibility finish pass.'],
    ]),
  },
  exterior_painting: {
    label: 'Exterior Painting',
    promptStyle: 'Repaint existing exterior surfaces with a restrained body, trim, and door palette. Preserve all structure and material texture.',
    scopeTemplates: ['Wash, scrape, and prepare surfaces', 'Apply coordinated body and trim colors', 'Finish front-door accent and touchups'],
    catalogLabel: 'Curated exterior color reference',
    catalogDisclosure: CURATED_DISCLOSURE,
    choices: choices('paint palette', [
      ['paint-warm-white', 'Warm white + soft black trim', 'Bright, simple neutral palette.'],
      ['paint-sage', 'Muted sage + cream trim', 'Low-saturation natural palette.'],
      ['paint-greige', 'Light greige + white trim', 'Familiar neutral refresh.'],
      ['paint-navy-door', 'Navy front-door accent', 'Restrained focal accent only.'],
    ]),
  },
  fencing: {
    label: 'Fencing',
    promptStyle: 'Add a buildable fence on a plausible property line. Keep gates, posts, and grade changes realistic.',
    scopeTemplates: ['Lay out fence and gate locations', 'Install posts, rails, and panels', 'Final alignment and cleanup'],
    catalogLabel: 'Curated fence style reference',
    catalogDisclosure: CURATED_DISCLOSURE,
    choices: choices('fence style', [
      ['fence-wood-privacy', 'Dog-ear wood privacy', 'Familiar six-foot privacy style.'],
      ['fence-horizontal', 'Horizontal wood privacy', 'Simple contemporary board layout.'],
      ['fence-black-aluminum', 'Black aluminum picket', 'Open-view ornamental finish.'],
      ['fence-vinyl-white', 'White vinyl privacy', 'Clean low-maintenance panel finish.'],
    ]),
  },
  tree_service: {
    label: 'Tree Service',
    promptStyle: 'Show conservative pruning or removal only where visually justified. Preserve healthy canopy and never invent mature replacement trees.',
    scopeTemplates: ['Remove dead or conflicting limbs', 'Thin and shape canopy conservatively', 'Haul debris and leave site clean'],
    catalogLabel: 'Curated tree-work scope reference',
    catalogDisclosure: CURATED_DISCLOSURE,
    choices: choices('tree scope', [
      ['tree-prune', 'Selective canopy pruning', 'Conservative structural cleanup.'],
      ['tree-lift', 'Canopy elevation', 'Clear low limbs where appropriate.'],
      ['tree-remove', 'Single-tree removal concept', 'Only for an operator-confirmed tree.'],
    ]),
  },
  hardscaping: {
    label: 'Hardscaping',
    promptStyle: 'Use a modest, buildable walkway or patio footprint with clean edges and restrained planting accents.',
    scopeTemplates: ['Prepare and compact base', 'Install pavers or stone to grade', 'Finish edges and restore adjacent beds'],
    catalogLabel: 'Curated hardscape and planting reference',
    catalogDisclosure: `${CURATED_DISCLOSURE} Plant choices use the North Alabama garden-center reference.`,
    choices: [
      ...choices('paver finish', [
        ['paver-charcoal', 'Charcoal concrete paver', 'Simple dark-gray modular finish.'],
        ['paver-tan', 'Warm tan concrete paver', 'Traditional warm neutral finish.'],
        ['gravel-crushed-stone', 'Compact crushed-stone path', 'Practical informal path finish.'],
      ]),
      ...gardenChoices.slice(0, 12),
    ],
  },
  outdoor_lighting: {
    label: 'Outdoor Lighting',
    promptStyle: 'Use a small number of warm low-voltage fixtures. Keep nighttime exposure natural and avoid resort-style overlighting.',
    scopeTemplates: ['Place path and facade fixtures', 'Route low-voltage cable and transformer', 'Aim fixtures and verify nighttime balance'],
    catalogLabel: 'Curated fixture style reference',
    catalogDisclosure: CURATED_DISCLOSURE,
    choices: choices('fixture style', [
      ['light-path-black', 'Matte black path light', 'Low warm pathway illumination.'],
      ['light-uplight-bronze', 'Bronze uplight', 'Restrained facade or tree accent.'],
      ['light-step', 'Recessed step light', 'Low-glare safety accent.'],
    ]),
  },
  gutter: {
    label: 'Gutter',
    promptStyle: 'Replace only gutters and downspouts, following the existing roofline with plausible drainage locations.',
    scopeTemplates: ['Remove existing gutter where required', 'Install seamless gutter and downspouts', 'Confirm drainage and clean the site'],
    catalogLabel: 'Curated gutter finish reference',
    catalogDisclosure: CURATED_DISCLOSURE,
    choices: choices('gutter finish', [
      ['gutter-white', 'White seamless aluminum', 'Clean light trim match.'],
      ['gutter-bronze', 'Dark bronze seamless aluminum', 'Warm dark trim match.'],
      ['gutter-black', 'Black seamless aluminum', 'Crisp dark roofline accent.'],
    ]),
  },
  concrete: {
    label: 'Concrete',
    promptStyle: 'Repair or add a modest, code-plausible concrete area. Preserve drainage, grade, structures, and planting.',
    scopeTemplates: ['Prepare subgrade and forms', 'Place and finish concrete', 'Control joints, cure, and cleanup'],
    catalogLabel: 'Curated concrete finish reference',
    catalogDisclosure: CURATED_DISCLOSURE,
    choices: choices('concrete finish', [
      ['concrete-broom', 'Natural broom finish', 'Practical slip-resistant finish.'],
      ['concrete-light-gray', 'Light gray smooth-border finish', 'Simple framed driveway or walk.'],
      ['concrete-exposed', 'Light exposed aggregate', 'Textured decorative finish.'],
    ]),
  },
  siding: {
    label: 'Siding',
    promptStyle: 'Replace siding while preserving openings, trim proportions, roof, masonry, and architectural details.',
    scopeTemplates: ['Remove and prepare affected siding', 'Install siding and weather details', 'Coordinate trim, sealants, and cleanup'],
    catalogLabel: 'Curated siding finish reference',
    catalogDisclosure: CURATED_DISCLOSURE,
    choices: choices('siding finish', [
      ['siding-white-lap', 'Warm white lap siding', 'Bright traditional horizontal finish.'],
      ['siding-sage-lap', 'Muted sage lap siding', 'Natural low-saturation finish.'],
      ['siding-gray-lap', 'Light gray lap siding', 'Simple cool-neutral finish.'],
      ['siding-board-batten', 'Board-and-batten accent', 'Use on one restrained facade area.'],
    ]),
  },
};

export function normalizeTrade(value: string | null | undefined): TradeKey {
  return TRADE_KEYS.includes(value as TradeKey) ? (value as TradeKey) : 'landscaping';
}

export function getConceptProfile(value: string | null | undefined): ConceptProfile {
  return CONCEPT_PROFILES[normalizeTrade(value)];
}

export function selectCatalogChoices(
  profile: ConceptProfile,
  requestedIds?: string[],
): CatalogChoice[] {
  const selectedIds = new Set(requestedIds?.slice(0, 12));
  const selected = profile.choices.filter((choice) => selectedIds.has(choice.id));
  return selected.length > 0 ? selected : profile.choices.slice(0, 5);
}
