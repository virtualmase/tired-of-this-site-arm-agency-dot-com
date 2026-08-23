import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadContract, readLedger, summarizeLedger, validateLedger } from './case-ledger.mjs';

function increment(target, key, amount = 1) {
  target.set(key, (target.get(key) || 0) + amount);
}

function distribution(values) {
  return Object.fromEntries([...values].sort(([left], [right]) => left.localeCompare(right)));
}

function timingStats(values) {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (!sorted.length) return { observed_cases: 0, median_hours: null, maximum_hours: null };
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return {
    observed_cases: sorted.length,
    median_hours: Math.round(median * 100) / 100,
    maximum_hours: Math.round(sorted.at(-1) * 100) / 100
  };
}

export function buildPortfolioMetrics(ledgers, contract = loadContract()) {
  if (!Array.isArray(ledgers) || ledgers.length === 0) throw new Error('at least one ledger is required');

  const seenCases = new Set();
  const summaries = [];
  const declineReasons = new Map();
  const triggerTypes = new Map();
  let asOf = null;

  for (const events of ledgers) {
    const validation = validateLedger(events, contract);
    if (!validation.valid) throw new Error(`invalid ledger ${validation.case_id || 'unknown'}:\n${validation.errors.join('\n')}`);
    if (seenCases.has(validation.case_id)) throw new Error(`duplicate case ledger: ${validation.case_id}`);
    seenCases.add(validation.case_id);
    summaries.push(summarizeLedger(events, contract));

    const latest = events.at(-1)?.occurred_at;
    if (!asOf || Date.parse(latest) > Date.parse(asOf)) asOf = latest;
    const brief = events.find((event) => event.type === 'brief.received');
    if (brief?.data.trigger_type) increment(triggerTypes, brief.data.trigger_type);
    const decision = events.find((event) => event.type === 'fit.decision_recorded');
    if (decision?.data.decision === 'decline') {
      for (const reason of decision.data.reason_codes) increment(declineReasons, reason);
    }
  }

  const funnelKeys = ['brief_received', 'fit_proceeded', 'scope_issued', 'sprint_booked', 'deliverables_sent', 'case_closed'];
  const funnelCounts = Object.fromEntries(funnelKeys.map((key) => [key, summaries.filter((summary) => summary.funnel[key]).length]));
  const timingKeys = ['brief_to_review', 'review_to_decision', 'acceptance_to_booking', 'booking_to_delivery'];
  const timings = Object.fromEntries(timingKeys.map((key) => [key, timingStats(summaries.map((summary) => summary.elapsed_hours[key]))]));

  return {
    schema_version: contract.contract_version,
    as_of: asOf,
    case_count: summaries.length,
    funnel_counts: funnelCounts,
    trigger_counts: distribution(triggerTypes),
    decline_reason_counts: distribution(declineReasons),
    elapsed_time: timings,
    approvals: {
      requested: summaries.reduce((total, summary) => total + summary.approvals.requested, 0),
      approved: summaries.reduce((total, summary) => total + summary.approvals.approved, 0),
      rejected: summaries.reduce((total, summary) => total + summary.approvals.rejected, 0),
      consumed: summaries.reduce((total, summary) => total + summary.approvals.consumed, 0)
    },
    payments_confirmed_usd: summaries.reduce((total, summary) => total + summary.payments_confirmed_usd, 0),
    evidence_registered: summaries.reduce((total, summary) => total + summary.evidence_registered, 0),
    actions: {
      registered: summaries.reduce((total, summary) => total + summary.actions.registered, 0),
      owner_accepted: summaries.reduce((total, summary) => total + summary.actions.owner_accepted, 0),
      outcomes_observed: summaries.reduce((total, summary) => total + summary.actions.outcomes_observed, 0),
      cases_with_outcomes: summaries.filter((summary) => summary.actions.outcomes_observed > 0).length
    }
  };
}

function usage() {
  console.error('Usage: node scripts/portfolio-metrics.mjs <ledger.jsonl> [ledger.jsonl ...]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const ledgerPaths = process.argv.slice(2);
  if (!ledgerPaths.length) {
    usage();
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(buildPortfolioMetrics(ledgerPaths.map(readLedger)), null, 2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
}
