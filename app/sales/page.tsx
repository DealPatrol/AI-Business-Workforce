import { gateProspectPage } from '@/lib/prospect-gate';
import { buildOutreachMessage, getProspectDemoUrl, PROSPECTS } from '@/lib/prospects';
import SalesTracker, { type SalesProspectRow } from './SalesTracker';

export const dynamic = 'force-dynamic';

/**
 * Server component: prospect data is read on the server only after the access
 * check passes, and only the fields the tracker needs are sent to the client.
 * The prospect list is never part of a client JS bundle.
 */
export default async function SalesPage() {
  const access = await gateProspectPage('/sales');
  if (access !== 'allow') return null;

  const prospects: SalesProspectRow[] = PROSPECTS.map((p) => ({
    slug: p.slug,
    companyName: p.companyName,
    serviceArea: p.serviceArea,
    ownerName: p.ownerName,
    industry: p.industry,
    personalizedDemo: Boolean(p.personalizedDemo),
    status: p.status,
    outreachMessage: buildOutreachMessage(p),
  }));

  return <SalesTracker prospects={prospects} sampleDemoUrl={getProspectDemoUrl('acexperts')} />;
}
