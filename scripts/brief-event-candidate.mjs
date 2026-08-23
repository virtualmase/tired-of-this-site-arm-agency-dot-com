import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadContract, validateLedger } from './case-ledger.mjs';

const requiredLabels = [
  'Requested service',
  'Role',
  'Trigger',
  'Decision window',
  'ACV',
  'Category',
  'Primary buyer / buying group',
  'Priority buyer question',
  'Competitors / alternatives'
];

const triggerMap = new Map([
  ['Category or product launch', 'category_launch'],
  ['Enterprise expansion', 'enterprise_expansion'],
  ['Pipeline quality or deal-cycle friction', 'pipeline'],
  ['Competitive displacement', 'competitive'],
  ['Fundraise, transaction, or board event', 'transaction'],
  ['Public trust or information concern', 'trust'],
  ['Other material decision', 'other']
]);

const windowMap = new Map([
  ['Within 30 days', 'within_30_days'],
  ['31–90 days', '31_90_days'],
  ['91–180 days', '91_180_days'],
  ['More than 180 days', '181_plus_days']
]);

const acvMap = new Map([
  ['Under $25,000', 'under_25000'],
  ['$25,000–$74,999', '25000_74999'],
  ['$75,000–$149,999', '75000_149999'],
  ['$150,000–$499,999', '150000_499999'],
  ['$500,000+', '500000_plus'],
  ['Strategic / not applicable', 'strategic_or_na']
]);

const roleMap = new Map([
  ['CMO / VP Marketing', 'marketing_leader'],
  ['CRO / VP Sales', 'sales_leader'],
  ['VP Product Marketing', 'product_marketing_leader'],
  ['Founder / CEO / GM', 'executive'],
  ['CISO / VP Security', 'security_leader'],
  ['Revenue Operations', 'revenue_operations'],
  ['Other', 'other']
]);

function parseKnownNotes(notes) {
  if (typeof notes !== 'string' || !notes.trim()) throw new Error('lead.notes is required');
  const knownLabels = [...requiredLabels, 'Launch source'];
  const parsed = new Map();

  for (const line of notes.split(/\r?\n/)) {
    for (const label of knownLabels) {
      const prefix = `${label}: `;
      if (!line.startsWith(prefix)) continue;
      if (parsed.has(label)) throw new Error(`lead.notes contains duplicate ${label} field`);
      const value = line.slice(prefix.length).trim();
      if (!value) throw new Error(`lead.notes contains empty ${label} field`);
      parsed.set(label, value);
    }
  }

  for (const label of requiredLabels) {
    if (!parsed.has(label)) throw new Error(`lead.notes is missing ${label} field`);
  }
  return parsed;
}

function classify(map, value, label) {
  const classification = map.get(value);
  if (!classification) throw new Error(`lead.notes contains unsupported ${label} classification`);
  return classification;
}

function classifySource(value = 'direct') {
  const source = value.toLowerCase();
  if (source === 'direct') return 'direct';
  if (/(partner|referral)/.test(source)) return 'partner_referral';
  if (/(linkedin)/.test(source)) return 'linkedin';
  if (/(email|newsletter)/.test(source)) return 'email';
  if (/(paid|cpc|ppc)/.test(source)) return 'paid';
  if (/(organic|search|google|bing)/.test(source)) return 'organic';
  return 'other';
}

export function buildBriefEventCandidate(input, contract = loadContract()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('input must be an object');
  if (!input.lead || typeof input.lead !== 'object' || Array.isArray(input.lead)) throw new Error('input.lead must be an object');

  const casePattern = new RegExp(contract.case_id_pattern);
  const eventPattern = new RegExp(contract.event_id_pattern);
  if (!casePattern.test(input.case_id || '')) throw new Error('input.case_id is invalid');
  if (!eventPattern.test(input.event_id || '')) throw new Error('input.event_id is invalid');
  if (!/^[a-f0-9]{64}$/.test(input.source_record_digest || '')) throw new Error('input.source_record_digest must be an opaque HMAC-SHA-256 hex digest');
  if (input.lead.source !== 'website') throw new Error('input.lead.source is not the verified website intake source');
  if (input.lead.service_interest !== 'enterprise_visibility') throw new Error('input.lead.service_interest is not the verified compatibility value');

  const notes = parseKnownNotes(input.lead.notes);
  if (notes.get('Requested service') !== 'AI Buyer Intelligence Sprint / Category Presence Brief') {
    throw new Error('lead.notes does not identify the current Category Presence Brief');
  }

  const event = {
    schema_version: contract.contract_version,
    event_id: input.event_id,
    case_id: input.case_id,
    occurred_at: input.occurred_at,
    recorded_at: input.recorded_at,
    actor: { type: 'system', role: 'base44_read_adapter' },
    type: 'brief.received',
    from_stage: null,
    to_stage: 'brief_received',
    data: {
      source_record_digest: input.source_record_digest,
      source_channel: classifySource(notes.get('Launch source')),
      trigger_type: classify(triggerMap, notes.get('Trigger'), 'Trigger'),
      decision_window_band: classify(windowMap, notes.get('Decision window'), 'Decision window'),
      acv_band: classify(acvMap, notes.get('ACV'), 'ACV'),
      submitter_role_class: classify(roleMap, notes.get('Role'), 'Role'),
      context_fields_present: ['category', 'buyer_group', 'buyer_question', 'competitors']
    }
  };

  const validation = validateLedger([event], contract);
  if (!validation.valid) throw new Error(`candidate event failed contract validation: ${validation.errors.join('; ')}`);
  return event;
}

function usage() {
  console.error('Usage: node scripts/brief-event-candidate.mjs <candidate-input.json>');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    usage();
    process.exit(2);
  }
  try {
    const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    console.log(JSON.stringify(buildBriefEventCandidate(input), null, 2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
}
