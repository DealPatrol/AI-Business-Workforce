export const AVA_VOICE_OPTIONS = [
  {
    key: 'southern-man',
    label: 'Southern Working Man',
    description: 'Recommended for Alabama trades',
  },
  {
    key: 'southern-woman',
    label: 'Southern Woman',
    description: 'Warm Southern voice',
  },
  {
    key: 'american-woman',
    label: 'Clear American Woman',
    description: 'Clear, neutral American voice',
  },
] as const;

export type AvaVoiceKey = (typeof AVA_VOICE_OPTIONS)[number]['key'];

export const DEFAULT_AVA_VOICE: AvaVoiceKey = 'southern-man';

export function isAvaVoiceKey(value: string): value is AvaVoiceKey {
  return AVA_VOICE_OPTIONS.some((option) => option.key === value);
}
