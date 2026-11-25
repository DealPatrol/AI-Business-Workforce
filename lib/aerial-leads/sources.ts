/**
 * Free public data sources for aerial postcard leads.
 *
 * Every source here is free and needs no key:
 * - Current imagery: USDA FPAC "conus_naip" ImageServer (latest NAIP; Alabama 2025 at 30 cm).
 * - Prior imagery: USDA NAIP 2023 CONUS ImageServer on imagery.geoplatform.gov (Alabama 2023 at 60 cm).
 *   NAIP is public domain (USDA Farm Service Agency).
 * - Parcels: Cullman County Revenue Commission tax parcels (KCS GIS) with owner + mailing address.
 * - Buildings: Cullman County "EV Buildings (2025)" footprints, keyed by parcel PIN.
 *
 * Add a county by adding one AerialArea entry. Nothing here spends money.
 */

export type ImagerySource = {
  /** Short label printed on the card and in the dashboard, e.g. "USDA NAIP 2025". */
  label: string;
  year: number;
  /** ArcGIS ImageServer root (no trailing slash). */
  imageServer: string;
  /** Band order for natural color; NAIP is 4-band (R,G,B,NIR). */
  bandIds?: string;
  /** Near-infrared band index, used to tell tree shadow from staining (shadows are dark in NIR, sunlit dirt is not). */
  nirBand?: number;
  /** Native ground resolution in meters, for display only. */
  resolutionMeters: number;
};

export type ParcelFieldMap = {
  parcelId: string;
  pin: string;
  owner: string;
  mailLine1: string;
  mailLine2?: string;
  mailLine3?: string;
  mailCity: string;
  mailState: string;
  mailZip: string;
  mailZip4?: string;
  situsNumber: string;
  situsName: string;
  improvement?: string;
};

export type AerialArea = {
  id: string;
  name: string;
  state: string;
  /** Default map center [lon, lat] for the dashboard scan form. */
  center: [number, number];
  current: ImagerySource;
  prior: ImagerySource;
  parcels: { featureLayer: string; fields: ParcelFieldMap };
  buildings?: { featureLayer: string; pinField: string };
  /** City used for situs addresses when the parcel layer stores a city code instead of a name. */
  defaultSitusCity: string;
  sourcePages: string[];
};

export const CULLMAN_COUNTY_AL: AerialArea = {
  id: 'cullman-al',
  name: 'Cullman County, AL',
  state: 'AL',
  center: [-86.8545, 34.184],
  current: {
    label: 'USDA NAIP 2025',
    year: 2025,
    imageServer: 'https://apps.geo.fpac.usda.gov/geo-imagery/rest/services/naip/conus_naip/ImageServer',
    bandIds: '0,1,2',
    nirBand: 3,
    resolutionMeters: 0.3,
  },
  prior: {
    label: 'USDA NAIP 2023',
    year: 2023,
    imageServer: 'https://imagery.geoplatform.gov/iipp/rest/services/NAIP/NAIP2023_CONUS/ImageServer',
    bandIds: '0,1,2',
    nirBand: 3,
    resolutionMeters: 0.6,
  },
  parcels: {
    featureLayer: 'https://al25portal.kcsgis.com/al25server/rest/services/Mapping/Cullman_Parcels/FeatureServer/0',
    fields: {
      parcelId: 'PARCELID',
      pin: 'PIN',
      owner: 'Owner',
      mailLine1: 'MailAdd1',
      mailLine2: 'MailAdd2',
      mailLine3: 'MailAdd3',
      mailCity: 'MailCity',
      mailState: 'MailState',
      mailZip: 'MailZip1',
      mailZip4: 'MailZip2',
      situsNumber: 'SitusAddNumber',
      situsName: 'SitusAddName',
      improvement: 'ImpDescrip',
    },
  },
  buildings: {
    featureLayer: 'https://al25portal.kcsgis.com/al25server/rest/services/Cullman_Viewer/MapServer/109',
    pinField: 'PIN',
  },
  defaultSitusCity: 'Cullman',
  sourcePages: [
    'https://apps.geo.fpac.usda.gov/geo-imagery/rest/services/naip/conus_naip/ImageServer',
    'https://imagery.geoplatform.gov/iipp/rest/services/NAIP',
    'https://al25portal.kcsgis.com/al25server/rest/services/Mapping/Cullman_Parcels/FeatureServer/0',
    'https://al25portal.kcsgis.com/al25server/rest/services/Cullman_Viewer/MapServer/109',
  ],
};

export const AERIAL_AREAS: Record<string, AerialArea> = {
  [CULLMAN_COUNTY_AL.id]: CULLMAN_COUNTY_AL,
};

export function getAerialArea(id: string | null | undefined): AerialArea | null {
  if (!id) return null;
  return AERIAL_AREAS[id] ?? null;
}

/** Hosts the server may fetch from. Anything else is refused (SSRF guard). */
export function allowedSourceHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const area of Object.values(AERIAL_AREAS)) {
    for (const url of [area.current.imageServer, area.prior.imageServer, area.parcels.featureLayer, area.buildings?.featureLayer]) {
      if (url) hosts.add(new URL(url).host);
    }
  }
  return hosts;
}
