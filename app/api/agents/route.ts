import { NextResponse } from 'next/server';
import { agentInstructions, getAgent, isAgentId, readAgentFields } from '@/lib/agents/catalog';
import { AgentConfigError, completeDraft } from '@/lib/agents/complete';
import { takeAgentTurn } from '@/lib/agents/limiter';
import { clientIp } from '@/lib/analytics/request-context';

export async function POST(request: Request) {
  const ip = clientIp(request.headers.get('x-forwarded-for')) || 'unknown';
  const limit = takeAgentTurn(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many drafts from this network. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const body = (await request.json().catch(() => null)) as { agent?: unknown; fields?: unknown } | null;
  const agentId = typeof body?.agent === 'string' ? body.agent : '';
  if (!isAgentId(agentId)) {
    return NextResponse.json({ error: 'Unknown agent.' }, { status: 400 });
  }
  const agent = getAgent(agentId);
  if (!agent) return NextResponse.json({ error: 'Unknown agent.' }, { status: 400 });
  const fields = readAgentFields(agent, body?.fields);
  if (!fields.ok) return NextResponse.json({ error: fields.error }, { status: 400 });

  try {
    const draft = await completeDraft(agentInstructions(agentId, fields.fields));
    return NextResponse.json({ draft });
  } catch (error) {
    if (error instanceof AgentConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('agent draft failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'The draft could not be written. Nothing was sent to a customer.' }, { status: 502 });
  }
}
