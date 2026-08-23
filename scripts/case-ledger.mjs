import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const defaultContractPath = path.join(root, 'operations', 'case-contract.json');

const digestPattern = /^[a-f0-9]{64}$/;
const evidenceIdPattern = /^evd_[a-z0-9][a-z0-9_-]{2,63}$/;
const actionIdPattern = /^act_[a-z0-9][a-z0-9_-]{2,63}$/;

export function loadContract(contractPath = defaultContractPath) {
  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

export function parseLedger(source) {
  const events = [];
  for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`line ${index + 1}: invalid JSON (${error.message})`);
    }
  }
  return events;
}

export function readLedger(file) {
  return parseLedger(fs.readFileSync(file, 'utf8'));
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function findProhibitedKeys(value, prohibited, cursor = 'data', found = []) {
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

function sameMembers(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  return [...actual].sort().every((item, index) => item === [...expected].sort()[index]);
}

function hoursBetween(start, end) {
  if (!start || !end) return null;
  return Math.round(((Date.parse(end) - Date.parse(start)) / 36e5) * 100) / 100;
}

export function validateLedger(events, contract = loadContract()) {
  const errors = [];
  const approvals = new Map();
  const consumedApprovals = new Set();
  const eventIds = new Set();
  const priorTypes = new Set();
  const actionIds = new Set();
  const prohibited = new Set(contract.prohibited_data_keys);
  const casePattern = new RegExp(contract.case_id_pattern);
  const eventPattern = new RegExp(contract.event_id_pattern);
  const approvalPattern = new RegExp(contract.approval_id_pattern);
  let caseId = null;
  let stage = null;
  let lastOccurredAt = null;
  let lastRecordedAt = null;

  if (!Array.isArray(events) || events.length === 0) {
    return { valid: false, errors: ['ledger must contain at least one event'], case_id: null, current_stage: null };
  }

  const add = (index, event, message) => errors.push(`event ${index + 1} (${event?.event_id || 'unknown'}): ${message}`);

  events.forEach((event, index) => {
    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      errors.push(`event ${index + 1}: must be a JSON object`);
      return;
    }

    const requiredTopLevel = ['schema_version', 'event_id', 'case_id', 'occurred_at', 'recorded_at', 'actor', 'type', 'from_stage', 'to_stage', 'data'];
    for (const field of requiredTopLevel) {
      if (!(field in event)) add(index, event, `missing top-level field ${field}`);
    }

    if (event.schema_version !== contract.contract_version) add(index, event, `schema_version must be ${contract.contract_version}`);
    if (!eventPattern.test(event.event_id || '')) add(index, event, 'event_id is not sanitized or valid');
    if (eventIds.has(event.event_id)) add(index, event, 'event_id is duplicated');
    eventIds.add(event.event_id);

    if (!casePattern.test(event.case_id || '')) add(index, event, 'case_id is not sanitized or valid');
    if (caseId === null) caseId = event.case_id;
    if (event.case_id !== caseId) add(index, event, `case_id differs from ${caseId}`);

    if (!isIsoDate(event.occurred_at)) add(index, event, 'occurred_at must be an ISO UTC timestamp');
    if (!isIsoDate(event.recorded_at)) add(index, event, 'recorded_at must be an ISO UTC timestamp');
    if (isIsoDate(event.occurred_at) && isIsoDate(event.recorded_at) && Date.parse(event.recorded_at) < Date.parse(event.occurred_at)) {
      add(index, event, 'recorded_at precedes occurred_at');
    }
    if (lastOccurredAt && isIsoDate(event.occurred_at) && Date.parse(event.occurred_at) < Date.parse(lastOccurredAt)) {
      add(index, event, 'occurred_at is earlier than the preceding append-only event');
    }
    if (lastRecordedAt && isIsoDate(event.recorded_at) && Date.parse(event.recorded_at) < Date.parse(lastRecordedAt)) {
      add(index, event, 'recorded_at is earlier than the preceding append-only event');
    }
    if (isIsoDate(event.occurred_at)) lastOccurredAt = event.occurred_at;
    if (isIsoDate(event.recorded_at)) lastRecordedAt = event.recorded_at;

    if (!event.actor || typeof event.actor !== 'object') {
      add(index, event, 'actor must be an object');
    } else {
      if (!contract.actor_types.includes(event.actor.type)) add(index, event, `actor.type must be one of ${contract.actor_types.join(', ')}`);
      if (typeof event.actor.role !== 'string' || !event.actor.role) add(index, event, 'actor.role is required');
    }
    if (contract.human_only_events.includes(event.type) && event.actor?.type !== 'human') {
      add(index, event, `${event.type} requires a human actor`);
    }

    if (!event.data || typeof event.data !== 'object' || Array.isArray(event.data)) add(index, event, 'data must be an object');
    for (const key of findProhibitedKeys(event.data, prohibited)) add(index, event, `prohibited private-data key ${key}`);

    const spec = contract.events[event.type];
    if (!spec) {
      add(index, event, `unknown event type ${event.type}`);
      return;
    }

    for (const field of spec.required_data || []) {
      if (!(field in (event.data || {}))) add(index, event, `missing data.${field}`);
    }
    for (const [field, expected] of Object.entries(spec.required_values || {})) {
      if (event.data?.[field] !== expected) add(index, event, `data.${field} must equal ${JSON.stringify(expected)}`);
    }
    for (const [field, value] of Object.entries(event.data || {})) {
      if (field.endsWith('_digest') && !digestPattern.test(value || '')) {
        add(index, event, `data.${field} must be a SHA-256 hex digest`);
      }
    }

    const fromAllowed = spec.from.includes('*') || spec.from.includes(stage);
    if (!fromAllowed) add(index, event, `event cannot occur from stage ${JSON.stringify(stage)}`);
    if (event.from_stage !== stage) add(index, event, `from_stage must equal current stage ${JSON.stringify(stage)}`);

    let expectedTo = spec.to === 'same' ? stage : spec.to;
    if (spec.to_by_data) expectedTo = spec.to_by_data.values[event.data?.[spec.to_by_data.field]];
    if (!expectedTo) add(index, event, 'event data does not resolve to a valid next stage');
    if (event.to_stage !== expectedTo) add(index, event, `to_stage must equal ${JSON.stringify(expectedTo)}`);

    for (const requiredType of spec.required_prior_events || []) {
      if (!priorTypes.has(requiredType)) add(index, event, `requires prior event ${requiredType}`);
    }

    if (event.type === 'approval.requested') {
      const approvalId = event.data?.approval_id;
      if (!approvalPattern.test(approvalId || '')) add(index, event, 'data.approval_id is invalid');
      if (approvals.has(approvalId)) add(index, event, `approval ${approvalId} is duplicated`);
      if (!Array.isArray(event.data?.boundaries) || event.data.boundaries.length === 0) add(index, event, 'data.boundaries must be a non-empty array');
      for (const boundary of event.data?.boundaries || []) {
        if (!contract.authority_boundaries.includes(boundary)) add(index, event, `unknown authority boundary ${boundary}`);
      }
      if (!digestPattern.test(event.data?.artifact_digest || '')) add(index, event, 'data.artifact_digest must be a SHA-256 hex digest');
      if (!isIsoDate(event.data?.expires_at)) add(index, event, 'data.expires_at must be an ISO UTC timestamp');
      approvals.set(approvalId, { request: event, decision: null });
    }

    if (event.type === 'approval.decided') {
      const approval = approvals.get(event.data?.approval_id);
      if (!approval) add(index, event, `approval ${event.data?.approval_id} was not requested earlier`);
      if (!['approved', 'rejected'].includes(event.data?.decision)) add(index, event, 'data.decision must be approved or rejected');
      if (event.actor?.type !== 'human') add(index, event, 'approval decisions require a human actor');
      if (approval?.decision) add(index, event, `approval ${event.data?.approval_id} already has a decision`);
      if (approval) approval.decision = event;
    }

    if (spec.approval_action) {
      const approvalId = event.data?.approval_id;
      const approval = approvals.get(approvalId);
      if (!approval) {
        add(index, event, `approval ${approvalId} was not requested`);
      } else {
        if (approval.decision?.data?.decision !== 'approved') add(index, event, `approval ${approvalId} is not approved`);
        if (approval.request.data.action !== spec.approval_action) add(index, event, `approval action must be ${spec.approval_action}`);
        for (const boundary of spec.approval_boundaries) {
          if (!approval.request.data.boundaries.includes(boundary)) add(index, event, `approval is missing boundary ${boundary}`);
        }
        if (approval.request.data.artifact_digest !== event.data?.artifact_digest) add(index, event, 'action artifact_digest differs from approved artifact');
        if (isIsoDate(approval.request.data.expires_at) && isIsoDate(event.occurred_at) && Date.parse(event.occurred_at) > Date.parse(approval.request.data.expires_at)) {
          add(index, event, `approval ${approvalId} expired before action`);
        }
        if (consumedApprovals.has(approvalId)) add(index, event, `approval ${approvalId} was already consumed`);
        consumedApprovals.add(approvalId);
      }
    }

    if (event.type === 'delivery.qa_completed' && !sameMembers(event.data?.deliverables, contract.required_deliverables)) {
      add(index, event, `deliverables must contain exactly: ${contract.required_deliverables.join(', ')}`);
    }
    if (event.type === 'evidence.registered') {
      if (!evidenceIdPattern.test(event.data?.evidence_id || '')) add(index, event, 'data.evidence_id is invalid');
      if (!['public', 'approved_private'].includes(event.data?.source_class)) add(index, event, 'data.source_class must be public or approved_private');
      if (!['direct', 'corroborated', 'inferred', 'unverified'].includes(event.data?.confidence)) add(index, event, 'data.confidence is invalid');
      if (!isIsoDate(event.data?.observed_at) || !isIsoDate(event.data?.freshness_review_at)) add(index, event, 'evidence dates must be ISO UTC timestamps');
    }
    if (event.type === 'action.registered') {
      if (!actionIdPattern.test(event.data?.action_id || '')) add(index, event, 'data.action_id is invalid');
      if (actionIds.has(event.data?.action_id)) add(index, event, `action ${event.data?.action_id} is duplicated`);
      actionIds.add(event.data?.action_id);
    }
    if (['action.approved', 'outcome.observed'].includes(event.type) && !actionIds.has(event.data?.action_id)) {
      add(index, event, `action ${event.data?.action_id} was not registered earlier`);
    }
    if (event.type === 'action.approved' && !['accepted', 'rejected'].includes(event.data?.decision)) {
      add(index, event, 'data.decision must be accepted or rejected');
    }

    if (expectedTo) stage = expectedTo;
    priorTypes.add(event.type);
  });

  return {
    valid: errors.length === 0,
    errors,
    case_id: caseId,
    current_stage: stage,
    approval_count: approvals.size,
    consumed_approval_count: consumedApprovals.size
  };
}

export function summarizeLedger(events, contract = loadContract()) {
  const validation = validateLedger(events, contract);
  if (!validation.valid) throw new Error(`cannot summarize invalid ledger:\n${validation.errors.join('\n')}`);
  const first = (type) => events.find((event) => event.type === type);
  const count = (type) => events.filter((event) => event.type === type).length;
  const decisions = events.filter((event) => event.type === 'approval.decided');
  const registeredActions = events.filter((event) => event.type === 'action.registered');
  const approvedActions = events.filter((event) => event.type === 'action.approved' && event.data.decision === 'accepted');
  const booking = first('booking_payment.confirmed');
  const final = first('final_payment.confirmed');

  return {
    schema_version: contract.contract_version,
    case_id: validation.case_id,
    current_stage: validation.current_stage,
    event_count: events.length,
    funnel: {
      brief_received: Boolean(first('brief.received')),
      fit_proceeded: events.some((event) => event.type === 'fit.decision_recorded' && event.data.decision === 'proceed'),
      scope_issued: Boolean(first('scope.issued')),
      sprint_booked: Boolean(booking),
      deliverables_sent: Boolean(first('deliverables.sent')),
      case_closed: Boolean(first('case.closed'))
    },
    elapsed_hours: {
      brief_to_review: hoursBetween(first('brief.received')?.occurred_at, first('fit.review_started')?.occurred_at),
      review_to_decision: hoursBetween(first('fit.review_started')?.occurred_at, first('fit.decision_recorded')?.occurred_at),
      acceptance_to_booking: hoursBetween(first('scope.accepted')?.occurred_at, booking?.occurred_at),
      booking_to_delivery: hoursBetween(booking?.occurred_at, first('deliverables.sent')?.occurred_at)
    },
    approvals: {
      requested: count('approval.requested'),
      approved: decisions.filter((event) => event.data.decision === 'approved').length,
      rejected: decisions.filter((event) => event.data.decision === 'rejected').length,
      consumed: validation.consumed_approval_count
    },
    payments_confirmed_usd: (booking?.data.amount_usd || 0) + (final?.data.amount_usd || 0),
    evidence_registered: count('evidence.registered'),
    actions: {
      registered: registeredActions.length,
      owner_accepted: approvedActions.length,
      outcomes_observed: count('outcome.observed')
    }
  };
}

function usage() {
  console.error('Usage: node scripts/case-ledger.mjs <validate|summarize> <ledger.jsonl> [contract.json]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [, , command, ledgerPath, contractPath] = process.argv;
  if (!['validate', 'summarize'].includes(command) || !ledgerPath) {
    usage();
    process.exit(2);
  }
  try {
    const contract = loadContract(contractPath);
    const events = readLedger(ledgerPath);
    const validation = validateLedger(events, contract);
    if (!validation.valid) {
      console.error(JSON.stringify(validation, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify(command === 'summarize' ? summarizeLedger(events, contract) : validation, null, 2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
}
