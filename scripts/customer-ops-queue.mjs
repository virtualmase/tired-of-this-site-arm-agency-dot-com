import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadContract, readLedger, validateLedger } from './case-ledger.mjs';

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function taskStatus(dueAt, asOf, horizonDays) {
  const due = Date.parse(dueAt);
  const now = Date.parse(asOf);
  if (due < now) return 'overdue';
  if (due <= now + horizonDays * 24 * 60 * 60 * 1000) return 'due_soon';
  return 'scheduled';
}

function latestByType(events, type) {
  return events.filter((event) => event.type === type).at(-1);
}

export function buildCustomerOpsQueue(ledgers, contract = loadContract(), { asOf = new Date().toISOString(), horizonDays = 7 } = {}) {
  if (!Array.isArray(ledgers) || ledgers.length === 0) throw new Error('at least one ledger is required');
  if (!isIsoDate(asOf)) throw new Error('asOf must be an ISO UTC timestamp');
  if (!Number.isInteger(horizonDays) || horizonDays < 0 || horizonDays > 90) throw new Error('horizonDays must be an integer from 0 to 90');

  const tasks = [];
  const cases = [];
  const seenCases = new Set();
  const addTask = (task) => tasks.push({ ...task, status: taskStatus(task.due_at, asOf, horizonDays) });

  for (const ledger of ledgers) {
    const events = ledger.filter((event) => Date.parse(event.recorded_at) <= Date.parse(asOf));
    if (!events.length) continue;
    const validation = validateLedger(events, contract);
    if (!validation.valid) throw new Error(`invalid ledger ${validation.case_id || 'unknown'}:\n${validation.errors.join('\n')}`);
    if (seenCases.has(validation.case_id)) throw new Error(`duplicate case ledger: ${validation.case_id}`);
    seenCases.add(validation.case_id);
    const beforeCount = tasks.length;

    const delivery = latestByType(events, 'delivery.started');
    const sent = latestByType(events, 'deliverables.sent');
    if (delivery && !sent) {
      addTask({
        task_id: `ops_${validation.case_id}_delivery`,
        case_id: validation.case_id,
        task_type: 'delivery_due',
        subject_id: 'sprint_delivery',
        due_at: delivery.data.delivery_due_at,
        owner_role: 'delivery_coordinator',
        human_required: false,
        source_event_type: delivery.type
      });
    }

    const evidenceEvents = events.filter((event) => event.type === 'evidence.registered');
    for (const registered of evidenceEvents) {
      const reviews = events.filter((event) => event.type === 'evidence.review_recorded' && event.data.evidence_id === registered.data.evidence_id);
      const review = reviews.at(-1);
      if (review?.data.decision === 'withdrawn') continue;
      const stale = review?.data.decision === 'stale';
      addTask({
        task_id: `ops_${validation.case_id}_evidence_${registered.data.evidence_id}`,
        case_id: validation.case_id,
        task_type: stale ? 'evidence_remediation' : 'evidence_freshness_review',
        subject_id: registered.data.evidence_id,
        due_at: stale ? review.data.reviewed_at : (review?.data.next_review_at || registered.data.freshness_review_at),
        owner_role: 'evidence_steward',
        human_required: true,
        source_event_type: review?.type || registered.type
      });
    }

    const actionEvents = events.filter((event) => event.type === 'action.registered');
    for (const registered of actionEvents) {
      const actionId = registered.data.action_id;
      const decision = events.filter((event) => event.type === 'action.approved' && event.data.action_id === actionId).at(-1);
      const outcome = events.filter((event) => event.type === 'outcome.observed' && event.data.action_id === actionId).at(-1);
      if (decision?.data.decision === 'rejected' || outcome) continue;
      addTask({
        task_id: `ops_${validation.case_id}_action_${actionId}`,
        case_id: validation.case_id,
        task_type: decision?.data.decision === 'accepted' ? 'action_outcome_review' : 'action_owner_decision',
        subject_id: actionId,
        due_at: registered.data.review_at,
        owner_role: registered.data.owner_role,
        human_required: true,
        source_event_type: decision?.type || registered.type
      });
    }

    const closed = latestByType(events, 'case.closed');
    if (closed) {
      const learning = latestByType(events, 'learning.review_completed');
      addTask({
        task_id: `ops_${validation.case_id}_learning`,
        case_id: validation.case_id,
        task_type: 'learning_review',
        subject_id: 'case_learning',
        due_at: learning?.data.next_review_at || closed.data.learning_review_due_at,
        owner_role: 'owner',
        human_required: true,
        source_event_type: learning?.type || closed.type
      });
    }

    cases.push({
      case_id: validation.case_id,
      current_stage: validation.current_stage,
      last_event_at: events.at(-1).occurred_at,
      open_task_count: tasks.length - beforeCount
    });
  }

  const priority = new Map([['overdue', 0], ['due_soon', 1], ['scheduled', 2]]);
  tasks.sort((left, right) => priority.get(left.status) - priority.get(right.status) || Date.parse(left.due_at) - Date.parse(right.due_at) || left.task_id.localeCompare(right.task_id));
  cases.sort((left, right) => right.open_task_count - left.open_task_count || left.case_id.localeCompare(right.case_id));
  const counts = { overdue: 0, due_soon: 0, scheduled: 0 };
  tasks.forEach((task) => { counts[task.status] += 1; });

  return {
    schema_version: contract.contract_version,
    as_of: asOf,
    horizon_days: horizonDays,
    case_count: cases.length,
    open_task_count: tasks.length,
    status_counts: counts,
    tasks,
    cases
  };
}

function usage() {
  console.error('Usage: node scripts/customer-ops-queue.mjs [--as-of ISO_TIMESTAMP] [--horizon-days N] <ledger.jsonl> [ledger.jsonl ...]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  let asOf = new Date().toISOString();
  let horizonDays = 7;
  const readOption = (name) => {
    const index = args.indexOf(name);
    if (index === -1) return null;
    const value = args[index + 1];
    args.splice(index, 2);
    return value;
  };
  const asOfOption = readOption('--as-of');
  const horizonOption = readOption('--horizon-days');
  if (asOfOption) asOf = asOfOption;
  if (horizonOption !== null) horizonDays = Number(horizonOption);
  if (!args.length) {
    usage();
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(buildCustomerOpsQueue(args.map(readLedger), loadContract(), { asOf, horizonDays }), null, 2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
}
