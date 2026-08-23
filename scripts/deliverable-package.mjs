import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadContract as loadCaseContract, validateLedger } from './case-ledger.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const defaultDeliverableContractPath = path.join(root, 'operations', 'deliverable-contract.json');

const idPatterns = {
  environment: /^env_[a-z0-9][a-z0-9_-]{2,63}$/,
  evidence: /^evd_[a-z0-9][a-z0-9_-]{2,63}$/,
  question: /^q_[a-z0-9][a-z0-9_-]{2,63}$/,
  gap: /^gap_[a-z0-9][a-z0-9_-]{2,63}$/,
  action: /^act_[a-z0-9][a-z0-9_-]{2,63}$/
};
const digestPattern = /^[a-f0-9]{64}$/;

export function loadDeliverableContract(contractPath = defaultDeliverableContractPath) {
  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function packageDigest(packageDocument) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(packageDocument))).digest('hex');
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function findProhibitedKeys(value, prohibited, cursor = 'package', found = []) {
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

function checkCount(errors, label, values, bounds) {
  if (!Array.isArray(values)) {
    errors.push(`${label} must be an array`);
    return false;
  }
  if (values.length < bounds.minimum || values.length > bounds.maximum) {
    errors.push(`${label} must contain ${bounds.minimum}–${bounds.maximum} items`);
  }
  return true;
}

function collectUniqueIds(errors, label, items, pattern) {
  const ids = new Set();
  if (!Array.isArray(items)) return ids;
  items.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label}[${index}] must be an object`);
      return;
    }
    if (!pattern.test(item.id || '')) errors.push(`${label}[${index}].id is invalid`);
    if (ids.has(item.id)) errors.push(`${label}[${index}].id is duplicated`);
    ids.add(item.id);
  });
  return ids;
}

function validateReferences(errors, label, refs, knownIds) {
  if (!Array.isArray(refs) || refs.length === 0) {
    errors.push(`${label} must be a non-empty array`);
    return;
  }
  const seen = new Set();
  refs.forEach((ref) => {
    if (!knownIds.has(ref)) errors.push(`${label} references unknown ID ${ref}`);
    if (seen.has(ref)) errors.push(`${label} contains duplicate ID ${ref}`);
    seen.add(ref);
  });
}

export function validateDeliverablePackage(packageDocument, deliverableContract = loadDeliverableContract(), caseContract = loadCaseContract()) {
  const errors = [];
  if (!packageDocument || typeof packageDocument !== 'object' || Array.isArray(packageDocument)) {
    return { valid: false, errors: ['package must be a JSON object'], digest: null };
  }

  if (packageDocument.package_version !== deliverableContract.package_version) errors.push(`package_version must be ${deliverableContract.package_version}`);
  if (!(new RegExp(caseContract.case_id_pattern)).test(packageDocument.case_id || '')) errors.push('case_id is invalid');
  if (packageDocument.classification !== deliverableContract.classification) errors.push(`classification must be ${deliverableContract.classification}`);
  if (packageDocument.publication_status !== deliverableContract.publication_status) errors.push(`publication_status must be ${deliverableContract.publication_status}`);
  for (const [field, expected] of Object.entries(deliverableContract.required_claim_boundary)) {
    if (packageDocument.claim_boundary?.[field] !== expected) errors.push(`claim_boundary.${field} must equal ${expected}`);
  }
  for (const key of findProhibitedKeys(packageDocument, new Set(caseContract.prohibited_data_keys))) {
    errors.push(`prohibited private-data key ${key}`);
  }

  const research = packageDocument.research_conditions;
  if (!research || typeof research !== 'object' || Array.isArray(research)) {
    errors.push('research_conditions must be an object');
  } else {
    for (const field of ['approved_at', 'observation_started_at', 'observation_ended_at']) {
      if (!isIsoDate(research[field])) errors.push(`research_conditions.${field} must be an ISO UTC timestamp`);
    }
    if (isIsoDate(research.observation_started_at) && isIsoDate(research.observation_ended_at) && Date.parse(research.observation_ended_at) < Date.parse(research.observation_started_at)) {
      errors.push('research_conditions observation window is reversed');
    }
    if (isIsoDate(research.approved_at) && isIsoDate(research.observation_started_at) && Date.parse(research.approved_at) > Date.parse(research.observation_started_at)) {
      errors.push('research_conditions approval occurs after observation begins');
    }
    if (!nonEmptyString(research.primary_market)) errors.push('research_conditions.primary_market is required');
    if (research.category_count !== 1) errors.push('research_conditions.category_count must equal 1');
    if (!Number.isInteger(research.competitor_count) || research.competitor_count < deliverableContract.competitor_count.minimum || research.competitor_count > deliverableContract.competitor_count.maximum) {
      errors.push(`research_conditions.competitor_count must be ${deliverableContract.competitor_count.minimum}–${deliverableContract.competitor_count.maximum}`);
    }
    if (!Number.isInteger(research.owned_surface_count) || research.owned_surface_count < deliverableContract.owned_surface_count.minimum || research.owned_surface_count > deliverableContract.owned_surface_count.maximum) {
      errors.push(`research_conditions.owned_surface_count must be ${deliverableContract.owned_surface_count.minimum}–${deliverableContract.owned_surface_count.maximum}`);
    }
    if (!nonEmptyString(research.sampling_notes)) errors.push('research_conditions.sampling_notes is required');
    if (!Array.isArray(research.limitations) || research.limitations.length === 0 || research.limitations.some((item) => !nonEmptyString(item))) {
      errors.push('research_conditions.limitations must be a non-empty string array');
    }
    if (checkCount(errors, 'research_conditions.environments', research.environments, deliverableContract.research_environment_count)) {
      collectUniqueIds(errors, 'research_conditions.environments', research.environments, idPatterns.environment);
      research.environments.forEach((environment, index) => {
        for (const field of ['system_label', 'location_class', 'language', 'account_context']) {
          if (!nonEmptyString(environment[field])) errors.push(`research_conditions.environments[${index}].${field} is required`);
        }
        if (!isIsoDate(environment.observed_at)) errors.push(`research_conditions.environments[${index}].observed_at must be an ISO UTC timestamp`);
        if (isIsoDate(environment.observed_at) && isIsoDate(research.observation_started_at) && isIsoDate(research.observation_ended_at) && (Date.parse(environment.observed_at) < Date.parse(research.observation_started_at) || Date.parse(environment.observed_at) > Date.parse(research.observation_ended_at))) {
          errors.push(`research_conditions.environments[${index}].observed_at is outside the observation window`);
        }
      });
    }
  }

  const evidence = packageDocument.evidence_register;
  if (!Array.isArray(evidence) || evidence.length === 0) errors.push('evidence_register must be a non-empty array');
  const evidenceIds = collectUniqueIds(errors, 'evidence_register', evidence, idPatterns.evidence);
  (evidence || []).forEach((item, index) => {
    if (!deliverableContract.evidence_source_classes.includes(item.source_class)) errors.push(`evidence_register[${index}].source_class is invalid`);
    if (!digestPattern.test(item.source_ref_digest || '')) errors.push(`evidence_register[${index}].source_ref_digest must be a SHA-256 hex digest`);
    if (!isIsoDate(item.observed_or_published_at)) errors.push(`evidence_register[${index}].observed_or_published_at must be an ISO UTC timestamp`);
    if (!isIsoDate(item.accessed_at)) errors.push(`evidence_register[${index}].accessed_at must be an ISO UTC timestamp`);
    if (isIsoDate(item.observed_or_published_at) && isIsoDate(item.accessed_at) && Date.parse(item.accessed_at) < Date.parse(item.observed_or_published_at)) {
      errors.push(`evidence_register[${index}].accessed_at precedes observed_or_published_at`);
    }
    if (!nonEmptyString(item.permitted_use)) errors.push(`evidence_register[${index}].permitted_use is required`);
    if (!deliverableContract.evidence_confidences.includes(item.confidence)) errors.push(`evidence_register[${index}].confidence is invalid`);
    if (!nonEmptyString(item.limitations)) errors.push(`evidence_register[${index}].limitations is required`);
  });

  const questions = packageDocument.buyer_conversation_map?.questions;
  checkCount(errors, 'buyer_conversation_map.questions', questions, deliverableContract.question_count);
  const questionIds = collectUniqueIds(errors, 'buyer_conversation_map.questions', questions, idPatterns.question);
  (questions || []).forEach((question, index) => {
    if (!deliverableContract.question_stages.includes(question.stage)) errors.push(`buyer_conversation_map.questions[${index}].stage is invalid`);
    if (!nonEmptyString(question.question)) errors.push(`buyer_conversation_map.questions[${index}].question is required`);
    if (![1, 2, 3].includes(question.priority)) errors.push(`buyer_conversation_map.questions[${index}].priority must be 1, 2, or 3`);
    if (!deliverableContract.question_bases.includes(question.basis)) errors.push(`buyer_conversation_map.questions[${index}].basis is invalid`);
    if (!nonEmptyString(question.owner_role)) errors.push(`buyer_conversation_map.questions[${index}].owner_role is required`);
    validateReferences(errors, `buyer_conversation_map.questions[${index}].evidence_ids`, question.evidence_ids, evidenceIds);
  });

  const gaps = packageDocument.shortlist_source_gap_map?.gaps;
  if (!Array.isArray(gaps) || gaps.length === 0) errors.push('shortlist_source_gap_map.gaps must be a non-empty array');
  collectUniqueIds(errors, 'shortlist_source_gap_map.gaps', gaps, idPatterns.gap);

  const actions = packageDocument.action_register_90_day?.actions;
  checkCount(errors, 'action_register_90_day.actions', actions, deliverableContract.action_count);
  const actionIds = collectUniqueIds(errors, 'action_register_90_day.actions', actions, idPatterns.action);
  (actions || []).forEach((action, index) => {
    if (![1, 2, 3].includes(action.priority)) errors.push(`action_register_90_day.actions[${index}].priority must be 1, 2, or 3`);
    for (const field of ['owner_role', 'trigger', 'dependency', 'acceptance_test', 'measure', 'stop_condition']) {
      if (!nonEmptyString(action[field])) errors.push(`action_register_90_day.actions[${index}].${field} is required`);
    }
    if (!isIsoDate(action.review_at)) errors.push(`action_register_90_day.actions[${index}].review_at must be an ISO UTC timestamp`);
    if (isIsoDate(action.review_at) && isIsoDate(research?.observation_ended_at)) {
      const reviewWindowMs = deliverableContract.action_review_window_days * 24 * 60 * 60 * 1000;
      const reviewOffset = Date.parse(action.review_at) - Date.parse(research.observation_ended_at);
      if (reviewOffset < 0 || reviewOffset > reviewWindowMs) errors.push(`action_register_90_day.actions[${index}].review_at must be within ${deliverableContract.action_review_window_days} days after observation ends`);
    }
    if (!deliverableContract.action_statuses.includes(action.status)) errors.push(`action_register_90_day.actions[${index}].status is invalid`);
    validateReferences(errors, `action_register_90_day.actions[${index}].evidence_ids`, action.evidence_ids, evidenceIds);
  });

  (gaps || []).forEach((gap, index) => {
    if (!deliverableContract.gap_types.includes(gap.gap_type)) errors.push(`shortlist_source_gap_map.gaps[${index}].gap_type is invalid`);
    for (const field of ['observed_condition', 'interpretation']) {
      if (!nonEmptyString(gap[field])) errors.push(`shortlist_source_gap_map.gaps[${index}].${field} is required`);
    }
    validateReferences(errors, `shortlist_source_gap_map.gaps[${index}].question_ids`, gap.question_ids, questionIds);
    validateReferences(errors, `shortlist_source_gap_map.gaps[${index}].evidence_ids`, gap.evidence_ids, evidenceIds);
    if (!actionIds.has(gap.minimum_action_id)) errors.push(`shortlist_source_gap_map.gaps[${index}].minimum_action_id references unknown action ${gap.minimum_action_id}`);
  });

  const checks = packageDocument.proof_conversion_review?.checks;
  if (!Array.isArray(checks)) {
    errors.push('proof_conversion_review.checks must be an array');
  } else {
    const dimensions = checks.map((check) => check.dimension);
    const expected = [...deliverableContract.proof_dimensions].sort();
    if (dimensions.length !== expected.length || [...dimensions].sort().some((value, index) => value !== expected[index])) {
      errors.push(`proof_conversion_review.checks must contain exactly: ${deliverableContract.proof_dimensions.join(', ')}`);
    }
    checks.forEach((check, index) => {
      if (!deliverableContract.proof_statuses.includes(check.status)) errors.push(`proof_conversion_review.checks[${index}].status is invalid`);
      if (!nonEmptyString(check.observed_condition)) errors.push(`proof_conversion_review.checks[${index}].observed_condition is required`);
      if (!nonEmptyString(check.buyer_validation_effect)) errors.push(`proof_conversion_review.checks[${index}].buyer_validation_effect is required`);
      validateReferences(errors, `proof_conversion_review.checks[${index}].evidence_ids`, check.evidence_ids, evidenceIds);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    digest: packageDigest(packageDocument),
    case_id: packageDocument.case_id || null
  };
}

export function summarizeDeliverablePackage(packageDocument, deliverableContract = loadDeliverableContract(), caseContract = loadCaseContract()) {
  const validation = validateDeliverablePackage(packageDocument, deliverableContract, caseContract);
  if (!validation.valid) throw new Error(`cannot summarize invalid package:\n${validation.errors.join('\n')}`);
  const counts = (values) => values.reduce((result, value) => ({ ...result, [value]: (result[value] || 0) + 1 }), {});
  return {
    package_version: packageDocument.package_version,
    case_id: packageDocument.case_id,
    classification: packageDocument.classification,
    publication_status: packageDocument.publication_status,
    artifact_digest: validation.digest,
    research_environment_count: packageDocument.research_conditions.environments.length,
    evidence_count: packageDocument.evidence_register.length,
    question_count: packageDocument.buyer_conversation_map.questions.length,
    question_stage_counts: counts(packageDocument.buyer_conversation_map.questions.map((question) => question.stage)),
    gap_count: packageDocument.shortlist_source_gap_map.gaps.length,
    gap_type_counts: counts(packageDocument.shortlist_source_gap_map.gaps.map((gap) => gap.gap_type)),
    proof_status_by_dimension: Object.fromEntries(packageDocument.proof_conversion_review.checks.map((check) => [check.dimension, check.status])),
    action_count: packageDocument.action_register_90_day.actions.length,
    action_priority_counts: counts(packageDocument.action_register_90_day.actions.map((action) => String(action.priority)))
  };
}

export function validatePackageAgainstLedger(packageDocument, events, deliverableContract = loadDeliverableContract(), caseContract = loadCaseContract()) {
  const packageValidation = validateDeliverablePackage(packageDocument, deliverableContract, caseContract);
  const ledgerValidation = validateLedger(events, caseContract);
  const errors = [...packageValidation.errors, ...ledgerValidation.errors.map((error) => `ledger: ${error}`)];
  if (packageDocument.case_id !== ledgerValidation.case_id) errors.push('package case_id differs from ledger case_id');

  const registeredEvidence = new Set(events.filter((event) => event.type === 'evidence.registered').map((event) => event.data.evidence_id));
  for (const evidence of packageDocument.evidence_register || []) {
    if (!registeredEvidence.has(evidence.id)) errors.push(`package evidence ${evidence.id} is not registered in the ledger`);
  }
  const registeredActions = new Map(events.filter((event) => event.type === 'action.registered').map((event) => [event.data.action_id, event.data]));
  for (const action of packageDocument.action_register_90_day?.actions || []) {
    const registered = registeredActions.get(action.id);
    if (!registered) {
      errors.push(`package action ${action.id} is not registered in the ledger`);
      continue;
    }
    for (const field of ['owner_role', 'trigger', 'dependency', 'acceptance_test', 'measure', 'stop_condition', 'review_at']) {
      if (registered[field] !== action[field]) errors.push(`package action ${action.id} differs from ledger field ${field}`);
    }
  }
  const qa = events.find((event) => event.type === 'delivery.qa_completed');
  if (!qa) errors.push('ledger has no delivery.qa_completed event');
  else if (qa.data.artifact_digest !== packageValidation.digest) errors.push('delivery.qa_completed digest differs from package digest');
  const sent = events.find((event) => event.type === 'deliverables.sent');
  if (sent && sent.data.artifact_digest !== packageValidation.digest) errors.push('deliverables.sent digest differs from package digest');

  return { valid: errors.length === 0, errors, digest: packageValidation.digest, case_id: packageDocument.case_id || null };
}

function usage() {
  console.error('Usage: node scripts/deliverable-package.mjs <validate|summarize|digest> <package.json>');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [, , command, packagePath] = process.argv;
  if (!['validate', 'summarize', 'digest'].includes(command) || !packagePath) {
    usage();
    process.exit(2);
  }
  try {
    const packageDocument = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const validation = validateDeliverablePackage(packageDocument);
    if (!validation.valid) {
      console.error(JSON.stringify(validation, null, 2));
      process.exit(1);
    }
    if (command === 'digest') console.log(validation.digest);
    else console.log(JSON.stringify(command === 'summarize' ? summarizeDeliverablePackage(packageDocument) : validation, null, 2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
}
