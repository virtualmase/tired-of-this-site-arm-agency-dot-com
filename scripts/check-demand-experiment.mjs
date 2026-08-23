import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  demandPlanDigest,
  summarizeDemandPlan,
  summarizeDemandReview,
  validateDemandPlan,
  validateDemandReview
} from './demand-experiment.mjs';
import { buildDemandReviewQueue } from './demand-review-queue.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'operations/examples/synthetic-demand-plan.json'), 'utf8'));
const review = JSON.parse(fs.readFileSync(path.join(root, 'operations/examples/synthetic-demand-review.json'), 'utf8'));
const clone = (value) => structuredClone(value);

function expectPlanFailure(label, document, fragment) {
  const result = validateDemandPlan(document);
  assert.equal(result.valid, false, `${label} unexpectedly passed`);
  assert.ok(result.errors.some((error) => error.includes(fragment)), `${label} did not report ${JSON.stringify(fragment)}:\n${result.errors.join('\n')}`);
}

function expectReviewFailure(label, planDocument, reviewDocument, fragment) {
  const result = validateDemandReview(planDocument, reviewDocument);
  assert.equal(result.valid, false, `${label} unexpectedly passed`);
  assert.ok(result.errors.some((error) => error.includes(fragment)), `${label} did not report ${JSON.stringify(fragment)}:\n${result.errors.join('\n')}`);
}

const planValidation = validateDemandPlan(plan);
assert.equal(planValidation.valid, true, planValidation.errors.join('\n'));
assert.equal(planValidation.digest, review.experiment_digest);
assert.equal(validateDemandReview(plan, review).valid, true);
assert.equal(demandPlanDigest(Object.fromEntries(Object.entries(plan).reverse())), planValidation.digest, 'plan digest must ignore object key order');

const planSummary = summarizeDemandPlan(plan);
assert.equal(planSummary.status, 'draft');
assert.equal(planSummary.account_batch_limit, 15);
assert.equal(planSummary.metric_count, 6);
assert.equal(Object.values(planSummary.authority).every((value) => value === false), true);
assert.equal(Object.values(planSummary.privacy).every((value) => value === false), true);

const reviewSummary = summarizeDemandReview(plan, review);
assert.equal(reviewSummary.verified_metric_count, 0);
assert.equal(reviewSummary.unavailable_metric_count, 6);
assert.equal(reviewSummary.hypothesis_assessment, 'inconclusive');
assert.equal(reviewSummary.recommended_decision, 'stop');

{
  const document = clone(plan);
  document.channel.target_route = '/not-an-active-route/';
  expectPlanFailure('inactive target route', document, 'not an active sitemap route');
}

{
  const document = clone(plan);
  document.audience.account_batch_limit = 16;
  expectPlanFailure('oversized account batch', document, 'must be 0–15');
}

{
  const document = clone(plan);
  document.channel.utm_campaign = 'Named Person Campaign';
  expectPlanFailure('personal campaign label shape', document, 'lowercase non-personal campaign label');
}

{
  const document = clone(plan);
  document.authority.external_send_approved = true;
  expectPlanFailure('embedded send approval', document, 'external_send_approved must equal false');
}

{
  const document = clone(plan);
  document.privacy.personal_data_in_campaign_labels = true;
  expectPlanFailure('personal label attestation', document, 'personal_data_in_campaign_labels must equal false');
}

{
  const document = clone(plan);
  document.results = { conversion_rate: 1 };
  expectPlanFailure('embedded unverified results', document, 'prohibited plan key document.results');
}

{
  const document = clone(plan);
  document.measurement.metrics.pop();
  expectPlanFailure('missing funnel metric', document, 'must contain exactly');
}

{
  const document = clone(plan);
  document.measurement.metrics[0].source = 'campaign_specific_tracker';
  expectPlanFailure('unsupported metric source', document, 'source must equal vercel_web_analytics');
}

{
  const changedPlan = clone(plan);
  changedPlan.hypothesis += ' Altered after review.';
  expectReviewFailure('review of altered plan', changedPlan, review, 'differs from the plan digest');
}

{
  const document = clone(review);
  document.metric_observations[0].value = 10;
  expectReviewFailure('value without evidence', plan, document, 'value must be null when unavailable');
}

{
  const document = clone(review);
  document.metric_observations[0].evidence_status = 'verified';
  document.metric_observations[0].value = 10;
  expectReviewFailure('verified count without source digest', plan, document, 'must be a SHA-256 hex digest when verified');
}

{
  const document = clone(review);
  document.hypothesis_assessment = 'supported';
  expectReviewFailure('claim from unavailable metrics', plan, document, 'must be inconclusive when every metric is unavailable');
}

{
  const document = clone(review);
  document.authority.human_decision_recorded = true;
  expectReviewFailure('embedded human decision', plan, document, 'human_decision_recorded must equal false');
}

{
  const document = clone(review);
  document.conversion_rate = 0.5;
  expectReviewFailure('public-style rate field', plan, document, 'prohibited review key document.conversion_rate');
}

const scheduledQueue = buildDemandReviewQueue([plan], [], { asOf: '2026-09-01T16:00:00Z', horizonDays: 7 });
assert.equal(scheduledQueue.task_count, 1);
assert.equal(scheduledQueue.tasks[0].task_type, 'experiment_evidence_review');
assert.equal(scheduledQueue.tasks[0].status, 'due_soon');
assert.equal(scheduledQueue.tasks[0].human_required, false);

const overdueQueue = buildDemandReviewQueue([plan], [], { asOf: '2026-09-07T16:00:00Z', horizonDays: 7 });
assert.equal(overdueQueue.tasks[0].status, 'overdue');

const decisionQueue = buildDemandReviewQueue([plan], [review], { asOf: '2026-09-07T16:00:00Z', horizonDays: 7 });
assert.equal(decisionQueue.tasks[0].task_type, 'human_experiment_decision');
assert.equal(decisionQueue.tasks[0].human_required, true);
assert.equal(decisionQueue.tasks[0].recommended_decision, 'stop');
assert.equal(decisionQueue.tasks[0].verified_metric_count, 0);
assert.equal(decisionQueue.tasks[0].unavailable_metric_count, 6);

const historicalQueue = buildDemandReviewQueue([plan], [review], { asOf: '2026-09-01T16:00:00Z', horizonDays: 7 });
assert.equal(historicalQueue.tasks[0].task_type, 'experiment_evidence_review', 'future review must not affect a historical queue');

assert.throws(() => buildDemandReviewQueue([plan, plan], [], { asOf: '2026-09-01T16:00:00Z' }), /duplicate demand plan/);

console.log('PASS: demand-plan route, label, privacy, attribution, authority, count-only measurement, digest, and review boundaries verified');
