import type { ErLead } from '@/lib/leads/types';

export function ownerCanAccessLead(lead: Pick<ErLead, 'owner_id' | 'client_id'>, ownerId: string, clientIds: string[]) {
  if (lead.owner_id === ownerId) return true;
  return Boolean(lead.client_id && clientIds.includes(lead.client_id));
}
