import type { NextConfig } from 'next';
import { AVA_LEGACY_REDIRECTS } from './lib/ava/legacy-paths';
import { LEGACY_HOME_ANCHORS } from './lib/legacy-home-anchors';
import { getSiteUrl } from './lib/site-url';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    const base = getSiteUrl();
    return [
      ...LEGACY_HOME_ANCHORS.map((anchor) => ({
        source: `/${anchor}`,
        destination: `/postcards#${anchor}`,
        permanent: true,
      })),
      ...AVA_LEGACY_REDIRECTS.map(([source, destination]) => ({
        source: `/ava/${source}`,
        destination: `${base}/ava/${destination}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
