import type { NextConfig } from 'next';
import { LEGACY_HOME_ANCHORS } from './lib/legacy-home-anchors';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return LEGACY_HOME_ANCHORS.map((anchor) => ({
      source: `/${anchor}`,
      destination: `/postcards#${anchor}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
