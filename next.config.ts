import type { NextConfig } from 'next';
import { AVA_LEGACY_REDIRECTS } from './lib/ava/legacy-paths';
import { LEGACY_HOME_ANCHORS } from './lib/legacy-home-anchors';
import { avaGuidePath } from './lib/seo/receptionist-home';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from './lib/site-url';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Markdown copies of Executive Receptionist pages for AI assistants, listed in llms.txt.
    return {
      beforeFiles: [],
      afterFiles: [
        { source: '/:section(compare|industries|tools|templates).md', destination: '/md/:section' },
        { source: '/:section(compare|tools|templates|ava)/:slug.md', destination: '/md/:section/:slug' },
      ],
      fallback: [],
    };
  },
  async redirects() {
    // Receptionist pages live on executivereceptionist.com, so old receptionist URLs go straight there.
    const er = EXECUTIVE_RECEPTIONIST_ORIGIN;
    return [
      ...LEGACY_HOME_ANCHORS.map((anchor) => ({
        source: `/${anchor}`,
        destination: anchor === 'demo10' ? '/postcards' : `/postcards#${anchor}`,
        permanent: true,
      })),
      { source: '/api/demo10-payment', destination: '/postcards', permanent: true },
      ...AVA_LEGACY_REDIRECTS.map(([source, destination]) => ({
        source: `/ava/${source}`,
        destination: `${er}${avaGuidePath(destination)}`,
        permanent: true,
      })),
      { source: '/dispatch/missed-calls', destination: `${er}/receptionist/missed-calls`, permanent: true },
      { source: '/dispatch', destination: `${er}/`, permanent: true },
      { source: '/dispatch/:slug', destination: `${er}/ava/:slug`, permanent: true },
      { source: '/reviews', destination: '/reputation', permanent: true },
      { source: '/lead-finder', destination: '/dashboard/prospector', permanent: true },
    ];
  },
};

export default nextConfig;
