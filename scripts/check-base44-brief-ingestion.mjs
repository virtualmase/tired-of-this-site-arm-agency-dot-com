import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BriefIngestionError,
  InMemoryBriefLedgerStore,
  ingestSignedBase44Brief,
  signBase44Notification
} from './base44-brief-ingestion.mjs';
import { validateLedger } from './case-ledger.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidateFixture = JSON.parse(fs.readFileSync(path.join(root, 'operations/examples/base44-brief-candidate-input.json'), 'utf8'));
const notificationFixture = JSON.parse(fs.readFileSync(path.join(root, 'operations/examples/base44-brief-notification.json'), 'utf8'));
const notificationSecret = 'synthetic-notification-secret-32-bytes-minimum';
const idSecret = 'synthetic-opaque-identifier-secret-32-bytes-minimum';
const recordedAt = '2026-08-23T16:00:05Z';
const lead = { ...candidateFixture.lead, id: notificationFixture.source_record_id, created_date: candidateFixture.occurred_at };
const rawBody = JSON.stringify(notificationFixture);
const signature = signBase44Notification(rawBody, notificationSecret);
const privateValues = [lead.id, lead.name, lead.email, lead.company, lead.entity_url, 'Synthetic software category', 'Synthetic enterprise team', 'Synthetic alternative'];

async function expectFailure(label, operation, code) {
  await assert.rejects(operation, (error) => {
    assert.ok(error instanceof BriefIngestionError, `${label} returned an unsafe error type`);
    assert.equal(error.code, code, `${label} returned ${error.code}`);
    for (const value of privateValues) assert.equal(error.message.includes(value), false, `${label} leaked a private value`);
    return true;
  });
}

const store = new InMemoryBriefLedgerStore();
let fetchCount = 0;
const fetchLead = async (sourceRecordId) => {
  fetchCount += 1;
  assert.equal(sourceRecordId, lead.id);
  return structuredClone(lead);
};
const options = { rawBody, signature, notificationSecret, idSecret, fetchLead, store, recordedAt };
const first = await ingestSignedBase44Brief(options);
const second = await ingestSignedBase44Brief(options);

assert.equal(first.status, 'appended');
assert.equal(second.status, 'duplicate');
assert.equal(fetchCount, 2, 'each notification attempt must re-read the canonical Lead');
assert.equal(first.case_id, second.case_id);
assert.equal(first.event_id, second.event_id);
assert.equal(store.events().length, 1, 'a retry must append exactly one event');
assert.equal(validateLedger(store.events()).valid, true);
assert.equal(store.deadLetters().length, 0);

const serializedOutput = JSON.stringify({ first, events: store.events(), deadLetters: store.deadLetters() });
for (const value of privateValues) assert.equal(serializedOutput.includes(value), false, `ingestion output leaked ${value}`);
assert.match(first.case_id, /^arm_[a-f0-9]{40}$/);
assert.match(first.event_id, /^evt_[a-f0-9]{40}$/);
assert.match(first.source_record_digest, /^[a-f0-9]{64}$/);

{
  const untrustedStore = new InMemoryBriefLedgerStore();
  await expectFailure('invalid signature', () => ingestSignedBase44Brief({ ...options, signature: `sha256=${'0'.repeat(64)}`, store: untrustedStore }), 'UNAUTHENTICATED');
  assert.equal(untrustedStore.events().length, 0);
  assert.equal(untrustedStore.deadLetters().length, 0, 'untrusted input must not enter the dead-letter store');
}

{
  const driftStore = new InMemoryBriefLedgerStore();
  const driftLead = { ...lead, service_interest: 'signal_audit' };
  await expectFailure('source drift', () => ingestSignedBase44Brief({ ...options, fetchLead: async () => driftLead, store: driftStore }), 'SOURCE_DRIFT');
  assert.equal(driftStore.events().length, 0);
  assert.equal(driftStore.deadLetters().length, 1);
  assert.equal(driftStore.deadLetters()[0].failure_code, 'SOURCE_DRIFT');
  assert.equal(driftStore.deadLetters()[0].retryable, false);
}

{
  const unavailableStore = new InMemoryBriefLedgerStore();
  await expectFailure('source unavailable', () => ingestSignedBase44Brief({ ...options, fetchLead: async () => { throw new Error(`failed for ${lead.email}`); }, store: unavailableStore }), 'SOURCE_UNAVAILABLE');
  assert.equal(unavailableStore.deadLetters().length, 1);
  assert.equal(unavailableStore.deadLetters()[0].retryable, true);
}

{
  const invalidBody = JSON.stringify({ ...notificationFixture, source_record_id: lead.email });
  const invalidSignature = signBase44Notification(invalidBody, notificationSecret);
  const invalidStore = new InMemoryBriefLedgerStore();
  await expectFailure('invalid source identifier', () => ingestSignedBase44Brief({ ...options, rawBody: invalidBody, signature: invalidSignature, store: invalidStore }), 'INVALID_NOTIFICATION');
  assert.equal(invalidStore.deadLetters().length, 0, 'invalid identifiers must not be copied to dead letters');
}

{
  const weakSecret = 'too-short';
  await expectFailure('weak identifier secret', () => ingestSignedBase44Brief({ ...options, idSecret: weakSecret }), 'CONFIGURATION_ERROR');
}

console.log('PASS: signed Base44 Brief ingestion is canonical-read, privacy-safe, deterministic, idempotent, fail-closed, and dead-letter aware');
