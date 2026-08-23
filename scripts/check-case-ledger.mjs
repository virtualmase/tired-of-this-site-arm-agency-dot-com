import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContract, readLedger, summarizeLedger, validateLedger } from './case-ledger.mjs';
import { buildPortfolioMetrics } from './portfolio-metrics.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = loadContract();
const qualified = readLedger(path.join(root, 'operations/examples/qualified-sprint.jsonl'));
const declined = readLedger(path.join(root, 'operations/examples/declined-brief.jsonl'));
const clone = (value) => structuredClone(value);

function expectFailure(label, events, messageFragment) {
  const result = validateLedger(events, contract);
  assert.equal(result.valid, false, `${label} unexpectedly passed`);
  assert.ok(
    result.errors.some((message) => message.includes(messageFragment)),
    `${label} did not report ${JSON.stringify(messageFragment)}:\n${result.errors.join('\n')}`
  );
}

assert.equal(validateLedger(qualified, contract).valid, true, 'qualified Sprint example must pass');
assert.equal(validateLedger(declined, contract).valid, true, 'declined Brief example must pass');

{
  const events = clone(qualified);
  events.find((event) => event.type === 'fit.decision_recorded').actor.type = 'agent';
  expectFailure('agent fit decision', events, 'requires a human actor');
}

{
  const events = clone(qualified);
  events[0].data.email = 'not-allowed@example.test';
  expectFailure('private data key', events, 'prohibited private-data key data.email');
}

{
  const events = clone(qualified);
  events.find((event) => event.type === 'scope.accepted').data.acceptance_record_digest = 'not-a-digest';
  expectFailure('invalid external record digest', events, 'must be a SHA-256 hex digest');
}

{
  const events = clone(qualified);
  events.find((event) => event.type === 'scope.issued').data.artifact_digest = '9'.repeat(64);
  expectFailure('changed approved artifact', events, 'differs from approved artifact');
}

{
  const events = clone(qualified).filter((event) => event.type !== 'final_payment.confirmed');
  expectFailure('delivery before final payment', events, 'requires prior event final_payment.confirmed');
}

{
  const events = clone(qualified);
  events.find((event) => event.type === 'delivery.qa_completed').data.deliverables.pop();
  expectFailure('incomplete delivery set', events, 'deliverables must contain exactly');
}

{
  const events = clone(qualified);
  events.find((event) => event.type === 'booking_payment.requested').data.amount_usd = 7000;
  expectFailure('incorrect booking amount', events, 'data.amount_usd must equal 7500');
}

{
  const events = clone(qualified);
  const decision = events.find((event) => event.event_id === 'evt_sprint_006');
  decision.data.decision = 'rejected';
  expectFailure('rejected approval use', events, 'is not approved');
}

{
  const events = clone(qualified);
  const first = events[0];
  events[0] = events[1];
  events[1] = first;
  expectFailure('non-append order', events, 'occurred_at is earlier than the preceding append-only event');
}

const summary = summarizeLedger(qualified, contract);
assert.equal(summary.current_stage, 'closed');
assert.equal(summary.payments_confirmed_usd, 12500);
assert.equal(summary.approvals.requested, 4);
assert.equal(summary.approvals.consumed, 4);
assert.equal(summary.actions.registered, 1);
assert.equal(summary.actions.owner_accepted, 1);
assert.equal(summary.actions.outcomes_observed, 1);
assert.equal(summary.elapsed_hours.brief_to_review, 2);

const portfolio = buildPortfolioMetrics([qualified, declined], contract);
assert.equal(portfolio.case_count, 2);
assert.equal(portfolio.funnel_counts.brief_received, 2);
assert.equal(portfolio.funnel_counts.fit_proceeded, 1);
assert.equal(portfolio.funnel_counts.sprint_booked, 1);
assert.equal(portfolio.funnel_counts.deliverables_sent, 1);
assert.equal(portfolio.trigger_counts.category_launch, 1);
assert.equal(portfolio.trigger_counts.pipeline, 1);
assert.equal(portfolio.decline_reason_counts.decision_window_outside_fit, 1);
assert.equal(portfolio.approvals.consumed, 4);
assert.equal(portfolio.actions.cases_with_outcomes, 1);
assert.equal(portfolio.elapsed_time.brief_to_review.median_hours, 2);

console.log('PASS: case lifecycle, authority gates, commercial terms, privacy boundary, delivery completeness, and portfolio metrics verified');
