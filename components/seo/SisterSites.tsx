import { relatedSisterSites, type SisterCluster } from '@/lib/seo/sister-sites';

type Props = {
  selfUrl: string;
  clusters: SisterCluster[];
  /** Path to the about page that lists every official site. */
  aboutHref?: string;
  className?: string;
};

export function SisterSites({ selfUrl, clusters, aboutHref = '/about', className }: Props) {
  const related = relatedSisterSites(clusters, selfUrl);
  if (related.length === 0) {
    return (
      <section className={className} aria-labelledby="sister-sites-heading">
        <h2 id="sister-sites-heading">From the same maker</h2>
        <p>
          Cole Collins also builds other small sites.{' '}
          <a href={aboutHref}>See the full list</a>.
        </p>
      </section>
    );
  }

  return (
    <section className={className} aria-labelledby="sister-sites-heading">
      <h2 id="sister-sites-heading">From the same maker</h2>
      <ul>
        {related.map((site) => (
          <li key={site.url}>
            <a href={site.url} rel="noopener">
              {site.name}
            </a>
            {' — '}
            {site.blurb}
          </li>
        ))}
      </ul>
      <p>
        <a href={aboutHref}>More sites from the same maker</a>
      </p>
    </section>
  );
}
