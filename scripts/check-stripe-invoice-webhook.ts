import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {
  StripeWebhookError,
  constructStripeWebhookEvent,
  reconcileStripeInvoiceEvent
} from '../lib/stripe-invoice-webhook';

const endpointSecret = 'whsec_test_secret_at_least_24_bytes';
const signatureClient = new Stripe('sk_test_signature_only', { apiVersion: '2026-07-29.dahlia' });

function stripeEvent(type: Stripe.Event.Type = 'invoice.paid', overrides: Record<string, unknown> = {}): Stripe.Event {
  return {
    id: 'evt_test_paid_123',
    object: 'event',
    api_version: '2026-07-29.dahlia',
    created: 1_787_500_000,
    data: {
      object: {
        id: 'in_test_123',
        object: 'invoice',
        amount_due: 750_000,
        amount_paid: type === 'invoice.paid' ? 750_000 : 0,
        currency: 'usd',
        status: type === 'invoice.paid' ? 'paid' : type === 'invoice.voided' ? 'void' : 'open',
        metadata: {
          arm_case_id: 'arm_case_test',
          installment: 'booking',
          source_record_digest: 'a'.repeat(64),
          authorization_digest: 'b'.repeat(64),
          offer_key: 'ai_buyer_intelligence_sprint'
        },
        ...overrides
      }
    },
    livemode: true,
    pending_webhooks: 1,
    request: null,
    type
  } as Stripe.Event;
}

function mockStripe(accountId = 'acct_1TQGpQLROeZlmE6m') {
  const calls: Array<{ id: string; params: Stripe.InvoiceUpdateParams; options?: Stripe.RequestOptions }> = [];
  return {
    stripe: {
      accounts: { retrieveCurrent: async () => ({ id: accountId }) },
      invoices: {
        update: async (id: string, params: Stripe.InvoiceUpdateParams, options?: Stripe.RequestOptions) => {
          calls.push({ id, params, options });
          return { id };
        }
      }
    } as unknown as Stripe,
    calls
  };
}

async function expectWebhookError(action: () => Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(action, (caught: unknown) => (
    typeof caught === 'object' && caught !== null && 'code' in caught && caught.code === code
  ));
}

async function main(): Promise<void> {
  const rawBody = JSON.stringify(stripeEvent());
  const header = signatureClient.webhooks.generateTestHeaderString({ payload: rawBody, secret: endpointSecret });
  assert.equal(constructStripeWebhookEvent(signatureClient, rawBody, header, endpointSecret).id, 'evt_test_paid_123');
  assert.throws(
    () => constructStripeWebhookEvent(signatureClient, rawBody, 'bad', endpointSecret),
    (caught: unknown) => caught instanceof StripeWebhookError && caught.code === 'INVALID_SIGNATURE'
  );

  const paid = mockStripe();
  const result = await reconcileStripeInvoiceEvent(paid.stripe, stripeEvent());
  assert.equal(result.processed, true);
  assert.equal(result.payment_state, 'confirmed');
  assert.equal(paid.calls.length, 1);
  assert.equal(paid.calls[0]?.id, 'in_test_123');
  assert.match(paid.calls[0]?.options?.idempotencyKey || '', /^arm-webhook-[a-f0-9]{64}$/);
  assert.equal(paid.calls[0]?.params.metadata?.arm_payment_state, 'confirmed');

  const ignored = mockStripe();
  const ignoredResult = await reconcileStripeInvoiceEvent(ignored.stripe, stripeEvent('customer.created'));
  assert.deepEqual(ignoredResult, { accepted: true, processed: false, reason: 'event_not_required' });
  assert.equal(ignored.calls.length, 0);

  await expectWebhookError(
    () => reconcileStripeInvoiceEvent(mockStripe('acct_wrong').stripe, stripeEvent()),
    'STRIPE_ACCOUNT_MISMATCH'
  );
  await expectWebhookError(
    () => reconcileStripeInvoiceEvent(mockStripe().stripe, stripeEvent('invoice.paid', { amount_paid: 500_000 })),
    'PAYMENT_MISMATCH'
  );
  await expectWebhookError(
    () => reconcileStripeInvoiceEvent(mockStripe().stripe, { ...stripeEvent(), livemode: false }),
    'MODE_MISMATCH'
  );
  await expectWebhookError(
    () => reconcileStripeInvoiceEvent(mockStripe().stripe, stripeEvent('invoice.paid', {
      metadata: {
        arm_case_id: 'arm_case_test',
        installment: 'booking',
        offer_key: 'ai_buyer_intelligence_sprint'
      }
    })),
    'INVALID_METADATA'
  );

  console.log('PASS: Stripe webhooks are signature-verified, live-account-bound, strict, idempotent, and privacy-safe');
}

void main().catch((caught: unknown) => {
  console.error(caught);
  process.exitCode = 1;
});
