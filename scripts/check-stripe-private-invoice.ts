import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {
  InvoiceRequestError,
  authorizeInvoiceRequest,
  createAndSendPrivateInvoice,
  parseInvoiceRequest
} from '../lib/stripe-private-invoice';

const input = {
  case_id: 'arm_case_test',
  customer_id: 'cus_TestCustomer123',
  installment: 'booking' as const,
  source_record_digest: 'a'.repeat(64),
  authorization_digest: 'b'.repeat(64)
};

function expectRequestError(action: () => unknown, code: string): void {
  assert.throws(action, (caught: unknown) => caught instanceof InvoiceRequestError && caught.code === code);
}

expectRequestError(() => authorizeInvoiceRequest(null, 'x'.repeat(32)), 'UNAUTHENTICATED');
expectRequestError(() => authorizeInvoiceRequest('Bearer wrong', 'x'.repeat(32)), 'UNAUTHENTICATED');
expectRequestError(() => authorizeInvoiceRequest('Bearer short', 'short'), 'CONFIGURATION_ERROR');
authorizeInvoiceRequest(`Bearer ${'x'.repeat(32)}`, 'x'.repeat(32));

assert.deepEqual(parseInvoiceRequest(input), input);
expectRequestError(() => parseInvoiceRequest({ ...input, email: 'private@example.com' }), 'INVALID_REQUEST');
expectRequestError(() => parseInvoiceRequest({ ...input, installment: 'full' }), 'INVALID_INSTALLMENT');

function invoice(status: Stripe.Invoice.Status, overrides: Partial<Stripe.Invoice> = {}): Stripe.Invoice {
  return {
    id: 'in_test123',
    object: 'invoice',
    status,
    metadata: { installment: 'booking' },
    hosted_invoice_url: status === 'draft' ? null : 'https://invoice.stripe.example/test',
    due_date: 1_788_000_000,
    ...overrides
  } as Stripe.Invoice;
}

function stripeMock(accountId: string, initialStatus: Stripe.Invoice.Status) {
  const calls = {
    create: 0,
    item: 0,
    finalize: 0,
    send: 0,
    createOptions: null as Stripe.RequestOptions | null,
    sendOptions: null as Stripe.RequestOptions | null
  };
  const stripe = {
    accounts: {
      retrieveCurrent: async () => ({ id: accountId })
    },
    invoices: {
      create: async (_params: Stripe.InvoiceCreateParams, options?: Stripe.RequestOptions) => {
        calls.create += 1;
        calls.createOptions = options || null;
        return invoice(initialStatus);
      },
      finalizeInvoice: async () => {
        calls.finalize += 1;
        return invoice('open');
      },
      sendInvoice: async (_id: string, _params: Stripe.InvoiceSendInvoiceParams, options?: Stripe.RequestOptions) => {
        calls.send += 1;
        calls.sendOptions = options || null;
        return invoice('open');
      }
    },
    invoiceItems: {
      create: async () => {
        calls.item += 1;
        return { id: 'ii_test123' };
      }
    }
  } as unknown as Stripe;
  return { stripe, calls };
}

async function main(): Promise<void> {
  const wrong = stripeMock('acct_wrong', 'draft');
  await assert.rejects(
    () => createAndSendPrivateInvoice(wrong.stripe, input),
    (caught: unknown) => caught instanceof InvoiceRequestError && caught.code === 'STRIPE_ACCOUNT_MISMATCH'
  );
  assert.equal(wrong.calls.create, 0, 'account mismatch must fail before invoice mutation');

  const fresh = stripeMock('acct_1TQGpQLROeZlmE6m', 'draft');
  const created = await createAndSendPrivateInvoice(fresh.stripe, input);
  assert.deepEqual(
    { create: fresh.calls.create, item: fresh.calls.item, finalize: fresh.calls.finalize, send: fresh.calls.send },
    { create: 1, item: 1, finalize: 1, send: 1 }
  );
  assert.match(fresh.calls.createOptions?.idempotencyKey || '', /^arm-invoice-[a-f0-9]{64}$/);
  assert.match(fresh.calls.sendOptions?.idempotencyKey || '', /^arm-invoice-send-[a-f0-9]{64}$/);
  assert.equal(created.amount_usd, 7500);
  assert.equal(created.duplicate_safe, true);

  const resume = stripeMock('acct_1TQGpQLROeZlmE6m', 'open');
  await createAndSendPrivateInvoice(resume.stripe, input);
  assert.deepEqual(
    { create: resume.calls.create, item: resume.calls.item, finalize: resume.calls.finalize, send: resume.calls.send },
    { create: 1, item: 0, finalize: 0, send: 1 },
    'an interrupted finalized invoice must resume the idempotent send step'
  );

  const complete = stripeMock('acct_1TQGpQLROeZlmE6m', 'paid');
  await createAndSendPrivateInvoice(complete.stripe, input);
  assert.deepEqual(
    { create: complete.calls.create, item: complete.calls.item, finalize: complete.calls.finalize, send: complete.calls.send },
    { create: 1, item: 0, finalize: 0, send: 0 },
    'a completed invoice must not be resent'
  );

  console.log('PASS: private Stripe invoicing is authenticated, strict, account-bound, idempotent, and resumable');
}

void main().catch((caught: unknown) => {
  console.error(caught);
  process.exitCode = 1;
});
