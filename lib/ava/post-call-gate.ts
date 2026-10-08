/** Subscription states that still belong to a paying Ava customer. */
export const PAYING_AVA_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const;

export function isPayingAvaSubscriptionStatus(status: string | null | undefined) {
  const value = (status || '').trim().toLowerCase();
  return (PAYING_AVA_SUBSCRIPTION_STATUSES as readonly string[]).includes(value);
}

export function isAvaCustomerProduct(product: string | null | undefined) {
  const value = (product || '').trim().toLowerCase();
  return value === '' || value === 'ava';
}

export type PostCallGateInput = {
  agentId: string;
  onboardingAgentId: string | null;
  customerProduct: string | null;
  subscriptionStatus: string | null;
};

export type PostCallGateDecision =
  | { process: true }
  | { process: false; reason: 'ignored_agent' };

/**
 * Workspace post-call webhooks include the public demo and Sales Ava.
 * Only a provisioned onboarding whose agent id matches, tied to an Ava
 * customer on an active or trialing subscription, may create a lead.
 */
export function decidePostCallGate(input: PostCallGateInput): PostCallGateDecision {
  const agentId = input.agentId.trim();
  const onboardingAgentId = (input.onboardingAgentId || '').trim();
  if (!agentId || agentId !== onboardingAgentId) {
    return { process: false, reason: 'ignored_agent' };
  }
  if (!isAvaCustomerProduct(input.customerProduct)) {
    return { process: false, reason: 'ignored_agent' };
  }
  if (!isPayingAvaSubscriptionStatus(input.subscriptionStatus)) {
    return { process: false, reason: 'ignored_agent' };
  }
  return { process: true };
}

export type PostCallEffects = {
  saveLead: boolean;
  sendEmail: boolean;
  sendSms: boolean;
};

/** Ignored agents save nothing and never call Resend or Twilio. */
export function planPostCallEffects(decision: PostCallGateDecision): PostCallEffects {
  if (!decision.process) {
    return { saveLead: false, sendEmail: false, sendSms: false };
  }
  return { saveLead: true, sendEmail: true, sendSms: true };
}
