const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

export type AvaOnboardingDetails = {
  businessName: string;
  businessHours: string;
  services: string;
  callHandlingRules: string;
  staffName: string;
  staffContact: string;
  calendarPreference: string;
  urgentCallRules: string;
};

export type AvaProvisioningRecord = AvaOnboardingDetails & {
  id: string;
  elevenlabsAgentId: string | null;
};

type UpdateProvisioningRecord = (
  changes: Record<string, string | null>,
) => Promise<void>;

export type AvaProvisioningResult = {
  status: 'agent_ready_phone_pending' | 'pending_credentials' | 'pending_manual' | 'failed';
  agentId: string | null;
  phoneStatus: 'pending_manual';
  message: string;
};

function customerAgentName(businessName: string) {
  return `Ava — ${businessName}`.slice(0, 100);
}

export function buildAvaAgentPrompt(details: AvaOnboardingDetails) {
  return `You are Ava, the phone receptionist for ${details.businessName}.

Your job is to answer callers clearly and warmly, qualify their request, follow the business's booking rules, and hand off to staff when required. Never invent availability, prices, services, policies, or emergency guidance.

BUSINESS DETAILS
- Business: ${details.businessName}
- Hours: ${details.businessHours}
- Services: ${details.services}

CALL HANDLING
${details.callHandlingRules}

BOOKING
${details.calendarPreference}

URGENT CALLS
${details.urgentCallRules}

STAFF HANDOFF
- Primary contact: ${details.staffName}
- Contact method: ${details.staffContact}

For every lead, collect the caller's name, callback number, requested service, service address when relevant, and urgency. Confirm important details aloud. If a requested action is not configured, explain that ${details.staffName} will follow up rather than pretending it is complete.`;
}

function firstMessage(businessName: string) {
  return `Thank you for calling ${businessName}. This is Ava. How can I help you today?`;
}

async function elevenLabsRequest(path: string, init: RequestInit) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured.');
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('xi-api-key', apiKey);

  const response = await fetch(`${ELEVENLABS_API}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const detail =
      typeof data.detail === 'string'
        ? data.detail
        : typeof data.message === 'string'
          ? data.message
          : `ElevenLabs returned ${response.status}.`;
    throw new Error(detail);
  }

  return data;
}

async function duplicateTemplateAgent(templateAgentId: string, name: string) {
  const data = await elevenLabsRequest(
    `/convai/agents/${encodeURIComponent(templateAgentId)}/duplicate`,
    {
      method: 'POST',
      body: JSON.stringify({ name }),
    },
  );

  if (typeof data.agent_id !== 'string' || !data.agent_id) {
    throw new Error('ElevenLabs did not return an agent ID.');
  }

  return data.agent_id;
}

async function configureCustomerAgent(agentId: string, details: AvaOnboardingDetails) {
  await elevenLabsRequest(`/convai/agents/${encodeURIComponent(agentId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: customerAgentName(details.businessName),
      conversation_config: {
        agent: {
          first_message: firstMessage(details.businessName),
          prompt: {
            prompt: buildAvaAgentPrompt(details),
          },
        },
      },
    }),
  });
}

export async function provisionAvaAgent(
  record: AvaProvisioningRecord,
  updateRecord: UpdateProvisioningRecord,
): Promise<AvaProvisioningResult> {
  const templateAgentId = process.env.ELEVENLABS_AGENT_ID;
  if (!process.env.ELEVENLABS_API_KEY || !templateAgentId) {
    await updateRecord({
      agent_status: 'pending_credentials',
      provisioning_error: 'ElevenLabs credentials or template agent ID are not configured.',
    });
    return {
      status: 'pending_credentials',
      agentId: record.elevenlabsAgentId,
      phoneStatus: 'pending_manual',
      message: 'Agent creation is waiting for ElevenLabs credentials.',
    };
  }

  let agentId = record.elevenlabsAgentId;

  try {
    await updateRecord({
      agent_status: agentId ? 'configuring' : 'provisioning',
      provisioning_error: null,
    });

    agentId =
      agentId ??
      (await duplicateTemplateAgent(
        templateAgentId,
        customerAgentName(record.businessName),
      ));

    if (!record.elevenlabsAgentId) {
      await updateRecord({
        elevenlabs_agent_id: agentId,
        agent_status: 'configuring',
      });
    }

    await configureCustomerAgent(agentId, record);
    await updateRecord({
      agent_status: 'agent_ready_phone_pending',
      phone_status: 'pending_manual',
      provisioning_error: null,
    });

    return {
      status: 'agent_ready_phone_pending',
      agentId,
      phoneStatus: 'pending_manual',
      message: 'Customer agent created and configured; phone number setup is still manual.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown provisioning error.';
    await updateRecord({
      agent_status: 'failed',
      provisioning_error: message.slice(0, 2_000),
    });
    return {
      status: 'failed',
      agentId,
      phoneStatus: 'pending_manual',
      message,
    };
  }
}
