export const MISSED_CALL_TRADES = ['hvac', 'plumbing', 'roofing'] as const;

export type MissedCallTrade = (typeof MISSED_CALL_TRADES)[number];

export type MissedCallAd = {
  trade: MissedCallTrade;
  label: string;
  hook: string;
  morning: string;
  stakes: string;
  stakesNote: string;
};

export const MISSED_CALL_ADS: Record<MissedCallTrade, MissedCallAd> = {
  hvac: {
    trade: 'hvac',
    label: 'HVAC',
    hook: "It's 8:47pm. A homeowner's AC just died — and your phone went to voicemail.",
    morning: "By morning, they've booked with the next company on Google.",
    stakes: "That's not a missed $129 tune-up. It could be a missed $12,000 changeout.",
    stakesNote:
      'The $129 and $12,000 figures are an illustration of a tune-up versus a system replacement. They are not a result from a Front Porch Growth customer.',
  },
  plumbing: {
    trade: 'plumbing',
    label: 'Plumbing',
    hook: "It's 8:47pm. A homeowner's pipe just burst — and your plumbing phone went to voicemail.",
    morning: "By morning, they've booked with the next company on Google.",
    stakes: 'That missed call is not only a small service visit. It could be the water heater, or a much larger job.',
    stakesNote: 'This is a scenario for a plumbing company. It is not a measured revenue result.',
  },
  roofing: {
    trade: 'roofing',
    label: 'Roofing',
    hook: "It's 8:47pm. A storm just opened a roof — and your roofing phone went to voicemail.",
    morning: "By morning, they've booked with the next company on Google.",
    stakes: 'That missed call is not only an inspection. It could be the whole roof.',
    stakesNote: 'This is a scenario for a roofing company. It is not a measured revenue result.',
  },
};

export function missedCallTrade(value: string | undefined): MissedCallTrade {
  if (value === 'plumbing' || value === 'roofing' || value === 'hvac') return value;
  return 'hvac';
}
