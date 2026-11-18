import OpenAI from 'openai';
import { tradeNoun } from '@/lib/grader/trades';

/**
 * Live AI recommendation checks. OFF unless GRADER_LIVE_AI=on AND an OpenAI key is set,
 * because every check is a paid API call. When off, the grader says so plainly and never
 * shows a made-up result.
 */
export type AiCheckRecord = {
  engine: string;
  model: string;
  prompt: string;
  location: string;
  checkedAt: string;
  mentioned: boolean;
  citedDomains: string[];
  excerpt: string;
};

export type AiCheckOutcome =
  | { status: 'off'; reason: string; records: [] }
  | { status: 'done'; records: AiCheckRecord[]; method: string }
  | { status: 'error'; reason: string; records: AiCheckRecord[] };

const MAX_PROMPTS_PER_REPORT = 3;
const DAILY_CAP = Number(process.env.GRADER_AI_DAILY_CAP || 30);
let dayKey = '';
let usedToday = 0;

export function liveAiEnabled() {
  return process.env.GRADER_LIVE_AI?.trim().toLowerCase() === 'on' && Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function aiPrompts(tradeLabel: string, city: string) {
  const noun = tradeNoun(tradeLabel);
  return [
    `Who is a good ${noun} in ${city}?`,
    `I need a ${noun} near ${city}. Who should I call?`,
    `Recommend a reliable ${noun} in ${city} with good reviews.`,
  ].slice(0, MAX_PROMPTS_PER_REPORT);
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export async function runAiChecks(input: {
  businessName: string | null;
  domain: string;
  tradeLabel: string;
  city: string;
}): Promise<AiCheckOutcome> {
  if (!liveAiEnabled()) {
    return { status: 'off', reason: 'Live AI checks are not switched on for this site yet.', records: [] };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (dayKey !== today) {
    dayKey = today;
    usedToday = 0;
  }
  const prompts = aiPrompts(input.tradeLabel, input.city);
  if (usedToday + prompts.length > DAILY_CAP) {
    return { status: 'off', reason: 'Today’s live-check budget is used up. We will run yours by hand and email the results.', records: [] };
  }
  usedToday += prompts.length;

  const model = process.env.GRADER_AI_MODEL?.trim() || 'gpt-4.1-mini';
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const [cityName, region] = input.city.split(',').map((part) => part.trim());
  const records: AiCheckRecord[] = [];
  const nameLower = (input.businessName || '').toLowerCase().trim();
  try {
    for (const prompt of prompts) {
      const response = await client.responses.create({
        model,
        input: prompt,
        tools: [
          {
            type: 'web_search_preview',
            user_location: { type: 'approximate', country: 'US', city: cityName || undefined, region: region || undefined },
          },
        ],
      } as never);
      const output = response as unknown as {
        output_text?: string;
        output?: Array<{ content?: Array<{ annotations?: Array<{ type?: string; url?: string }> }> }>;
      };
      const answer = (output.output_text || '').trim();
      const cited = Array.from(
        new Set(
          (output.output || [])
            .flatMap((item) => item.content || [])
            .flatMap((content) => content.annotations || [])
            .filter((annotation) => annotation.type === 'url_citation' && annotation.url)
            .map((annotation) => domainOf(annotation.url || ''))
            .filter(Boolean),
        ),
      ).slice(0, 8);
      const lower = answer.toLowerCase();
      const mentioned =
        cited.includes(input.domain) || lower.includes(input.domain) || (nameLower.length >= 4 && lower.includes(nameLower));
      records.push({
        engine: 'OpenAI Responses API with web search',
        model,
        prompt,
        location: input.city,
        checkedAt: new Date().toISOString(),
        mentioned,
        citedDomains: cited,
        excerpt: answer.slice(0, 600),
      });
    }
    return {
      status: 'done',
      records,
      method: `${records.length} prompts, one run each, asked through the OpenAI API with web search and an approximate location of ${input.city}. Results can differ by person, device, and day. This is a small sample, not your visibility across all searches.`,
    };
  } catch (error) {
    console.error('grader ai check error', error instanceof Error ? error.message : error);
    return { status: 'error', reason: 'The live AI check did not finish. We will run it again and email the results.', records };
  }
}
