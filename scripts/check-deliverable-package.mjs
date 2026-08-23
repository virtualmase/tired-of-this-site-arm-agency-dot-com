import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  packageDigest,
  summarizeDeliverablePackage,
  validateDeliverablePackage,
  validatePackageAgainstLedger
} from './deliverable-package.mjs';
import { readLedger } from './case-ledger.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageDocument = JSON.parse(fs.readFileSync(path.join(root, 'operations/examples/synthetic-deliverable-package.json'), 'utf8'));
const ledger = readLedger(path.join(root, 'operations/examples/qualified-sprint.jsonl'));
const clone = (value) => structuredClone(value);

function expectPackageFailure(label, document, messageFragment) {
  const result = validateDeliverablePackage(document);
  assert.equal(result.valid, false, `${label} unexpectedly passed`);
  assert.ok(result.errors.some((error) => error.includes(messageFragment)), `${label} did not report ${JSON.stringify(messageFragment)}:\n${result.errors.join('\n')}`);
}

const validation = validateDeliverablePackage(packageDocument);
assert.equal(validation.valid, true, validation.errors.join('\n'));
assert.equal(validatePackageAgainstLedger(packageDocument, ledger).valid, true, 'package and lifecycle must agree');

const summary = summarizeDeliverablePackage(packageDocument);
assert.equal(summary.artifact_digest, validation.digest);
assert.equal(summary.research_environment_count, 1);
assert.equal(summary.evidence_count, 1);
assert.equal(summary.question_count, 20);
assert.equal(summary.gap_count, 5);
assert.equal(summary.action_count, 5);
assert.deepEqual(Object.keys(summary.proof_status_by_dimension).sort(), ['fit', 'implementation', 'outcome', 'security']);

const reorderedTopLevel = Object.fromEntries(Object.entries(packageDocument).reverse());
assert.equal(packageDigest(reorderedTopLevel), packageDigest(packageDocument), 'digest must be independent of object key order');

{
  const document = clone(packageDocument);
  document.buyer_conversation_map.questions.pop();
  expectPackageFailure('short question set', document, 'must contain 20–40 items');
}

{
  const document = clone(packageDocument);
  document.buyer_conversation_map.questions[0].evidence_ids = ['evd_unknown_001'];
  expectPackageFailure('unknown evidence reference', document, 'references unknown ID evd_unknown_001');
}

{
  const document = clone(packageDocument);
  document.buyer_conversation_map.questions[1].id = document.buyer_conversation_map.questions[0].id;
  expectPackageFailure('duplicate question ID', document, 'id is duplicated');
}

{
  const document = clone(packageDocument);
  document.proof_conversion_review.checks.pop();
  expectPackageFailure('missing proof dimension', document, 'must contain exactly');
}

{
  const document = clone(packageDocument);
  document.action_register_90_day.actions.pop();
  expectPackageFailure('short action register', document, 'must contain 5–8 items');
}

{
  const document = clone(packageDocument);
  document.research_conditions.competitor_count = 6;
  expectPackageFailure('competitor scope overflow', document, 'competitor_count must be 1–5');
}

{
  const document = clone(packageDocument);
  document.action_register_90_day.actions[0].review_at = '2026-12-01T16:00:00Z';
  expectPackageFailure('action outside review window', document, 'must be within 90 days');
}

{
  const document = clone(packageDocument);
  document.action_register_90_day.actions[0].status = 'approved';
  expectPackageFailure('embedded action approval', document, 'status is invalid');
}

{
  const document = clone(packageDocument);
  document.claim_boundary.public_claim_approved = true;
  expectPackageFailure('embedded publication approval', document, 'public_claim_approved must equal false');
}

{
  const document = clone(packageDocument);
  document.email = 'not-allowed@example.test';
  expectPackageFailure('private data key', document, 'prohibited private-data key package.email');
}

{
  const document = clone(packageDocument);
  document.buyer_conversation_map.questions[0].question += ' Altered after QA.';
  const result = validatePackageAgainstLedger(document, ledger);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('delivery.qa_completed digest differs from package digest'));
  assert.ok(result.errors.includes('deliverables.sent digest differs from package digest'));
}

{
  const document = JSON.parse(JSON.stringify(packageDocument).replaceAll('evd_public_001', 'evd_other_001'));
  const result = validatePackageAgainstLedger(document, ledger);
  assert.equal(validateDeliverablePackage(document).valid, true);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('package evidence evd_other_001 is not registered in the ledger'));
}

{
  const document = clone(packageDocument);
  document.action_register_90_day.actions[0].owner_role = 'different_owner_role';
  const result = validatePackageAgainstLedger(document, ledger);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('package action act_category_001 differs from ledger field owner_role'));
}

console.log('PASS: evidence package bounds, cross-references, claim boundary, privacy keys, lifecycle registrations, and artifact digest binding verified');
