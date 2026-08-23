import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContract } from './case-ledger.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'operations/stripe-catalog.json'), 'utf8'));
const contract = loadContract();

assert.equal(catalog.schema_version, 1);
assert.equal(catalog.mode, 'live');
assert.match(catalog.account_id, /^acct_[A-Za-z0-9]+$/);
assert.equal(catalog.collection_method, 'send_invoice');
assert.equal(catalog.public_checkout, false);
assert.equal(catalog.currency, contract.commercial_terms.currency.toLowerCase());
assert.match(catalog.product.id, /^prod_[A-Za-z0-9]+$/);
assert.equal(catalog.product.name, 'AI Buyer Intelligence Sprint');
assert.equal(catalog.product.active, true);
assert.equal(catalog.product.total_usd, contract.commercial_terms.total_usd);
assert.equal(catalog.product.delivery_business_days, contract.commercial_terms.delivery_business_days);
assert.equal(catalog.product.journey, 'written_scope_private_collection');

assert.deepEqual(catalog.installments.map((item) => item.kind), ['booking', 'final']);
assert.deepEqual(catalog.installments.map((item) => item.amount_usd), [
  contract.commercial_terms.booking_payment_usd,
  contract.commercial_terms.final_payment_usd
]);
assert.deepEqual(catalog.installments.map((item) => item.percent), [60, 40]);
assert.equal(catalog.installments.reduce((sum, item) => sum + item.amount_usd, 0), contract.commercial_terms.total_usd);
for (const installment of catalog.installments) {
  assert.match(installment.price_id, /^price_[A-Za-z0-9]+$/);
  assert.match(installment.lookup_key, /^arm_ai_buyer_intelligence_sprint_(booking|final)_v1$/);
  assert.equal(installment.active, true);
}

assert.deepEqual(catalog.required_invoice_metadata, ['arm_case_id', 'installment', 'source_record_digest']);
assert.deepEqual(catalog.required_webhook_events, ['invoice.finalized', 'invoice.paid', 'invoice.payment_failed', 'invoice.voided']);
assert.match(catalog.configured_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

const serialized = JSON.stringify(catalog);
for (const prohibited of contract.prohibited_data_keys) {
  assert.equal(Object.hasOwn(catalog, prohibited), false);
  assert.equal(serialized.includes('sk_live_'), false);
  assert.equal(serialized.includes('rk_live_'), false);
}

console.log('PASS: live Stripe catalog matches the fixed Sprint scope, 60/40 terms, private invoicing boundary, metadata, and webhook contract');
