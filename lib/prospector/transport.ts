import { ProspectorSetupError } from '@/lib/prospector/errors';

export const LIST_UNSUBSCRIBE_POST = 'List-Unsubscribe=One-Click';

export type ColdEmailTransportName = 'stub' | 'smtp' | 'instantly';

export type ColdEmailHeaders = {
  'List-Unsubscribe': string;
  'List-Unsubscribe-Post': typeof LIST_UNSUBSCRIBE_POST;
};

export type ColdEmailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  headers: ColdEmailHeaders;
};

export type ColdEmailTransport = {
  name: ColdEmailTransportName;
  send(message: ColdEmailMessage): Promise<{ id: string | null }>;
};

/** Cold/prospect mail stays off unless this is exactly true, 1, yes, or on. */
export function coldEmailEnabled() {
  const value = process.env.COLD_EMAIL_ENABLED?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

export function coldEmailTransportName(): ColdEmailTransportName {
  const value = process.env.COLD_EMAIL_TRANSPORT?.trim().toLowerCase();
  switch (value) {
    case 'smtp':
    case 'instantly':
    case 'stub':
      return value;
    default:
      return 'stub';
  }
}

export function listUnsubscribeHeaders(unsubscribeUrl: string): ColdEmailHeaders {
  const url = unsubscribeUrl.trim();
  if (!/^https?:\/\//i.test(url) || /[\r\n<>]/.test(url)) {
    throw new ProspectorSetupError('Unsubscribe link must be an absolute URL without header breaks. Nothing was sent.');
  }
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_POST,
  };
}

function assertSendable(message: ColdEmailMessage) {
  if (!coldEmailEnabled()) {
    throw new ProspectorSetupError(
      'Cold email is turned off. Set COLD_EMAIL_ENABLED=true to send. Nothing was sent.',
    );
  }
  const unsubscribe = message.headers['List-Unsubscribe'];
  const oneClick = message.headers['List-Unsubscribe-Post'];
  if (!unsubscribe.startsWith('<') || !unsubscribe.endsWith('>') || oneClick !== LIST_UNSUBSCRIBE_POST) {
    throw new ProspectorSetupError('Cold email is missing one-click unsubscribe headers. Nothing was sent.');
  }
}

/**
 * Pluggable cold-email transport. SMTP and Instantly are the intended adapters.
 * Every adapter here is a stub: it checks the message shape and does not open a
 * socket, call Instantly, or call Resend. Resend stays on transactional mail only.
 */
function unwiredTransport(name: ColdEmailTransportName): ColdEmailTransport {
  return {
    name,
    async send(message) {
      assertSendable(message);
      const label = name === 'stub' ? 'stub' : name;
      throw new ProspectorSetupError(
        `The ${label} cold-email transport is not connected. Nothing was sent.`,
      );
    },
  };
}

export function createSmtpTransport(): ColdEmailTransport {
  return unwiredTransport('smtp');
}

export function createInstantlyTransport(): ColdEmailTransport {
  return unwiredTransport('instantly');
}

export function createStubTransport(): ColdEmailTransport {
  return unwiredTransport('stub');
}

export function createColdEmailTransport(
  name: ColdEmailTransportName = coldEmailTransportName(),
): ColdEmailTransport {
  switch (name) {
    case 'smtp':
      return createSmtpTransport();
    case 'instantly':
      return createInstantlyTransport();
    case 'stub':
      return createStubTransport();
    default: {
      const exhaustive: never = name;
      return exhaustive;
    }
  }
}
