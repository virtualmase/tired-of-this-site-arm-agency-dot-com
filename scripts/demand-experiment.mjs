import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadContract as loadCaseContract } from './case-ledger.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const defaultDemandContractPath = path.join(root, 'operations', 'demand-experiment-contract.json');
const digestPattern = /^[a-f0-9]{64}$/;
const experimentIdPattern = /^dem_[a-z0-9][a-z0-9_-]{2,63}$/;
const evidenceIdPattern = /^evd_[a-z0-9][a-z0-9_-]{2,63}$/;

export function loadDemandContract(contractPath = defaultDemandContractPath) {
  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function demandPlanDigest(plan) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(plan))).digest('hex');
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function sameMembers(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  const left = [...actual].sort();
  const right = [...expected].sort();
  return left.every((value, index) => value === right[index]);
}

function findProhibitedKeys(value, prohibited, cursor = 'document', found = []) {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    value.forEach((item, index) => findProhibitedKeys(item, prohibited, `${cursor}[${index}]`, found));
    return found;
  }
  for (const [key, child] of Object.entries(value)) {
    if (prohibited.has(key.toLowerCase())) found.push(`${cursor}.${key}`);
    findProhibitedKeys(child, prohibited, `${cursor}.${key}`, found);
  }
  return found;
}

function activeRoutes(sitemapPath = path.join(root, 'sitemap.xml')) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  return new Set([...sitemap.matchAll(/<loc>https:\/\/www\.arm-agency\.com(\/[^<]*)<\/loc>/g)].map((match) => match[1]));
}

function validateRequiredMetrics(errors, metrics, contract, label) {
  if (!Array.isArray(metrics)) {
    errors.push(`${label} must be an array`);
    return;
  }
  const ids = metrics.map((metric) => metric?.metric_id);
  const expectedIds = Object.keys(contract.required_metrics);
  if (!sameMembers(ids, expectedIds)) errors.push(`${label} must contain exactly: ${expectedIds.join(', ')}`);
  const seen = new Set();
  metrics.forEach((metric, index) => {
    if (!metric || typeof metric !== 'object' || Array.isArray(metric)) {
      errors.push(`${label}[${index}] must be an object`);
      return;
    }
    if (seen.has(metric.metric_id)) errors.push(`${label}[${index}].metric_id is duplicated`);
    seen.add(metric.metric_id);
    const expected = contract.required_metrics[metric.metric_id];
    if (!expected) return;
    if (metric.source !== expected.source) errors.push(`${label}[${index}].source must equal ${expected.source}`);
    if (metric.attribution_scope !== expected.attribution_scope) errors.push(`${label}[${index}].attribution_scope must equal ${expected.attribution_scope}`);
  });
}

function prohibitedSet(caseContract, review = false) {
  const extra = review
    ? ['conversion_rate', 'win_rate', 'revenue_claim', 'public_result']
    : ['result', 'results', 'conversion_rate', 'win_rate', 'revenue_target'];
  return new Set([...caseContract.prohibited_data_keys, ...extra]);
}

