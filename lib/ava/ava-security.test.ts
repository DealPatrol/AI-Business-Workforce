import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canIssueDestinationEdit,
  notificationDestinationsChanged,
  notificationDestinationsFromParts,
  signDestinationEditToken,
  verifyDestinationEditToken,
  DESTINATION_EDIT_TTL_SECONDS,
} from '@/lib/ava/destination-edit';
import { decidePostCallGate, planPostCallEffects } from '@/lib/ava/post-call-gate';

const SECRET = 'test-destination-secret';
const SESSION = 'cs_test_ava_buyer_session';
const EMAIL = 'buyer@shop.example';
const NOW = 1_700_000_000;

describe('ElevenLabs post-call agent gate', () => {
  it('ignores demo and Sales Ava agents with no provisioned customer', () => {
    for (const agentId of ['agent_public_website_demo', 'agent_sales_ava', '']) {
      const decision = decidePostCallGate({
        agentId,
        onboardingAgentId: null,
        customerProduct: null,
        subscriptionStatus: null,
      });
      const effects = planPostCallEffects(decision);
      assert.equal(decision.process, false);
      assert.deepEqual(effects, { saveLead: false, sendEmail: false, sendSms: false });
    }
  });

  it('does not text, email, or save a lead when the subscription is not active or trialing', () => {
    for (const subscriptionStatus of ['canceled', 'incomplete', 'past_due', 'unpaid', '']) {
      const effects = planPostCallEffects(
        decidePostCallGate({
          agentId: 'agent_customer',
          onboardingAgentId: 'agent_customer',
          customerProduct: 'ava',
          subscriptionStatus,
        }),
      );
      assert.equal(effects.sendSms, false);
      assert.equal(effects.sendEmail, false);
      assert.equal(effects.saveLead, false);
    }
  });

  it('processes only the matching agent for an active or trialing Ava customer', () => {
    for (const subscriptionStatus of ['active', 'trialing']) {
      const effects = planPostCallEffects(
        decidePostCallGate({
          agentId: 'agent_customer',
          onboardingAgentId: 'agent_customer',
          customerProduct: 'ava',
          subscriptionStatus,
        }),
      );
      assert.deepEqual(effects, { saveLead: true, sendEmail: true, sendSms: true });
    }

    const mismatched = planPostCallEffects(
      decidePostCallGate({
        agentId: 'agent_public_website_demo',
        onboardingAgentId: 'agent_customer',
        customerProduct: 'ava',
        subscriptionStatus: 'active',
      }),
    );
    assert.equal(mismatched.sendSms, false);

    const otherProduct = planPostCallEffects(
      decidePostCallGate({
        agentId: 'agent_customer',
        onboardingAgentId: 'agent_customer',
        customerProduct: 'founding',
        subscriptionStatus: 'active',
      }),
    );
    assert.equal(otherProduct.saveLead, false);
  });
});

describe('onboarding notification destination lock', () => {
  it('treats formatted phones and email case as the same destination', () => {
    const current = notificationDestinationsFromParts({
      staffPhone: '(205) 555-0123',
      staffEmail: 'Sam@Shop.Example',
      staffContact: '',
    });
    const next = notificationDestinationsFromParts({
      staffPhone: '',
      staffEmail: '',
      staffContact: '+1 205-555-0123 / sam@shop.example',
    });
    assert.equal(notificationDestinationsChanged(current, next), false);
  });

  it('detects a lead phone or email change', () => {
    const current = notificationDestinationsFromParts({
      staffPhone: '+12055550123',
      staffEmail: 'sam@shop.example',
    });
    const changedPhone = notificationDestinationsFromParts({
      staffPhone: '+12055550199',
      staffEmail: 'sam@shop.example',
    });
    const changedEmail = notificationDestinationsFromParts({
      staffPhone: '+12055550123',
      staffEmail: 'attacker@example.com',
    });
    assert.equal(notificationDestinationsChanged(current, changedPhone), true);
    assert.equal(notificationDestinationsChanged(current, changedEmail), true);
  });

  it('accepts a fresh token for the Stripe email and rejects reuse against another inbox', () => {
    const token = signDestinationEditToken({
      sessionId: SESSION,
      email: EMAIL,
      secret: SECRET,
      nowSeconds: NOW,
    });
    assert.equal(
      verifyDestinationEditToken(token, {
        sessionId: SESSION,
        email: 'Buyer@Shop.example',
        secret: SECRET,
        nowSeconds: NOW + 60,
      }),
      true,
    );
    assert.equal(
      verifyDestinationEditToken(token, {
        sessionId: SESSION,
        email: 'attacker@example.com',
        secret: SECRET,
        nowSeconds: NOW + 60,
      }),
      false,
    );
    assert.equal(
      verifyDestinationEditToken(token, {
        sessionId: 'cs_test_other_session',
        email: EMAIL,
        secret: SECRET,
        nowSeconds: NOW + 60,
      }),
      false,
    );
    assert.equal(
      verifyDestinationEditToken(token, {
        sessionId: SESSION,
        email: EMAIL,
        secret: SECRET,
        nowSeconds: NOW + DESTINATION_EDIT_TTL_SECONDS + 120,
      }),
      false,
    );
    assert.equal(
      verifyDestinationEditToken(`${token}x`, {
        sessionId: SESSION,
        email: EMAIL,
        secret: SECRET,
        nowSeconds: NOW,
      }),
      false,
    );
  });

  it('issues a change link only for an active or trialing Ava checkout with an email', () => {
    assert.equal(
      canIssueDestinationEdit({
        outcome: 'ok',
        recognizedAvaCheckout: true,
        subscriptionStatus: 'trialing',
        email: EMAIL,
      }),
      true,
    );
    assert.equal(
      canIssueDestinationEdit({
        outcome: 'ok',
        recognizedAvaCheckout: true,
        subscriptionStatus: 'canceled',
        email: EMAIL,
      }),
      false,
    );
    assert.equal(
      canIssueDestinationEdit({
        outcome: 'ok',
        recognizedAvaCheckout: true,
        subscriptionStatus: 'active',
        email: '',
      }),
      false,
    );
    assert.equal(
      canIssueDestinationEdit({
        outcome: 'stripe_error',
        recognizedAvaCheckout: false,
        subscriptionStatus: '',
        email: EMAIL,
      }),
      false,
    );
  });
});
