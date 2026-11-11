/**
 * Public "Call Ava" demo line. A Twilio number imported into ElevenLabs and
 * assigned to the Porchlight Heating & Air demo agent (a made-up HVAC shop).
 * Never swap in the Collins Lawncare business line here.
 */
export const AVA_DEMO_LINE = {
  display: '(256) 952-4935',
  href: 'tel:+12569524935',
  answersAs: 'Porchlight Heating & Air, a made-up HVAC company',
} as const;
