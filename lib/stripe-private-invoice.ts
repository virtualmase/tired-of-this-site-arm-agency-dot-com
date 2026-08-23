import { createHash, timingSafeEqual } from 'node:crypto';
import Stripe from 'stripe';
import catalog from '@/operations/stripe-catalog.json';

const casePattern = /^arm_[a-z0-9][a-z0-9_-]{2,63}$/;
const customerPattern = /^cus_[A-Za-z0-9]+$/;
const digestPattern = /^[a-f0-9]{64}$/;

type Installment = 'booking' | 'final';

interface InvoiceRequest {
  case_id: string;
  customer_id: string;
  installment: Installment;
  source_record_digest: string;
  authorization_digest: string;
}

export class InvoiceRequestError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message);
    this.name = 'InvoiceRequestError';
  }
}

function safeTokenEqual(supplied: string, expected: string): boolean {
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function authorizeInvoiceRequest(header: string | null, expectedToken: string | undefined): void {
  if (!expectedToken || Buffer.byteLength(expectedToken) < 32) {
    throw new InvoiceRequestError('CONFIGURATION_ERROR', 'Invoice operator is not configured', 503);
  }
  const supplied = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!supplied || !safeTokenEqual(supplied, expectedToken)) {
    throw new InvoiceRequestError('UNAUTHENTICATED', 'Valid operator authorization is required', 401);
  }
}

export function parseInvoiceRequest(value: unknown): InvoiceRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvoiceRequestError('INVALID_REQUEST', 'Request body must be an object');
  }
  const body = value as Record<string, unknown>;
  const allowed = ['case_id', 'customer_id', 'installment', 'source_record_digest', 'authorization_digest'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    throw new InvoiceRequestError('INVALID_REQUEST', 'Request body contains an unsupported field');
  }
  if (!casePattern.test(String(body.case_id || ''))) throw new InvoiceRequestError('INVALID_CASE', 'case_id is invalid');
  if (!customerPattern.test(String(body.customer_id || ''))) throw new InvoiceRequestError('INVALID_CUSTOMER', 'customer_id is invalid');
  if (!['booking', 'final'].includes(String(body.installment || ''))) throw new InvoiceRequestError('INVALID_INSTALLMENT', 'installment is invalid');
  if (!digestPattern.test(String(body.source_record_digest || ''))) throw new InvoiceRequestError('INVALID_SOURCE', 'source_record_digest is invalid');
  if (!digestPattern.test(String(body.authorization_digest || ''))) throw new InvoiceRequestError('INVALID_AUTHORIZATION', 'authorization_digest is invalid');
  return body as unknown as InvoiceRequest;
}

function requestKey(input: InvoiceRequest): string {
  return createHash('sha256')
    .update(`${input.case_id}\0${input.installment}\0${input.customer_id}\0${input.authorization_digest}`)
    .digest('hex');
}

function installmentFor(kind: Installment) {
  const installment = catalog.installments.find((item) => item.kind === kind);
  if (!installment) throw new InvoiceRequestError('CONFIGURATION_ERROR', 'Installment catalog is incomplete', 503);
  return installment;
}

export function stripeClient(secretKey: string | undefined): Stripe {
  if (!secretKey) throw new InvoiceRequestError('CONFIGURATION_ERROR', 'Stripe managed key is not configured', 503);
  return new Stripe(secretKey, { apiVersion: '2026-07-29.dahlia' });
}

export async function createAndSendPrivateInvoice(stripe: Stripe, input: InvoiceRequest) {
  const installment = installmentFor(input.installment);
  const key = requestKey(input);
  const metadata = {
    arm_case_id: input.case_id,
    installment: input.installment,
    source_record_digest: input.source_record_digest,
    authorization_digest: input.authorization_digest,
    offer_key: 'ai_buyer_intelligence_sprint'
  };

  const invoice = await stripe.invoices.create({
    auto_advance: false,
    collection_method: 'send_invoice',
    customer: input.customer_id,
    days_until_due: 7,
    description: `AI Buyer Intelligence Sprint — ${input.installment === 'booking' ? '60% booking payment' : '40% final payment'}`,
    footer: 'Private collection under the accepted written scope. No ranking, citation, or revenue outcome is guaranteed.',
    metadata
  }, { idempotencyKey: `arm-invoice-${key}` });

  if (invoice.status === 'draft') {
    await stripe.invoiceItems.create({
      customer: input.customer_id,
      invoice: invoice.id,
      pricing: { price: installment.price_id },
      quantity: 1,
      metadata
    }, { idempotencyKey: `arm-invoice-item-${key}` });
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false }, {
      idempotencyKey: `arm-invoice-finalize-${key}`
    });
    const sent = await stripe.invoices.sendInvoice(finalized.id, {}, {
      idempotencyKey: `arm-invoice-send-${key}`
    });
    return sanitizedInvoice(sent, installment.amount_usd);
  }

  return sanitizedInvoice(invoice, installment.amount_usd);
}

function sanitizedInvoice(invoice: Stripe.Invoice, amountUsd: number) {
  return {
    invoice_id: invoice.id,
    status: invoice.status,
    installment: invoice.metadata?.installment || null,
    amount_usd: amountUsd,
    currency: catalog.currency,
    hosted_invoice_url: invoice.hosted_invoice_url,
    due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    duplicate_safe: true
  };
}