export function validateDemandPlan(plan, contract = loadDemandContract(), caseContract = loadCaseContract()) {
  const errors = [];
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return { valid: false, errors: ['plan must be a JSON object'], digest: null };
  if (plan.plan_version !== contract.plan_version) errors.push(`plan_version must be ${contract.plan_version}`);
  if (!experimentIdPattern.test(plan.experiment_id || '')) errors.push('experiment_id is invalid');
  if (plan.classification !== contract.classification) errors.push(`classification must be ${contract.classification}`);
  if (plan.status !== contract.plan_status) errors.push(`status must be ${contract.plan_status}`);
  if (!nonEmptyString(plan.owner_role)) errors.push('owner_role is required');
  if (!nonEmptyString(plan.hypothesis)) errors.push('hypothesis is required');
  for (const key of findProhibitedKeys(plan, prohibitedSet(caseContract))) errors.push(`prohibited plan key ${key}`);

  for (const field of ['created_at', 'starts_at', 'review_at']) {
    if (!isIsoDate(plan[field])) errors.push(`${field} must be an ISO UTC timestamp`);
  }
  if (isIsoDate(plan.created_at) && isIsoDate(plan.starts_at) && Date.parse(plan.starts_at) < Date.parse(plan.created_at)) errors.push('starts_at precedes created_at');
  if (isIsoDate(plan.starts_at) && isIsoDate(plan.review_at)) {
    const days = (Date.parse(plan.review_at) - Date.parse(plan.starts_at)) / 864e5;
    if (days < contract.review_window_days.minimum || days > contract.review_window_days.maximum) {
      errors.push(`review_at must be ${contract.review_window_days.minimum}–${contract.review_window_days.maximum} days after starts_at`);
    }
  }

  const audience = plan.audience;
  if (!audience || typeof audience !== 'object' || Array.isArray(audience)) {
    errors.push('audience must be an object');
  } else {
    if (!nonEmptyString(audience.account_type)) errors.push('audience.account_type is required');
    if (!Array.isArray(audience.trigger_types) || audience.trigger_types.length === 0) errors.push('audience.trigger_types must be a non-empty array');
    else {
      if (new Set(audience.trigger_types).size !== audience.trigger_types.length) errors.push('audience.trigger_types contains duplicates');
      for (const trigger of audience.trigger_types) if (!contract.trigger_types.includes(trigger)) errors.push(`audience.trigger_types contains unsupported value ${trigger}`);
    }
    if (!Number.isInteger(audience.account_batch_limit) || audience.account_batch_limit < 0 || audience.account_batch_limit > contract.maximum_account_batch) {
      errors.push(`audience.account_batch_limit must be 0–${contract.maximum_account_batch}`);
    }
    if (!Array.isArray(audience.exclusion_rules) || audience.exclusion_rules.length === 0 || audience.exclusion_rules.some((rule) => !nonEmptyString(rule))) {
      errors.push('audience.exclusion_rules must be a non-empty string array');
    }
  }

  const channel = plan.channel;
  if (!channel || typeof channel !== 'object' || Array.isArray(channel)) {
    errors.push('channel must be an object');
  } else {
    if (!contract.channels.includes(channel.type)) errors.push('channel.type is invalid');
    if (channel.type === 'owner_outreach' && audience?.account_batch_limit < 1) errors.push('owner_outreach requires a positive account_batch_limit');
    if (!activeRoutes().has(channel.target_route)) errors.push('channel.target_route is not an active sitemap route');
    const labelPattern = new RegExp(contract.campaign_label_pattern);
    for (const field of ['source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      const value = channel[field];
      if (!nonEmptyString(value) || value.length > contract.campaign_label_maximum_length || !labelPattern.test(value)) {
        errors.push(`channel.${field} must be a lowercase non-personal campaign label`);
      }
    }
    if (!Number.isFinite(channel.proposed_spend_usd) || channel.proposed_spend_usd < 0) errors.push('channel.proposed_spend_usd must be a non-negative number');
  }

  if (!contract.artifact_kinds.includes(plan.artifact?.kind)) errors.push('artifact.kind is invalid');
  if (!digestPattern.test(plan.artifact?.artifact_digest || '')) errors.push('artifact.artifact_digest must be a SHA-256 hex digest');

  const evidence = plan.hypothesis_evidence;
  if (!Array.isArray(evidence) || evidence.length === 0) errors.push('hypothesis_evidence must be a non-empty array');
  const evidenceIds = new Set();
  (evidence || []).forEach((item, index) => {
    if (!evidenceIdPattern.test(item?.evidence_id || '')) errors.push(`hypothesis_evidence[${index}].evidence_id is invalid`);
    if (evidenceIds.has(item?.evidence_id)) errors.push(`hypothesis_evidence[${index}].evidence_id is duplicated`);
    evidenceIds.add(item?.evidence_id);
    if (!digestPattern.test(item?.source_ref_digest || '')) errors.push(`hypothesis_evidence[${index}].source_ref_digest must be a SHA-256 hex digest`);
    if (!isIsoDate(item?.observed_or_published_at) || !isIsoDate(item?.accessed_at)) errors.push(`hypothesis_evidence[${index}] dates must be ISO UTC timestamps`);
    if (isIsoDate(item?.observed_or_published_at) && isIsoDate(item?.accessed_at) && Date.parse(item.accessed_at) < Date.parse(item.observed_or_published_at)) errors.push(`hypothesis_evidence[${index}].accessed_at precedes observed_or_published_at`);
    if (!nonEmptyString(item?.permitted_use)) errors.push(`hypothesis_evidence[${index}].permitted_use is required`);
    if (!nonEmptyString(item?.limitations)) errors.push(`hypothesis_evidence[${index}].limitations is required`);
  });

  const measurement = plan.measurement;
  if (!measurement || typeof measurement !== 'object' || Array.isArray(measurement)) {
    errors.push('measurement must be an object');
  } else {
    if (measurement.baseline_status !== 'not_established') errors.push('measurement.baseline_status must be not_established for a draft');
    if (!Number.isInteger(measurement.minimum_observation_count) || measurement.minimum_observation_count < 1) errors.push('measurement.minimum_observation_count must be a positive integer');
    validateRequiredMetrics(errors, measurement.metrics, contract, 'measurement.metrics');
    for (const [index, metric] of (measurement.metrics || []).entries()) if (!nonEmptyString(metric.definition)) errors.push(`measurement.metrics[${index}].definition is required`);
    if (!sameMembers(measurement.decision_options, contract.decision_options)) errors.push(`measurement.decision_options must contain exactly: ${contract.decision_options.join(', ')}`);
    if (!Array.isArray(measurement.stop_conditions) || measurement.stop_conditions.length === 0 || measurement.stop_conditions.some((condition) => !nonEmptyString(condition))) errors.push('measurement.stop_conditions must be a non-empty string array');
  }

  for (const [field, expected] of Object.entries(contract.required_plan_authority)) {
    if (plan.authority?.[field] !== expected) errors.push(`authority.${field} must equal ${expected}`);
  }
  for (const [field, expected] of Object.entries(contract.required_plan_privacy)) {
    if (plan.privacy?.[field] !== expected) errors.push(`privacy.${field} must equal ${expected}`);
  }

  return { valid: errors.length === 0, errors, digest: demandPlanDigest(plan), experiment_id: plan.experiment_id || null };
}

export function validateDemandReview(plan, review, contract = loadDemandContract(), caseContract = loadCaseContract()) {
  const planValidation = validateDemandPlan(plan, contract, caseContract);
  const errors = planValidation.errors.map((error) => `plan: ${error}`);
  if (!review || typeof review !== 'object' || Array.isArray(review)) return { valid: false, errors: [...errors, 'review must be a JSON object'], experiment_id: null };
  for (const key of findProhibitedKeys(review, prohibitedSet(caseContract, true))) errors.push(`prohibited review key ${key}`);
  if (review.review_version !== contract.review_version) errors.push(`review_version must be ${contract.review_version}`);
  if (review.experiment_id !== plan.experiment_id) errors.push('review experiment_id differs from plan');
  if (review.experiment_digest !== planValidation.digest) errors.push('review experiment_digest differs from the plan digest');
  if (review.classification !== contract.classification) errors.push(`review classification must be ${contract.classification}`);
  for (const field of ['observed_from', 'observed_through', 'reviewed_at']) if (!isIsoDate(review[field])) errors.push(`${field} must be an ISO UTC timestamp`);
  if (isIsoDate(review.observed_from) && isIsoDate(plan.starts_at) && Date.parse(review.observed_from) < Date.parse(plan.starts_at)) errors.push('review observed_from precedes plan starts_at');
  if (isIsoDate(review.observed_through) && isIsoDate(review.observed_from) && Date.parse(review.observed_through) < Date.parse(review.observed_from)) errors.push('review observation window is reversed');
  if (isIsoDate(review.reviewed_at) && isIsoDate(review.observed_through) && Date.parse(review.reviewed_at) < Date.parse(review.observed_through)) errors.push('reviewed_at precedes observed_through');

  validateRequiredMetrics(errors, review.metric_observations, contract, 'metric_observations');
  let verifiedCount = 0;
  for (const [index, metric] of (review.metric_observations || []).entries()) {
    if (!contract.evidence_statuses.includes(metric.evidence_status)) errors.push(`metric_observations[${index}].evidence_status is invalid`);
    if (metric.evidence_status === 'verified') {
      verifiedCount += 1;
      if (!Number.isInteger(metric.value) || metric.value < 0) errors.push(`metric_observations[${index}].value must be a non-negative integer when verified`);
      if (!digestPattern.test(metric.source_ref_digest || '')) errors.push(`metric_observations[${index}].source_ref_digest must be a SHA-256 hex digest when verified`);
    }
    if (metric.evidence_status === 'unavailable') {
      if (metric.value !== null) errors.push(`metric_observations[${index}].value must be null when unavailable`);
      if (metric.source_ref_digest !== null) errors.push(`metric_observations[${index}].source_ref_digest must be null when unavailable`);
    }
  }
  if (!contract.hypothesis_assessments.includes(review.hypothesis_assessment)) errors.push('hypothesis_assessment is invalid');
  if (verifiedCount === 0 && review.hypothesis_assessment !== 'inconclusive') errors.push('hypothesis_assessment must be inconclusive when every metric is unavailable');
  if (!contract.decision_options.includes(review.recommended_decision)) errors.push('recommended_decision is invalid');
  if (!Array.isArray(review.decision_reasons) || review.decision_reasons.length === 0 || review.decision_reasons.some((reason) => !nonEmptyString(reason))) errors.push('decision_reasons must be a non-empty string array');
  if (!Array.isArray(review.limitations) || review.limitations.length === 0 || review.limitations.some((limitation) => !nonEmptyString(limitation))) errors.push('limitations must be a non-empty string array');
  for (const [field, expected] of Object.entries(contract.required_review_authority)) {
    if (review.authority?.[field] !== expected) errors.push(`review authority.${field} must equal ${expected}`);
  }
  return { valid: errors.length === 0, errors, experiment_id: review.experiment_id || null, experiment_digest: planValidation.digest };
}

export function summarizeDemandPlan(plan) {
  const validation = validateDemandPlan(plan);
  if (!validation.valid) throw new Error(`cannot summarize invalid demand plan:\n${validation.errors.join('\n')}`);
  return {
    plan_version: plan.plan_version,
    experiment_id: plan.experiment_id,
    status: plan.status,
    plan_digest: validation.digest,
    owner_role: plan.owner_role,
    channel_type: plan.channel.type,
    target_route: plan.channel.target_route,
    account_batch_limit: plan.audience.account_batch_limit,
    proposed_spend_usd: plan.channel.proposed_spend_usd,
    starts_at: plan.starts_at,
    review_at: plan.review_at,
    metric_count: plan.measurement.metrics.length,
    authority: plan.authority,
    privacy: plan.privacy
  };
}

export function summarizeDemandReview(plan, review) {
  const validation = validateDemandReview(plan, review);
  if (!validation.valid) throw new Error(`cannot summarize invalid demand review:\n${validation.errors.join('\n')}`);
  return {
    review_version: review.review_version,
    experiment_id: review.experiment_id,
    experiment_digest: review.experiment_digest,
    observed_from: review.observed_from,
    observed_through: review.observed_through,
    verified_metric_count: review.metric_observations.filter((metric) => metric.evidence_status === 'verified').length,
    unavailable_metric_count: review.metric_observations.filter((metric) => metric.evidence_status === 'unavailable').length,
    metric_counts: Object.fromEntries(review.metric_observations.map((metric) => [metric.metric_id, metric.value])),
    hypothesis_assessment: review.hypothesis_assessment,
    recommended_decision: review.recommended_decision,
    authority: review.authority
  };
}

function usage() {
  console.error('Usage: node scripts/demand-experiment.mjs <validate-plan|summarize-plan|digest-plan> <plan.json>');
  console.error('   or: node scripts/demand-experiment.mjs <validate-review|summarize-review> <plan.json> <review.json>');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [, , command, planPath, reviewPath] = process.argv;
  const planCommands = ['validate-plan', 'summarize-plan', 'digest-plan'];
  const reviewCommands = ['validate-review', 'summarize-review'];
  if ((!planCommands.includes(command) && !reviewCommands.includes(command)) || !planPath || (reviewCommands.includes(command) && !reviewPath)) {
    usage();
    process.exit(2);
  }
  try {
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    if (planCommands.includes(command)) {
      const validation = validateDemandPlan(plan);
      if (!validation.valid) {
        console.error(JSON.stringify(validation, null, 2));
        process.exit(1);
      }
      if (command === 'digest-plan') console.log(validation.digest);
      else console.log(JSON.stringify(command === 'summarize-plan' ? summarizeDemandPlan(plan) : validation, null, 2));
    } else {
      const review = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
      const validation = validateDemandReview(plan, review);
      if (!validation.valid) {
        console.error(JSON.stringify(validation, null, 2));
        process.exit(1);
      }
      console.log(JSON.stringify(command === 'summarize-review' ? summarizeDemandReview(plan, review) : validation, null, 2));
    }
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
}
