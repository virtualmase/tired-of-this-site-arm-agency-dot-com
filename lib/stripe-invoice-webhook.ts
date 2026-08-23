import { createHash } from 'node:crypto';
import Stripe from 'stripe';
import catalog from '@/operations/stripe-catalog.json';
import { InvoiceRequestError, assertStripeAccount } from '@/lib/stripe-private-invoice';

const supportedEvents = new Set(catalog.required_webhook_events);
const casePattern = /^arm_[a-z0-9][a-z0-9_-]{2,63}$/;
const digestPattern = /^[a-f0-9]{64}$/;

export class StripeWebhookError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message);
    this.name = 'StripeWebhookError';
  }
}

export function constructStripeWebhookEvent(
  stripe: Stripe,
  rawBody: string,
  signature: string | null,
  endpointSecret: string | undefined
): Stripe.Event {
  if (!endpointSecret || !endpointSecret.startsWith('whsec_') || endpointSecret.length < 24) {
    throw new StripeWebhookError('CONFIGURATION_ERROR', 'Stripe webhook is not configured', 503);
  }
  if (!signature) throw new StripeWebhookError('UNAUTHENTICATED', 'Stripe signature is required', 400);
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch {
    throw new StripeWebhookError('INVALID_SIGNATURE', 'Stripe signature is invalid', 400);
  }
}

function expectedInstallment(kind: string) {
  const installment = catalog.installments.find((item) => item.kind === kind);
  if (!installment) throw new StripeWebhookError('UNRECOGNIZED_INVOICE', 'Invoice installment is not recognized');
  return installment;
}

function invoiceFromEvent(event: Stripe.Event): Stripe.Invoice {
  const object = event.data.object;
  if (!object || object.object !== 'invoice') {
    throw new StripeWebhookError('INVALID_EVENT', 'Stripe event does not contain an invoice');
  }
  return object as Stripe.Invoice;
}

function validateInvoice(event: Stripe.Event, invoice: Stripe.Invoice) {
  if (!event.livemode) throw new StripeWebhookError('MODE_MISMATCH', 'Live webhook received a test event');
  const metadata = invoice.metadata || {};
  if (metadata.offer_key !== 'ai_buyer_intelligence_sprint') {
    throw new StripeWebhookError('UNRECOGNIZED_INVOICE', 'Invoice is outside the approved offer');
  }
  if (!casePattern.test(metadata.arm_case_id || '')) {
    throw new StripeWebhookError('INVALID_METADATA', 'Invoice case metadata is invalid');
  }
  if (!digestPattern.test(metadata.source_record_digest || '')) {
    throw new StripeWebhookError('INVALID_METADATA', 'Invoice source metadata is invalid');
  }
  if (!digestPattern.test(metadata.authorization_digest || '')) {
    throw new StripeWebhookError('INVALID_METADATA', 'Invoice authorization metadata is invalid');
  }
  const installment = expectedInstallment(metadata.installment || '');
  const expectedCents = installment.amount_usd * 100;
  if (invoice.currency !== catalog.currency || invoice.amount_due !== expectedCents) {
    throw new StripeWebhookError('AMOUNT_MISMATCH', 'Invoice amount or currency differs from the approved catalog');
  }
  if (event.type === 'invoice.paid' && (invoice.status !== 'paid' || invoice.amount_paid !== expectedCents)) {
    throw new StripeWebhookError('PAYMENT_MISMATCH', 'Paid invoice state differs from the approved installment');
  }
  if (event.type === 'invoice.voided' && invoice.status !== 'void') {
    throw new StripeWebhookError('STATUS_MISMATCH', 'Voided event does not contain a void invoice');
  }
  return { metadata, installment };
}

function eventDigest(eventId: string): string {
  return createHash('sha256').update(`stripe-event\0${eventId}`).digest('hex');
}

export async function reconcileStripeInvoiceEvent(stripe: Stripe, event: Stripe.Event) {
  if (!supportedEvents.has(event.type)) {
    return { accepted: true, processed: false, reason: 'event_not_required' } as const;
  }

  await assertStripeAccount(stripe);
  const invoice = invoiceFromEvent(event);
  const { metadata, installment } = validateInvoice(event, invoice);
  const digest = eventDigest(event.id);
  const reconciledAt = new Date(event.created * 1000).toISOString();

  await stripe.invoices.update(invoice.id, {
    metadata: {
      arm_reconciled_event_digest: digest,
      arm_reconciled_event_type: event.type,
      arm_reconciled_at: reconciledAt,
      arm_payment_state: event.type === 'invoice.paid'
        ? 'confirmed'
        : event.type === 'invoice.payment_failed'
          ? 'attention_required'
          : event.type === 'invoice.voided'
            ? 'voided'
            : 'requested'
    }
  }, { idempotencyKey: `arm-webhook-${digest}` });

  return {
    accepted: true,
    processed: true,
    case_id: metadata.arm_case_id,
    installment: installment.kind,
    payment_state: event.type === 'invoice.paid'
      ? 'confirmed'
      : event.type === 'invoice.payment_failed'
        ? 'attention_required'
        : event.type === 'invoice.voided'
          ? 'voided'
          : 'requested',
    source_event_digest: digest
  } as const;
}

export function normalizeStripeWebhookError(caught: unknown): StripeWebhookError {
  if (caught instanceof StripeWebhookError) return caught;
  if (caught instanceof InvoiceRequestError) {
    return new StripeWebhookError(caught.code, caught.message, caught.status);
  }
  return new StripeWebhookError('RECONCILIATION_FAILED', 'Stripe reconciliation failed', 503);
}
