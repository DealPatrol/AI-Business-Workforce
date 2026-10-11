import { coldEmailEnabled } from '@/lib/prospector/transport';
import { unsubscribeSecret } from '@/lib/prospector/unsubscribe-token';
import type { ProspectorConfig } from '@/lib/prospector/types';

export function prospectorConfig(): ProspectorConfig {
  return {
    maps: Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim()),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    coldEmail: coldEmailEnabled(),
    unsubscribe: Boolean(unsubscribeSecret()),
  };
}
