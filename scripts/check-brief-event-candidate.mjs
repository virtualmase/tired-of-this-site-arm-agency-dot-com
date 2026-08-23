import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBriefEventCandidate } from './brief-event-candidate.mjs';
import { loadContract, validateLedger } from './case-ledger.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'operations/examples/base44-brief-candidate-input.json'), 'utf8'));
const briefHtml = fs.readFileSync(path.join(root, 'brief/index.html'), 'utf8');
const contract = loadContract();
const clone = (value) => structuredClone(value);

function expectFailure(label, input, messageFragment) {
  assert.throws(
    () => buildBriefEventCandidate(input, contract),
    (error) => error.message.includes(messageFragment),
    `${label} did not fail with ${JSON.stringify(messageFragment)}`
  );
}

const candidate = buildBriefEventCandidate(fixture, contract);
assert.deepEqual(candidate, buildBriefEventCandidate(fixture, contract), 'normalization must be deterministic');
assert.equal(validateLedger([candidate], contract).valid, true);
assert.equal(candidate.data.source_channel, 'partner_referral');
assert.equal(candidate.data.trigger_type, 'category_launch');
assert.equal(candidate.data.decision_window_band, '91_180_days');
assert.equal(candidate.data.acv_band, '75000_149999');
assert.equal(candidate.data.submitter_role_class, 'product_marketing_leader');
assert.deepEqual(candidate.data.context_fields_present, ['category', 'buyer_group', 'buyer_question', 'competitors']);

const serialized = JSON.stringify(candidate);
for (const privateValue of [fixture.lead.name, fixture.lead.email, fixture.lead.company, fixture.lead.entity_url, 'Synthetic software category', 'Synthetic enterprise team', 'Synthetic alternative']) {
  assert.equal(serialized.includes(privateValue), false, `candidate leaked private fixture value: ${privateValue}`);
}

assert.ok(briefHtml.includes("service_interest:'enterprise_visibility'"), 'public Brief compatibility enum drifted');
assert.ok(briefHtml.includes('https://ops-bdd10855.base44.app/functions/intakeLead'), 'public Brief endpoint drifted');

const classificationCases = {
  Role: [
    ['CMO / VP Marketing', 'marketing_leader'],
    ['CRO / VP Sales', 'sales_leader'],
    ['VP Product Marketing', 'product_marketing_leader'],
    ['Founder / CEO / GM', 'executive'],
    ['CISO / VP Security', 'security_leader'],
    ['Revenue Operations', 'revenue_operations'],
    ['Other', 'other']
  ],
  Trigger: [
    ['Category or product launch', 'category_launch'],
    ['Enterprise expansion', 'enterprise_expansion'],
    ['Pipeline quality or deal-cycle friction', 'pipeline'],
    ['Competitive displacement', 'competitive'],
    ['Fundraise, transaction, or board event', 'transaction'],
    ['Public trust or information concern', 'trust'],
    ['Other material decision', 'other']
  ],
  'Decision window': [
    ['Within 30 days', 'within_30_days'],
    ['31–90 days', '31_90_days'],
    ['91–180 days', '91_180_days'],
    ['More than 180 days', '181_plus_days']
  ],
  ACV: [
    ['Under $25,000', 'under_25000'],
    ['$25,000–$74,999', '25000_74999'],
    ['$75,000–$149,999', '75000_149999'],
    ['$150,000–$499,999', '150000_499999'],
    ['$500,000+', '500000_plus'],
    ['Strategic / not applicable', 'strategic_or_na']
  ]
};
const outputFields = { Role: 'submitter_role_class', Trigger: 'trigger_type', 'Decision window': 'decision_window_band', ACV: 'acv_band' };
for (const [label, cases] of Object.entries(classificationCases)) {
  const originalLine = fixture.lead.notes.split('\n').find((line) => line.startsWith(`${label}: `));
  for (const [publicValue, expected] of cases) {
    assert.ok(briefHtml.includes(`<option>${publicValue}</option>`), `Brief is missing mapped ${label} option ${publicValue}`);
    const input = clone(fixture);
    input.lead.notes = input.lead.notes.replace(originalLine, `${label}: ${publicValue}`);
    assert.equal(buildBriefEventCandidate(input, contract).data[outputFields[label]], expected, `${label} mapping failed for ${publicValue}`);
  }
}
for (const prohibitedKey of contract.prohibited_data_keys) {
  assert.equal(Object.hasOwn(candidate.data, prohibitedKey), false, `candidate emitted prohibited key ${prohibitedKey}`);
}

{
  const input = clone(fixture);
  input.lead.service_interest = 'signal_audit';
  expectFailure('legacy service mismatch', input, 'not the verified compatibility value');
}

{
  const input = clone(fixture);
  input.lead.notes = input.lead.notes.replace('Trigger: Category or product launch', 'Trigger: Unverified trigger');
  expectFailure('unknown trigger', input, 'unsupported Trigger classification');
}

{
  const input = clone(fixture);
  input.lead.notes = input.lead.notes.replace(/Priority buyer question:.*\n/, '');
  expectFailure('missing buyer question', input, 'missing Priority buyer question field');
}

{
  const input = clone(fixture);
  input.lead.notes += '\nTrigger: Competitive displacement';
  expectFailure('ambiguous duplicate label', input, 'duplicate Trigger field');
}

{
  const input = clone(fixture);
  input.source_record_digest = 'plain-source-id';
  expectFailure('raw source identifier', input, 'opaque HMAC-SHA-256');
}

{
  const input = clone(fixture);
  delete input.lead.email;
  delete input.lead.name;
  delete input.lead.company;
  delete input.lead.entity_url;
  assert.deepEqual(buildBriefEventCandidate(input, contract), candidate, 'normalizer must not depend on private identity fields');
}

console.log('PASS: verified Brief mapping produces a deterministic, contract-valid candidate without copying private intake fields');
