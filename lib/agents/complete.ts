import OpenAI from 'openai';

export class AgentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentConfigError';
  }
}

export async function completeDraft(instructions: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new AgentConfigError(
      'OpenAI is not configured. Set OPENAI_API_KEY on the server. No draft was requested.',
    );
  }
  const openai = new OpenAI({ apiKey });
  const response = await openai.responses.create({
    model: process.env.OPENAI_AUDIT_MODEL || 'gpt-5-mini',
    input: instructions,
    text: { format: { type: 'json_object' } },
  });
  const text = response.output_text?.trim();
  if (!text) throw new Error('The model returned an empty draft.');
  try {
    const parsed = JSON.parse(text) as { draft?: unknown };
    const draft = typeof parsed.draft === 'string' ? parsed.draft.trim() : '';
    if (draft.length < 20) throw new Error('The model draft was too short to use.');
    return draft.slice(0, 6000);
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('The model response was not valid JSON.');
    throw error;
  }
}
