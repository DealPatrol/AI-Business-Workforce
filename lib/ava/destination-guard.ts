import { readAvaCheckoutIdentity } from '@/lib/ava/checkout';
import {
  DestinationLockedError,
  canIssueDestinationEdit,
  destinationEditSecret,
  verifyDestinationEditToken,
} from '@/lib/ava/destination-edit';

export const DESTINATION_LOCKED_MESSAGE =
  'Lead phone and email are locked after the first setup. Request a change link sent to the email on your Stripe checkout. That link expires in 30 minutes.';

export async function readDestinationEditAuthorization(sessionId: string) {
  const identity = await readAvaCheckoutIdentity(sessionId);
  const secret = destinationEditSecret();
  const paying = canIssueDestinationEdit({
    outcome: identity.outcome,
    recognizedAvaCheckout: identity.recognizedAvaCheckout,
    subscriptionStatus: identity.subscriptionStatus,
    email: identity.email,
  });
  return { identity, secret, paying };
}

/**
 * After the first onboarding save, notification destinations change only with a
 * fresh token that was signed for the email Stripe currently has on this session,
 * and only while that subscription is active or trialing.
 */
export async function assertNotificationDestinationChange(input: {
  sessionId: string;
  editToken: string;
}) {
  const auth = await readDestinationEditAuthorization(input.sessionId);
  const allowed =
    Boolean(auth.secret) &&
    auth.paying &&
    verifyDestinationEditToken(input.editToken, {
      sessionId: input.sessionId,
      email: auth.identity.email,
      secret: auth.secret,
    });
  if (!allowed) {
    throw new DestinationLockedError(DESTINATION_LOCKED_MESSAGE);
  }
}
