import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadContract, readLedger, validateLedger } from './case-ledger.mjs';

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function nextCandidates(stage, contract) {
  return Object.entries(contract.events)
    .filter(([type, spec]) => !type.startsWith('approval.') && (spec.from.includes('*') || spec.from.includes(stage)))
    .map(([type, spec]) => ({
      event_type: type,
      human_required: contract.human_only_events.includes(type),
      approval_required: Boolean(spec.approval_action),
      approval_action: spec.approval_action || null
    }))
    .sort((left, right) => left.event_type.localeCompare(right.event_type));
}

export function buildApprovalQueue(ledgers, contract = loadContract(), asOf = new Date().toISOString()) {
  if (!Array.isArray(ledgers) || ledgers.length === 0) throw new Error('at least one ledger is required');
  if (!isIsoDate(asOf)) throw new Error('asOf must be an ISO UTC timestamp');

  const seenCases = new Set();
  const cases = [];
  const attentionItems = [];
  const statusCounts = {
    pending_human_decision: 0,
    approved_ready: 0,
    expired_unreviewed: 0,
    approved_expired: 0,
    rejected: 0,
    consumed: 0
  };

  for (const ledger of ledgers) {
    const events = ledger.filter((event) => Date.parse(event.recorded_at) <= Date.parse(asOf));
    if (!events.length) continue;
    const validation = validateLedger(events, contract);
    if (!validation.valid) throw new Error(`invalid ledger ${validation.case_id || 'unknown'}:\n${validation.errors.join('\n')}`);
    if (seenCases.has(validation.case_id)) throw new Error(`duplicate case ledger: ${validation.case_id}`);
    seenCases.add(validation.case_id);

    const approvals = new Map();
    for (const event of events) {
      if (event.type === 'approval.requested') {
        approvals.set(event.data.approval_id, { request: event, decision: null, consumed_by: null });
      } else if (event.type === 'approval.decided') {
        const approval = approvals.get(event.data.approval_id);
        if (approval) approval.decision = event;
      } else if (event.data?.approval_id && approvals.has(event.data.approval_id)) {
        approvals.get(event.data.approval_id).consumed_by = event;
      }
    }

    const caseItems = [];
    for (const [approvalId, approval] of approvals) {
      const expired = Date.parse(asOf) > Date.parse(approval.request.data.expires_at);
      let status;
      if (approval.consumed_by) status = 'consumed';
      else if (approval.decision?.data.decision === 'rejected') status = 'rejected';
      else if (approval.decision?.data.decision === 'approved' && expired) status = 'approved_expired';
      else if (approval.decision?.data.decision === 'approved') status = 'approved_ready';
      else if (expired) status = 'expired_unreviewed';
      else status = 'pending_human_decision';
      statusCounts[status] += 1;

      const item = {
        case_id: validation.case_id,
        approval_id: approvalId,
        status,
        action: approval.request.data.action,
        boundaries: approval.request.data.boundaries,
        artifact_digest: approval.request.data.artifact_digest,
        destination_class: approval.request.data.destination_class,
        requested_at: approval.request.occurred_at,
        expires_at: approval.request.data.expires_at,
        decision_at: approval.decision?.occurred_at || null,
        consumed_by_event: approval.consumed_by?.type || null
      };
      caseItems.push(item);
      if (!['consumed', 'rejected'].includes(status)) attentionItems.push(item);
    }

    cases.push({
      case_id: validation.case_id,
      current_stage: validation.current_stage,
      last_event_at: events.at(-1).occurred_at,
      attention_count: caseItems.filter((item) => !['consumed', 'rejected'].includes(item.status)).length,
      next_candidates: nextCandidates(validation.current_stage, contract)
    });
  }

  const urgency = new Map([
    ['expired_unreviewed', 0],
    ['approved_expired', 1],
    ['pending_human_decision', 2],
    ['approved_ready', 3]
  ]);
  attentionItems.sort((left, right) => urgency.get(left.status) - urgency.get(right.status) || Date.parse(left.expires_at) - Date.parse(right.expires_at));
  cases.sort((left, right) => right.attention_count - left.attention_count || left.case_id.localeCompare(right.case_id));

  return {
    schema_version: contract.contract_version,
    as_of: asOf,
    case_count: cases.length,
    attention_count: attentionItems.length,
    status_counts: statusCounts,
    attention_items: attentionItems,
    cases
  };
}

function usage() {
  console.error('Usage: node scripts/approval-queue.mjs [--as-of ISO_TIMESTAMP] <ledger.jsonl> [ledger.jsonl ...]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  let asOf = new Date().toISOString();
  const asOfIndex = args.indexOf('--as-of');
  if (asOfIndex !== -1) {
    asOf = args[asOfIndex + 1];
    args.splice(asOfIndex, 2);
  }
  if (!args.length) {
    usage();
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(buildApprovalQueue(args.map(readLedger), loadContract(), asOf), null, 2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
}
