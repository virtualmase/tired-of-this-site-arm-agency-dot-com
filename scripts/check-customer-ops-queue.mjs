import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCustomerOpsQueue } from './customer-ops-queue.mjs';
import { loadContract, readLedger } from './case-ledger.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = loadContract();
const qualified = readLedger(path.join(root, 'operations/examples/qualified-sprint.jsonl'));
const declined = readLedger(path.join(root, 'operations/examples/declined-brief.jsonl'));

const deliveryQueue = buildCustomerOpsQueue([qualified], contract, { asOf: '2026-08-20T17:00:00Z', horizonDays: 7 });
assert.equal(deliveryQueue.open_task_count, 7);
assert.equal(deliveryQueue.status_counts.due_soon, 1);
assert.equal(deliveryQueue.status_counts.scheduled, 6);
assert.equal(deliveryQueue.tasks[0].task_type, 'delivery_due');
assert.equal(deliveryQueue.tasks.filter((task) => task.task_type === 'action_owner_decision').length, 5);
assert.equal(deliveryQueue.tasks.some((task) => 'artifact_digest' in task), false, 'customer queue must not include artifact contents or digests');

const beforeEvidenceReview = buildCustomerOpsQueue([qualified], contract, { asOf: '2026-09-13T12:00:00Z', horizonDays: 7 });
assert.equal(beforeEvidenceReview.open_task_count, 2);
assert.equal(beforeEvidenceReview.tasks[0].task_type, 'evidence_freshness_review');
assert.equal(beforeEvidenceReview.tasks[0].status, 'overdue');
assert.equal(beforeEvidenceReview.tasks[1].task_type, 'learning_review');
assert.equal(beforeEvidenceReview.tasks.some((task) => task.task_type.startsWith('action_')), false);

const afterEvidenceReview = buildCustomerOpsQueue([qualified], contract, { asOf: '2026-09-14T12:00:00Z', horizonDays: 7 });
const evidenceTask = afterEvidenceReview.tasks.find((task) => task.task_type === 'evidence_freshness_review');
assert.equal(evidenceTask.due_at, '2026-10-13T16:00:00Z');
assert.equal(evidenceTask.status, 'scheduled');

const afterLearningReview = buildCustomerOpsQueue([qualified], contract, { asOf: '2026-10-12T18:00:00Z', horizonDays: 7 });
assert.equal(afterLearningReview.open_task_count, 2);
assert.equal(afterLearningReview.tasks.find((task) => task.task_type === 'learning_review').due_at, '2027-01-10T17:00:00Z');
assert.equal(afterLearningReview.tasks.find((task) => task.task_type === 'evidence_freshness_review').status, 'due_soon');

const declinedQueue = buildCustomerOpsQueue([declined], contract, { asOf: '2026-09-02T17:00:00Z', horizonDays: 7 });
assert.equal(declinedQueue.open_task_count, 1);
assert.equal(declinedQueue.tasks[0].task_type, 'learning_review');
assert.equal(declinedQueue.tasks[0].status, 'overdue');

assert.throws(() => buildCustomerOpsQueue([qualified], contract, { asOf: 'not-a-date', horizonDays: 7 }), /ISO UTC/);
assert.throws(() => buildCustomerOpsQueue([qualified], contract, { asOf: '2026-08-20T17:00:00Z', horizonDays: 91 }), /0 to 90/);

console.log('PASS: delivery, evidence freshness, action decision/outcome, and learning-review queues verified without external actions');
