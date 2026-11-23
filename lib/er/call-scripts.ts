export type CallScript = {
  slug: string;
  navLabel: string;
  blurb: string;
  title: string;
  metaTitle: string;
  description: string;
  trade: string;
  tradeHref: string;
  greeting: string;
  questions: string[];
  urgentIf: string[];
  close: string;
  notes: string[];
};

export const CALL_SCRIPTS: CallScript[] = [
  {
    slug: 'hvac-after-hours-call-script',
    navLabel: 'HVAC after-hours script',
    blurb: 'No-heat and no-cool intake for nights and weekends.',
    title: 'HVAC After-Hours Call Script (Free Template)',
    metaTitle: 'HVAC After-Hours Call Script: Free Template',
    description: 'A free after-hours call script for HVAC shops: greeting, intake questions, urgent rules and a close. Use it with any answering setup.',
    trade: 'HVAC',
    tradeHref: '/hvac',
    greeting: 'Thanks for calling [Shop name]. This is the after-hours line. I can take your details so the on-call tech can get back to you. What’s going on with your system?',
    questions: [
      'What’s your name, and the best number to reach you?',
      'What’s the service address?',
      'Is it heating or cooling, and what is the system doing right now?',
      'Is anyone in the home elderly, very young, or medically at risk from the temperature?',
      'Have you been to us before?',
      'When would you like someone out?',
    ],
    urgentIf: [
      'Gas smell: tell the caller to leave the house and call the gas company or 911 first.',
      'No heat below the temperature you set, or no cooling above it, with someone at risk inside.',
      'Water leaking from the unit into the house.',
    ],
    close: 'Thanks, [name]. I have your details and I’m sending them to the team now. If anything changes or it becomes unsafe, call 911.',
    notes: ['Only quote a service-call fee you already publish.', 'Write down the exact words the caller uses about the problem.'],
  },
  {
    slug: 'plumbing-emergency-intake-script',
    navLabel: 'Plumbing emergency script',
    blurb: 'Leak, backup and water-heater intake that asks about the shutoff first.',
    title: 'Plumbing Emergency Intake Script (Free Template)',
    metaTitle: 'Plumbing Emergency Call Script: Free Template',
    description: 'A free plumbing emergency intake script: greeting, shutoff question, intake details and urgent rules. Use it with any answering setup.',
    trade: 'Plumbing',
    tradeHref: '/ava/ai-answering-service-for-plumbers',
    greeting: 'Thanks for calling [Shop name]. I can take your details for the plumber. First, is water actively leaking right now?',
    questions: [
      'Can you get to the main shutoff, and is the water off?',
      'What’s your name and the best callback number?',
      'What’s the service address, and is anyone home?',
      'What’s leaking or backed up, and in which room?',
      'Is it a home, a rental, or a business?',
      'How soon do you need someone there?',
    ],
    urgentIf: ['Water still running and can’t be shut off.', 'Sewage backing up into the home.', 'Water near electrical outlets or the panel.'],
    close: 'Thanks, [name]. I’ve got the details and I’m passing them to the plumber now.',
    notes: ['If you give callers shutoff help, keep it to what you’d say yourself.', 'Do not promise an arrival time on the call.'],
  },
  {
    slug: 'roofing-storm-call-script',
    navLabel: 'Roofing storm script',
    blurb: 'Storm-damage and active-leak intake for roofers.',
    title: 'Roofing Storm Damage Call Script (Free Template)',
    metaTitle: 'Roofing Storm Call Script: Free Template',
    description: 'A free roofing call script for storm damage and active leaks: greeting, intake, urgent rules and close. Use it with any answering setup.',
    trade: 'Roofing',
    tradeHref: '/ava/ai-answering-service-for-roofers',
    greeting: 'Thanks for calling [Shop name]. I can take your details for an inspection. Is water coming inside right now?',
    questions: [
      'What’s your name and the best callback number?',
      'What’s the property address?',
      'When did the damage happen, and was it wind, hail, or a tree?',
      'Is water coming inside, and in which room?',
      'Have you already filed an insurance claim?',
      'Is it a home or a business?',
    ],
    urgentIf: ['Water coming through the ceiling.', 'A tree or limb on the roof.', 'Exposed decking after a storm.'],
    close: 'Thanks, [name]. I’ve got your details and the team will call you back to set up the inspection.',
    notes: ['Don’t give insurance advice on the call.', 'Ask for photos only if your team wants them sent later.'],
  },
];

export function getCallScript(slug: string) {
  return CALL_SCRIPTS.find((s) => s.slug === slug);
}
