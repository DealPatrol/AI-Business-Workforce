// Generated from /workspace/marketing-sales/blog-push/articles by gen_posts.py. Edit the Markdown, then regenerate.
export type BlogSite = 'er' | 'fpg';
export type BlogBlock =
  | { type: 'p' | 'h2' | 'h3'; text: string }
  | { type: 'ul' | 'ol'; items: string[] };
export type BlogPost = {
  slug: string;
  site: BlogSite;
  title: string;
  metaTitle: string;
  description: string;
  tags: string[];
  published: string;
  ctaLabel: string;
  ctaUrl: string;
  words: number;
  blocks: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    "slug": "after-hours-hvac-calls",
    "site": "er",
    "title": "What Happens to Your HVAC Calls After Hours (and How to Stop Losing Them)",
    "metaTitle": "After-Hours HVAC Calls: Where the Jobs Go",
    "description": "Most after-hours callers with no heat don't leave a voicemail. Here is where those calls go, how to measure the leak, and four ways to plug it.",
    "tags": [
      "HVAC",
      "home services",
      "small business",
      "answering service",
      "AI receptionist"
    ],
    "published": "2026-11-18",
    "ctaLabel": "See Ava for HVAC, from $1 for the first month",
    "ctaUrl": "https://executivereceptionist.com/hvac?utm_source=blog&utm_medium=article&utm_campaign=after-hours-hvac-calls",
    "words": 1127,
    "blocks": [
      {
        "type": "p",
        "text": "It's 9:40 on a January night. A homeowner's furnace is blowing cold air, the house is at 58 degrees, and there's a baby asleep down the hall. They search \"furnace repair near me,\" tap the first number, and get your voicemail."
      },
      {
        "type": "p",
        "text": "What happens next decides whether that job is yours."
      },
      {
        "type": "h2",
        "text": "Most urgent callers don't leave a message"
      },
      {
        "type": "p",
        "text": "Ask HVAC owners on Reddit or in trade forums what happens to a missed after-hours call and you get the same answer over and over: the caller hangs up and dials the next company on the list. One small-business owner who tracked a week of evening calls counted 8 to 10 calls between 6 PM and midnight, and said nearly all of them hung up without a voicemail. Techs and owners in r/HVAC and r/hvacadvice say the same thing in fewer words: if it's urgent, they move on."
      },
      {
        "type": "p",
        "text": "That makes sense from the homeowner's side. A voicemail is a promise that someone might call back tomorrow. A cold house needs an answer tonight. Whoever picks up first usually gets the job, and very often the maintenance agreement that follows it."
      },
      {
        "type": "h2",
        "text": "The calls you are actually missing"
      },
      {
        "type": "p",
        "text": "It helps to sort after-hours calls into three kinds, because each one needs something different:"
      },
      {
        "type": "ul",
        "items": [
          "**True emergencies.** No heat in a freeze, no cooling in a heat wave with someone vulnerable in the house, a gas smell. These need an answer right away and a clear decision about whether someone goes out tonight.",
          "**Urgent but not dangerous.** The AC is struggling, the furnace is short-cycling, there's water around the air handler. The homeowner wants to know they are on a list for the morning.",
          "**Routine work.** Tune-ups, quotes on a new system, a question about a filter. These callers are often calling at night because that's when they finally have time."
        ]
      },
      {
        "type": "p",
        "text": "Voicemail treats all three the same way. That's the real problem: the emergency gets no triage, the urgent call gets no reassurance, and the routine caller gets no booking."
      },
      {
        "type": "h2",
        "text": "How to measure your own leak (free, in one week)"
      },
      {
        "type": "p",
        "text": "Before you buy anything, find out how big the problem is. Owners who have done this say the number surprises them."
      },
      {
        "type": "ol",
        "items": [
          "Pull your phone carrier's call log for the last two to four weeks. Most carriers and VoIP apps let you export it.",
          "Mark every inbound call that came in after your office closed, on weekends, and during your busiest hours when nobody could pick up.",
          "For each one, note whether a voicemail was left and when someone actually called back.",
          "Count how many of those numbers never became a job."
        ]
      },
      {
        "type": "p",
        "text": "If you're seeing a handful of unanswered calls a week, the question is simple: what is one furnace repair or one new-system lead worth to you, and how many of those calls would it take to cover a fix?"
      },
      {
        "type": "h2",
        "text": "Four ways to plug the leak"
      },
      {
        "type": "p",
        "text": "There is no single right answer. Here are the options HVAC owners actually use, with the trade-offs."
      },
      {
        "type": "p",
        "text": "**1. Owner or on-call tech answers the phone.** It costs nothing in cash, and nobody knows your customers better than you. The cost is sleep, family time, and the calls you miss anyway while you're under a house. Many small shops burn out on this."
      },
      {
        "type": "p",
        "text": "**2. A better voicemail greeting plus a fast morning callback.** Change your greeting to say exactly when you return calls, and ask for the address and the problem. Then call every missed number before your first job. This is cheap and better than nothing, but it still loses most of the true emergencies, because those callers don't wait."
      },
      {
        "type": "p",
        "text": "**3. A traditional answering service.** A person picks up and writes down a message. Owners describe these as hit or miss: some are great, some get the callback number wrong. Ask any service you consider how they decide what's an emergency, and ask for sample messages."
      },
      {
        "type": "p",
        "text": "**4. An AI receptionist.** Software that answers every call in a natural voice, asks the questions you would ask, and sends you the details. The good ones are built around your trade, so they know a gas smell is not a tune-up question."
      },
      {
        "type": "h2",
        "text": "What a good after-hours answer sounds like"
      },
      {
        "type": "p",
        "text": "Whatever you choose, the caller should hear the same things your best dispatcher would say:"
      },
      {
        "type": "ul",
        "items": [
          "Your shop's name, so they know they reached the right place.",
          "Questions that get the job: name, callback number, address, and what the system is doing.",
          "A safety question for heating calls: is anyone at home elderly, a baby, or someone with a medical need?",
          "For a gas smell, safety first: leave the house and call 911 or the gas company from outside, before anything else.",
          "No made-up promises. Nobody on the phone should promise an arrival time or quote a repair price they can't stand behind."
        ]
      },
      {
        "type": "h2",
        "text": "Where Ava fits"
      },
      {
        "type": "p",
        "text": "This is what we built Ava, the AI receptionist from Executive Receptionist, to do for heating and air shops. Ava answers your business line 24/7 with a greeting written for your shop. She takes the caller's name, callback number, address, and what's wrong, asks the safety questions on no-heat calls, flags emergencies, and emails you every lead right after the call with how urgent it is. On a gas smell, she tells everyone to get out and call 911 or the gas company from outside before she does anything else. She gives only the service-call fee you set and never makes up a price."
      },
      {
        "type": "p",
        "text": "Once your calendar is set up in the Desk, she books routine visits into your Desk calendar during the call."
      },
      {
        "type": "p",
        "text": "Plans are month to month:"
      },
      {
        "type": "ul",
        "items": [
          "**Starter:** first month $1, then $79/month for 100 minutes.",
          "**Growth:** $197/month for 300 minutes.",
          "**Pro:** $397/month for 1,200 minutes.",
          "**Elite:** $789/month for 2,000 minutes, with priority setup."
        ]
      },
      {
        "type": "p",
        "text": "If you run past your minutes, Ava keeps answering. Cancel anytime."
      },
      {
        "type": "p",
        "text": "The fastest way to judge it is to call her the way a customer with no heat would. [Talk to the HVAC demo](https://elevenlabs.io/app/talk-to?agent_id=agent_0001m6k8pwnaebqver0sztwknn72) in your browser (it uses your microphone), try a no-heat call or a gas smell, and see whether the email you'd get is something you could act on."
      },
      {
        "type": "h2",
        "text": "The short version"
      },
      {
        "type": "p",
        "text": "Most urgent HVAC callers won't leave a voicemail. Measure how many after-hours calls you're missing, decide what one recovered job is worth, and pick the option that answers the phone when the furnace quits. If that's Ava, you can try her on your own line for $1."
      }
    ]
  },
  {
    "slug": "hvac-answering-service-vs-ai-receptionist",
    "site": "er",
    "title": "HVAC Answering Service vs. AI Receptionist: How to Choose",
    "metaTitle": "HVAC Answering Service vs AI Receptionist",
    "description": "A plain comparison for small heating and air shops: what to test, what to ask, how to do the cost math, and red flags in any after-hours answering setup.",
    "tags": [
      "HVAC",
      "answering service",
      "AI receptionist",
      "small business",
      "home services"
    ],
    "published": "2026-11-18",
    "ctaLabel": "Try Ava on your line for $1",
    "ctaUrl": "https://executivereceptionist.com/hvac?utm_source=blog&utm_medium=article&utm_campaign=hvac-answering-service-vs-ai-receptionist",
    "words": 1084,
    "blocks": [
      {
        "type": "p",
        "text": "If you run a heating and air shop with a few trucks, you've probably had this conversation with yourself: \"I need someone answering the phone at night, but I can't justify a full-time dispatcher.\" The two usual answers are a traditional answering service and an AI receptionist. Both can work. Both can fail you. Here's how to pick without getting sold."
      },
      {
        "type": "h2",
        "text": "Start with what you actually need answered"
      },
      {
        "type": "p",
        "text": "Before comparing vendors, write down what a perfect after-hours call looks like for your shop. For most small HVAC companies it's short:"
      },
      {
        "type": "ul",
        "items": [
          "Pick up every time, including nights, weekends, and the first cold snap when every line is ringing.",
          "Get the caller's name, callback number, address, and what the system is doing.",
          "Tell a real emergency from a routine request, and treat a gas smell as a safety call first.",
          "Get the details to you fast, in a form you can act on from your phone.",
          "Never promise an arrival time or invent a price."
        ]
      },
      {
        "type": "p",
        "text": "Owners who have posted about this on r/ProHVACR describe their needs the same way: it's either an emergency or it's a message for the morning. Keep that list in front of you. Every feature beyond it is a nice-to-have."
      },
      {
        "type": "h2",
        "text": "Traditional answering services"
      },
      {
        "type": "p",
        "text": "A live agent picks up, reads your script, and sends you the message."
      },
      {
        "type": "p",
        "text": "**Where they shine:** a human can handle an odd call that doesn't fit the script, and some callers simply prefer a person."
      },
      {
        "type": "p",
        "text": "**Where owners complain:** quality varies by who's on shift. In HVAC forums you'll find owners saying their service is \"extremely hit or miss,\" that some nights the callback number comes through wrong, and that agents juggling dozens of businesses don't know a heat pump from a water heater. Pricing is often per minute or per call with extra fees for after-hours, holidays, or long calls, so read the contract."
      },
      {
        "type": "p",
        "text": "**Questions to ask a service:**"
      },
      {
        "type": "ol",
        "items": [
          "How do your agents decide something is an emergency for an HVAC shop?",
          "Can I see three sample messages from a heating company you answer for?",
          "What happens when your call volume spikes during a cold snap?",
          "What are all the fees, including holidays and minimums?"
        ]
      },
      {
        "type": "h2",
        "text": "AI receptionists"
      },
      {
        "type": "p",
        "text": "Software answers the phone in a natural voice, follows the questions you set, and sends you a summary."
      },
      {
        "type": "p",
        "text": "**Where they shine:** they answer every call at once, never get tired at 3 AM, and ask the same safety questions every time. Because the script is built for your trade, a good one knows \"I smell gas\" and \"my filter is dirty\" are very different calls."
      },
      {
        "type": "p",
        "text": "**Where to be careful:** an AI receptionist is only as good as its setup. If it doesn't know your service area, your service-call fee, or your hours, it can't say them. And you should be skeptical of any product that claims it can diagnose equipment or quote repairs. That's your tech's job."
      },
      {
        "type": "p",
        "text": "**Questions to ask any AI receptionist vendor:**"
      },
      {
        "type": "ol",
        "items": [
          "Can I call a live demo myself right now, without a sales call?",
          "What exactly lands in my inbox after a call?",
          "What does it say when someone reports a gas smell?",
          "Does it ever quote prices I didn't give it?",
          "What happens if I go over my minutes?"
        ]
      },
      {
        "type": "h2",
        "text": "Do the cost math your way"
      },
      {
        "type": "p",
        "text": "Skip anyone's \"average job value\" claims and use your own numbers."
      },
      {
        "type": "ol",
        "items": [
          "**Count missed calls.** Use your carrier's call log for the last few weeks and count calls that rang after hours or went unanswered.",
          "**Estimate how many were real jobs.** Be conservative. If you're not sure, assume only a small share.",
          "**Use your own average repair ticket**, not a best-case install.",
          "**Compare that to the monthly cost** of the service."
        ]
      },
      {
        "type": "p",
        "text": "If one recovered no-heat repair a month covers the bill, the decision is usually easy. If it would take ten, keep looking or keep answering yourself."
      },
      {
        "type": "h2",
        "text": "Red flags in either option"
      },
      {
        "type": "ul",
        "items": [
          "No way to hear it before you pay.",
          "Long contracts or setup fees for a service you haven't tested.",
          "Promises of guaranteed bookings or revenue.",
          "Vague answers about what happens with your callers' information.",
          "An emergency script that keeps a caller on the line instead of telling them to get to safety."
        ]
      },
      {
        "type": "h2",
        "text": "How Ava compares"
      },
      {
        "type": "p",
        "text": "We built Ava, the AI receptionist from Executive Receptionist, for exactly this job, so here's what she does and doesn't do, straight from the live product page."
      },
      {
        "type": "p",
        "text": "What Ava does:"
      },
      {
        "type": "ul",
        "items": [
          "Answers your business line 24/7 with a greeting written for your shop.",
          "Takes the caller's name, callback number, address, and the problem.",
          "Asks no-heat callers whether anyone at home is elderly, a baby, or has a medical need, and flags emergencies.",
          "On a gas smell, tells everyone to leave and call 911 or the gas company from outside, before anything else.",
          "Gives only the service-call fee you set. She never makes up a price and never promises an arrival time.",
          "Emails you every lead right after the call: name, number, address, the problem, and how urgent it is.",
          "Once your calendar is set up in the Desk, she books routine visits into your Desk calendar during the call."
        ]
      },
      {
        "type": "p",
        "text": "What it costs, month to month:"
      },
      {
        "type": "ul",
        "items": [
          "**Starter:** $1 for the first month, then $79/month for 100 minutes.",
          "**Growth:** $197/month for 300 minutes.",
          "**Pro:** $397/month for 1,200 minutes, the lowest price per minute.",
          "**Elite:** $789/month for 2,000 minutes, with priority setup."
        ]
      },
      {
        "type": "p",
        "text": "On Starter and up, if you run past your minutes, Ava keeps answering and we reach out about moving up a plan, with no surprise per-minute charges. Overflow ($25 for 60 minutes) bills $1 a minute after 60, and you can cancel anytime."
      },
      {
        "type": "h2",
        "text": "Test before you trust"
      },
      {
        "type": "p",
        "text": "Whichever way you go, call the thing yourself, at night, the way a customer with no heat would. Try the edge cases: a gas smell, a caller who's angry, a caller who only wants a price."
      },
      {
        "type": "p",
        "text": "You can do that with Ava right now. [Talk to the HVAC demo](https://elevenlabs.io/app/talk-to?agent_id=agent_0001m6k8pwnaebqver0sztwknn72) in your browser. It answers for a made-up shop called \"Demo Heating & Air,\" so try a no-heat call, a broken AC, or ask what a service call costs. If you like what you hear, the Starter plan lets you put her on your own line for $1 for the first month."
      }
    ]
  },
  {
    "slug": "after-hours-plumbing-calls",
    "site": "er",
    "title": "What Happens to After-Hours Plumbing Calls (and How to Keep the Job)",
    "metaTitle": "After-Hours Plumbing Calls: Keep the Job",
    "description": "Burst pipes and backed-up drains rarely wait until morning. Here is where after-hours plumbing calls go, and how a shop can keep the first conversation.",
    "tags": [
      "plumbing",
      "home services",
      "small business",
      "answering service",
      "AI receptionist"
    ],
    "published": "2026-11-20",
    "ctaLabel": "See Ava for plumbing shops",
    "ctaUrl": "https://executivereceptionist.com/ava/ai-answering-service-for-plumbers?utm_source=blog&utm_medium=article&utm_campaign=after-hours-plumbing-calls",
    "words": 837,
    "blocks": [
      {
        "type": "p",
        "text": "It is 11:20 on a Tuesday. A homeowner finds water spreading from a supply line under the sink. They search for a plumber, tap the first number, and reach voicemail."
      },
      {
        "type": "p",
        "text": "That call is not going to sit in the inbox until morning. Most people with water on the floor hang up and try the next shop."
      },
      {
        "type": "h2",
        "text": "Urgent plumbing calls do not leave polite messages"
      },
      {
        "type": "p",
        "text": "The pattern is the same one HVAC shops describe for no-heat nights, and it is even less patient when water is moving. A voicemail is a maybe. A live answer is a chance to shut the water off and get on a list."
      },
      {
        "type": "p",
        "text": "This article does not invent a close rate or a typical ticket. Your call log is the only honest source for that. What you can say without a study is simple: if the first shop does not pick up, the next one often gets the job."
      },
      {
        "type": "p",
        "text": "If you want the HVAC version of this problem, read [What Happens to Your HVAC Calls After Hours](https://executivereceptionist.com/blog/after-hours-hvac-calls?utm_source=blog&utm_medium=article&utm_campaign=after-hours-plumbing-calls)."
      },
      {
        "type": "h2",
        "text": "Sort the calls before you treat them the same"
      },
      {
        "type": "p",
        "text": "After-hours plumbing calls are not all one kind of work:"
      },
      {
        "type": "ul",
        "items": [
          "**Active flooding or a gas smell.** The caller needs a clear instruction first (where to shut the water off, whether to leave the house) and a yes or no about whether someone can come out tonight. An AI receptionist can collect those facts and flag the call as urgent. It should not pretend to shut the water off or dispatch a truck on its own.",
          "**Urgent but contained.** A backed-up drain, no hot water, a weak toilet that can wait until morning if the caller knows they are on the list.",
          "**Routine work.** A quote, a slow drip, a remodel question. These callers often phone at night because that is when they are home."
        ]
      },
      {
        "type": "p",
        "text": "Voicemail treats all three the same. The emergency gets no triage, the urgent call gets no reassurance, and the routine caller gets no booking."
      },
      {
        "type": "h2",
        "text": "Four ways shops cover the night"
      },
      {
        "type": "p",
        "text": "None of these is magic, and all of them work better if you write down what “urgent” means for your crew."
      },
      {
        "type": "ol",
        "items": [
          "**Forward missed calls to the owner or the on-call tech.** This is the most common setup. It works until the person on call is already under a house, asleep, or out of signal.",
          "**A traditional answering service.** A person takes a message on a script. Ask what they do with an active leak, what they cost after midnight, and how the lead reaches you.",
          "**An AI receptionist.** Executive Receptionist’s Ava answers the forwarded line, tells the caller she is AI, asks the questions you approve (is the water still running, where is the shutoff, name, callback number, address), and emails you the lead. [Ava for plumbing shops](https://executivereceptionist.com/ava/ai-answering-service-for-plumbers?utm_source=blog&utm_medium=article&utm_campaign=after-hours-plumbing-calls) explains the setup. Starter is $79 a month for 100 minutes, and Starter is the only plan whose first month is $1. She does not quote a price you have not approved, and she does not roll a truck.",
          "**A mix.** Many shops keep the phone ringing to the truck during the day and forward nights and overflow."
        ]
      },
      {
        "type": "p",
        "text": "If you are comparing an answering service to an AI receptionist, start with [HVAC Answering Service vs. AI Receptionist](https://executivereceptionist.com/blog/hvac-answering-service-vs-ai-receptionist?utm_source=blog&utm_medium=article&utm_campaign=after-hours-plumbing-calls). The trade-offs are the same for plumbing: who answers, what they are allowed to say, and how the lead lands."
      },
      {
        "type": "h2",
        "text": "What to tell the person (or the receptionist) who picks up"
      },
      {
        "type": "p",
        "text": "Write this down once, then use it on every after-hours path:"
      },
      {
        "type": "ul",
        "items": [
          "If water is still running, ask whether they can reach the shutoff, and flag the call as urgent.",
          "Take a callback number and a street address before you ask for the life story.",
          "Do not promise an arrival window you cannot keep.",
          "Do not quote a price unless you have published one for that situation.",
          "Tell the caller what happens next: you will get the note and call them back, or an on-call tech will call if you have that set up."
        ]
      },
      {
        "type": "p",
        "text": "Ava uses the questions you approve. You can make the water-shutoff question required. You can also leave booking off until your hours and calendar are set in the desk."
      },
      {
        "type": "h2",
        "text": "Measure the leak for a week"
      },
      {
        "type": "p",
        "text": "Before you buy anything, note three things for seven days: how many after-hours calls you can already see (missed-call logs, voicemail, Google missed calls), how many of those left a message, and how many turned into a booked job. That is enough to compare against a monthly plan without borrowing someone else’s statistic."
      },
      {
        "type": "p",
        "text": "If you want to hear how Ava handles a plumbing-style call, use the demo line or the [plumbing answering page](https://executivereceptionist.com/ava/ai-answering-service-for-plumbers?utm_source=blog&utm_medium=article&utm_campaign=after-hours-plumbing-calls). She answers as a made-up shop. No real technician is sent."
      }
    ]
  },
  {
    "slug": "is-my-business-in-chatgpt",
    "site": "fpg",
    "title": "Is Your Business Showing Up in ChatGPT? How to Check for Free",
    "metaTitle": "Is Your Business Showing Up in ChatGPT? Free Check",
    "description": "More customers ask ChatGPT and Google's AI who to call. Here's a free, honest way to check if your business gets named, and what to fix if it doesn't.",
    "tags": [
      "local SEO",
      "AI search",
      "ChatGPT",
      "small business",
      "GEO"
    ],
    "published": "2026-11-18",
    "ctaLabel": "Grade my site free",
    "ctaUrl": "https://frontporchgrowth.com/ai-visibility?utm_source=blog&utm_medium=article&utm_campaign=is-my-business-in-chatgpt",
    "words": 947,
    "blocks": [
      {
        "type": "p",
        "text": "A homeowner's AC quits on a Saturday. A few years ago they would have searched \"AC repair near me\" and scrolled. Today a growing number open an app and type something like, \"Who's a good HVAC company in Cullman that can come today?\" and get back two or three names."
      },
      {
        "type": "p",
        "text": "If you run a local business, the obvious question is: are you one of those names? Most owners have no idea. There's no dashboard that tells you, and the answers change from one person to the next. Here's how to check honestly, for free, and what to do with what you find."
      },
      {
        "type": "h2",
        "text": "Why AI answers matter for local businesses"
      },
      {
        "type": "p",
        "text": "ChatGPT, Google's AI answers, Perplexity, and similar assistants don't show ten blue links. They read a handful of sources and write one answer. For local questions, people who work in local SEO keep pointing to the same sources: your Google Business Profile, your own website, review sites, local directories, and the occasional local news story or community thread."
      },
      {
        "type": "p",
        "text": "That's good news, because most of those are things you can fix. If your hours are missing, your phone number is different in three places, or nothing on your site says which towns you serve, the assistant has little reason to mention you."
      },
      {
        "type": "h2",
        "text": "How to check it yourself in 20 minutes"
      },
      {
        "type": "p",
        "text": "You don't need a tool to get a rough picture. You need a list of questions and a little patience."
      },
      {
        "type": "ol",
        "items": [
          "**Write 10 questions your customers would actually ask.** Mix the plain ones (\"best plumber in Gadsden\") with real situations (\"who can fix a leaking water heater today in Gadsden?\") and money questions (\"how much does a new AC cost in Cullman?\").",
          "**Ask each one in two or three assistants.** Use ChatGPT, Google (look at the AI answer at the top), and one more if you like. Use a private or logged-out window when you can so your own history doesn't skew it.",
          "**Ask each question more than once.** AI answers vary run to run. One answer is an anecdote. Five is a pattern.",
          "**Write down three things every time:** whether you were named, who was named instead, and which websites the answer pointed to."
        ]
      },
      {
        "type": "p",
        "text": "When you're done, you'll have a simple score: \"named in X of Y answers.\" Treat it as a sample, not a verdict. Nobody sees exactly the same answer."
      },
      {
        "type": "h2",
        "text": "What to look for in the results"
      },
      {
        "type": "p",
        "text": "The most useful part isn't whether you appeared. It's the pattern around it."
      },
      {
        "type": "ul",
        "items": [
          "**Who keeps getting named?** Look up those businesses. Usually their name, phone, hours, and services are consistent everywhere, and they're listed on the same handful of sites.",
          "**Which sources get cited?** If an answer keeps pointing to Yelp, a local \"best of\" list, or a directory you're not on, that's your to-do list.",
          "**What's wrong about you?** If an assistant gives an old phone number or says you don't serve a town you do, find where that fact lives online and fix it there."
        ]
      },
      {
        "type": "h2",
        "text": "The fixes that usually matter most"
      },
      {
        "type": "p",
        "text": "These come up again and again from people who do this work, and none of them require a new website:"
      },
      {
        "type": "ul",
        "items": [
          "**Complete your Google Business Profile.** Categories, hours, services, service area, photos. Fill every field you honestly can.",
          "**Make your name, address, and phone identical everywhere.** Your site, Google, Facebook, Yelp, and every directory. Small differences add up to an unclear picture.",
          "**Say plainly what you do and where.** In normal text on your site, not baked into images. \"We repair and replace furnaces and heat pumps in Cullman, Hanceville, and Arab.\"",
          "**Answer real customer questions.** A short FAQ with honest answers: what a service call costs, whether you work weekends, how fast you can come out. Assistants quote this kind of plain answer.",
          "**Let crawlers in.** Make sure your robots.txt doesn't block search and AI crawlers, and that your words load without JavaScript.",
          "**Get listed where the answers already look.** If the same directory shows up in every answer, make sure you're on it with correct details."
        ]
      },
      {
        "type": "h2",
        "text": "What not to do"
      },
      {
        "type": "ul",
        "items": [
          "Don't buy \"guaranteed ChatGPT placement.\" Nobody controls what these assistants say.",
          "Don't spin up a copy-paste page for every town on the map. Thin pages stuffed with town names can hurt more than help.",
          "Don't post fake reviews. Beyond the ethics, platforms remove them and they can sink your profile."
        ]
      },
      {
        "type": "h2",
        "text": "Skip the spreadsheet: the free grader"
      },
      {
        "type": "p",
        "text": "If you'd rather not do all of this by hand, we built a free tool for exactly this first step. The Front Porch Growth SEO and AI Visibility Grader loads your page and runs more than 20 checks that search engines and AI assistants rely on: your phone, address, and hours; whether you say what you do and where; business schema; FAQs; whether search and AI crawlers are allowed in; whether your words load without JavaScript; HTTPS; mobile setup; sitemap; robots.txt; link previews; image alt text; and rough speed."
      },
      {
        "type": "p",
        "text": "You get a score, what we found, and the fixes that matter most, ranked. It takes about 15 seconds, and there's no card and no sales call. The AI recommendation check uses real questions sent to real AI assistants. If it isn't in your instant report, we run it and email you the results. We never show made-up AI answers or made-up competitors, and we never promise rankings, because nobody can."
      },
      {
        "type": "p",
        "text": "[Grade your site free](https://frontporchgrowth.com/ai-visibility?utm_source=blog&utm_medium=article&utm_campaign=is-my-business-in-chatgpt) and you'll have your own to-do list before your coffee gets cold."
      }
    ]
  },
  {
    "slug": "ai-search-checklist-home-services",
    "site": "fpg",
    "title": "The AI Search Checklist for Home Service Businesses: 12 Fixes",
    "metaTitle": "AI Search Checklist for Home Service Businesses",
    "description": "Twelve practical fixes that help Google and AI assistants understand your plumbing, HVAC, roofing, or lawn business, plus what to skip.",
    "tags": [
      "local SEO",
      "AI search",
      "home services",
      "Google Business Profile",
      "small business marketing"
    ],
    "published": "2026-11-18",
    "ctaLabel": "Run the free 20-check grade",
    "ctaUrl": "https://frontporchgrowth.com/ai-visibility?utm_source=blog&utm_medium=article&utm_campaign=ai-search-checklist-home-services",
    "words": 947,
    "blocks": [
      {
        "type": "p",
        "text": "Your customers still search Google. More of them now also ask ChatGPT or Google's AI answer who to call, and get two or three names back. The good news for a plumber, roofer, HVAC tech, or lawn care owner is that the work to show up in both is mostly the same, and most of it is boring, fixable stuff."
      },
      {
        "type": "p",
        "text": "Here's a checklist you can work through in an afternoon or two. It's sorted roughly by how much it tends to matter for a local service business."
      },
      {
        "type": "h2",
        "text": "Part 1: Your facts (the foundation)"
      },
      {
        "type": "p",
        "text": "**1. Fill out your Google Business Profile completely.** Primary category, extra categories that are true, hours, holiday hours, services, service area, and real photos of your work and trucks. People who do local SEO for a living consistently call this the backbone of local AI answers."
      },
      {
        "type": "p",
        "text": "**2. Make your name, address, and phone identical everywhere.** \"Smith Heating & Air LLC\" on one site and \"Smith HVAC\" with a different phone on another makes you look like two businesses, or an unreliable one. Pick one version and fix your website, Google, Facebook, Yelp, BBB, Nextdoor, and any directories."
      },
      {
        "type": "p",
        "text": "**3. Put your hours and emergency line where people and bots can read them.** In plain text on your site, ideally on every page footer. If you do emergency calls, say so and say when."
      },
      {
        "type": "p",
        "text": "**4. Say what you do and where, in plain words.** One clear sentence high on your homepage: what services, which towns. \"We install and repair heat pumps and furnaces in Cullman, Hanceville, and Arab.\" Don't hide it inside an image or a slider."
      },
      {
        "type": "h2",
        "text": "Part 2: Your website (make it readable)"
      },
      {
        "type": "p",
        "text": "**5. Add LocalBusiness schema.** This is a small block of code that states your business name, address, phone, hours, and service area in a format machines read reliably. Make sure it matches exactly what's on the page and in your Google profile."
      },
      {
        "type": "p",
        "text": "**6. Write a real FAQ.** Four to eight questions your customers actually ask, with honest two-to-four-sentence answers. What does a service call cost? Do you work weekends? How fast can you come out? Do you offer financing? Plain answers like these are exactly what AI assistants tend to quote."
      },
      {
        "type": "p",
        "text": "**7. Give each main service its own page.** One page for furnace repair, one for AC installation, one for duct cleaning, each describing the real work, the towns you do it in, and what the customer should expect. Skip the copy-paste page for every town on the map."
      },
      {
        "type": "p",
        "text": "**8. Let search and AI crawlers in.** Check your robots.txt (yoursite.com/robots.txt). If it blocks everything, or blocks crawlers like Googlebot or the ones AI companies use, you're invisible by choice. Also make sure your text loads without JavaScript; some crawlers don't run it."
      },
      {
        "type": "p",
        "text": "**9. Cover the technical basics.** HTTPS, a mobile-friendly layout, a sitemap, descriptive page titles, image alt text, link previews when your site is shared, and pages that load reasonably fast. None of these is magic. Missing several adds up."
      },
      {
        "type": "h2",
        "text": "Part 3: The rest of the web (what others say about you)"
      },
      {
        "type": "p",
        "text": "**10. Get on the sites that answers already cite.** Ask an AI assistant \"best [your trade] in [your town]\" a few times and note which websites it points to. If the same directory or local roundup keeps coming up, make sure you're listed there with correct details."
      },
      {
        "type": "p",
        "text": "**11. Earn honest reviews steadily.** Ask happy customers right after a job, every time. A steady trickle of recent, real reviews beats a burst. Reply to them, including the bad ones, calmly and specifically."
      },
      {
        "type": "p",
        "text": "**12. Be part of local conversations.** Sponsor the Little League team, get mentioned in the local paper, answer questions in community groups as yourself. AI assistants read the web; being named by real local sources helps them understand who you are."
      },
      {
        "type": "h2",
        "text": "What to skip"
      },
      {
        "type": "ul",
        "items": [
          "**Guaranteed rankings.** Nobody controls Google or ChatGPT. Anyone who promises a spot is guessing or lying.",
          "**Mass city pages.** Fifty near-identical pages with different town names can hurt more than help.",
          "**Fake reviews and made-up results.** They get removed, and they can damage the trust you're trying to build.",
          "**A full redesign before you know what's wrong.** Most fixes are small: clearer headings, your phone and hours in the right places, a few honest answers, consistent listings."
        ]
      },
      {
        "type": "h2",
        "text": "How to know if it's working"
      },
      {
        "type": "p",
        "text": "Pick 10 to 20 questions your customers ask. Once a month, ask them in the same two or three assistants and note whether you're named, who is, and which sources are cited. Keep a simple log next to the changes you made. AI answers vary from person to person and day to day, so look for trends over a few months, not single results."
      },
      {
        "type": "h2",
        "text": "Get your starting list in 15 seconds"
      },
      {
        "type": "p",
        "text": "Doing step one by hand is tedious, so we built a shortcut. The free Front Porch Growth SEO and AI Visibility Grader loads your site and runs more than 20 of the checks on this list, including your phone, address, and hours, business schema, FAQs, crawler access, whether your words load without JavaScript, HTTPS, mobile setup, sitemap, robots.txt, link previews, alt text, and rough speed. You get a score and a ranked list of fixes."
      },
      {
        "type": "p",
        "text": "No card and no sales call. The AI recommendation check uses real questions sent to real AI assistants. If it's not in your instant report, we run it and email you the results. No made-up answers, and no ranking promises."
      },
      {
        "type": "p",
        "text": "[Grade your site free](https://frontporchgrowth.com/ai-visibility?utm_source=blog&utm_medium=article&utm_campaign=ai-search-checklist-home-services) and start with whatever's at the top of your list."
      }
    ]
  }
];
