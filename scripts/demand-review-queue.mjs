import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  loadDemandContract,
  summarizeDemandReview,
  validateDemandPlan,
  validateDemandReview
} from './demand-experiment.mjs';
import { loadContract as loadCaseContract } from './case-ledger.mjs';

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function statusFor(dueAt, asOf, horizonDays) {
  const due = Date.parse(dueAt);
  const now = Date.parse(asOf);
  if (due < now) return 'overdue';
  if (due <= now + horizonDays * 864e5) return 'due_soon';
  return 'scheduled';
}

export function buildDemandReviewQueue(plans, reviews = [], { asOf = new Date().toISOString(), horizonDays = 7 } = {}, contract = loadDemandContract(), caseContract = loadCaseContract()) {
  if (!Array.isArray(plans) || plans.length === 0) throw new Error('at least one demand plan is required');
  if (!Array.isArray(reviews)) throw new Error('reviews must be an array');
  if (!isIsoDate(asOf)) throw new Error('asOf must be an ISO UTC timestamp');
  if (!Number.isInteger(horizonDays) || horizonDays < 0 || horizonDays > 90) throw new Error('horizonDays must be an integer from 0 to 90');

  const planById = new Map();
  const planValidationById = new Map();
  for (const plan of plans) {
    const validation = validateDemandPlan(plan, contract, caseContract);
    if (!validation.valid) throw new Error(`invalid demand plan ${plan.experiment_id || 'unknown'}:\n${validation.errors.join('\n')}`);
    if (planById.has(plan.experiment_id)) throw new Error(`duplicate demand plan: ${plan.experiment_id}`);
    planById.set(plan.experiment_id, plan);
    planValidationById.set(plan.experiment_id, validation);
  }

  const visibleReviewById = new Map();
  for (const review of reviews) {
    const plan = planById.get(review.experiment_id);
    if (!plan) throw new Error(`demand review has no plan: ${review.experiment_id}`);
    const validation = validateDemandReview(plan, review, contract, caseContract);
    if (!validation.valid) throw new Error(`invalid demand review ${review.experiment_id}:\n${validation.errors.join('\n')}`);
    if (visibleReviewById.has(review.experiment_id)) throw new Error(`duplicate demand review: ${review.experiment_id}`);
    if (Date.parse(review.reviewed_at) <= Date.parse(asOf)) visibleReviewById.set(review.experiment_id, review);
  }

  const tasks = [];
  for (const [experimentId, plan] of planById) {
    const review = visibleReviewById.get(experimentId);
    const dueAt = review?.reviewed_at || plan.review_at;
    const task = {
      task_id: `demand_${experimentId}_${review ? 'human_decision' : 'evidence_review'}`,
      experiment_id: experimentId,
      task_type: review ? 'human_experiment_decision' : 'experiment_evidence_review',
      due_at: dueAt,
      status: statusFor(dueAt, asOf, horizonDays),
      owner_role: plan.owner_role,
      human_required: Boolean(review),
      plan_digest: planValidationById.get(experimentId).digest,
      artifact_digest: plan.artifact.artifact_digest,
      channel_type: plan.channel.type,
      target_route: plan.channel.target_route,
      recommended_decision: review ? summarizeDemandReview(plan, review).recommended_decision : null,
      verified_metric_count: review ? review.metric_observations.filter((metric) => metric.evidence_status === 'verified').length : null,
      unavailable_metric_count: review ? review.metric_observations.filter((metric) => metric.evidence_status === 'unavailable').length : null
    };
    tasks.push(task);
  }

  const priority = new Map([['overdue', 0], ['due_soon', 1], ['scheduled', 2]]);
  tasks.sort((left, right) => priority.get(left.status) - priority.get(right.status) || Date.parse(left.due_at) - Date.parse(right.due_at) || left.experiment_id.localeCompare(right.experiment_id));
  const counts = { overdue: 0, due_soon: 0, scheduled: 0 };
  tasks.forEach((task) => { counts[task.status] += 1; });
  return {
    schema_version: contract.contract_version,
    as_of: asOf,
    horizon_days: horizonDays,
    experiment_count: planById.size,
    task_count: tasks.length,
    status_counts: counts,
    tasks
  };
}

function usage() {
  console.error('Usage: node scripts/demand-review-queue.mjs [--as-of ISO_TIMESTAMP] [--horizon-days N] [--review review.json ...] <plan.json> [plan.json ...]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  let asOf = new Date().toISOString();
  let horizonDays = 7;
  const reviewPaths = [];
  const consumeOne = (name) => {
    const index = args.indexOf(name);
    if (index === -1) return null;
    const value = args[index + 1];
    args.splice(index, 2);
    return value;
  };
  const asOfOption = consumeOne('--as-of');
  const horizonOption = consumeOne('--horizon-days');
  if (asOfOption) asOf = asOfOption;
  if (horizonOption !== null) horizonDays = Number(horizonOption);
  while (args.includes('--review')) reviewPaths.push(consumeOne('--review'));
  if (!args.length || reviewPaths.some((value) => !value)) {
    usage();
    process.exit(2);
  }
  try {
    const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(JSON.stringify(buildDemandReviewQueue(args.map(readJson), reviewPaths.map(readJson), { asOf, horizonDays }), null, 2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
}
