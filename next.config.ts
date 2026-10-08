import type { NextConfig } from 'next';
import { AVA_LEGACY_REDIRECTS } from './lib/ava/legacy-paths';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return AVA_LEGACY_REDIRECTS.map(([source, destination]) => ({
      source: `/ava/${source}`,
      destination: `/ava/${destination}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
