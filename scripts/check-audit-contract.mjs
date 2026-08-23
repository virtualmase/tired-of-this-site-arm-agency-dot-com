import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../audit/index.html', import.meta.url), 'utf8');

const required = [
  'Buyer Research Orientation',
  'Self-guided orientation',
  'Five conditions to check',
  'commercial event inside the next 180 days',
  'Typical fit is a $75,000+ annual contract value',
  'Can you name the buyer question that matters?',
  'Do you have buyer voice or pipeline evidence?',
  'Can someone act on a finding in 90 days?',
  'Request a Category Presence Brief',
  'does not score your company',
];

const prohibited = [
  'Audit Fit Review',
  'Signal Audit',
  'Share of Model',
  'citation-ready',
  'repair how ChatGPT',
  'mentions, citations, and framing',
];

const missing = required.filter((term) => !source.includes(term));
const present = prohibited.filter((term) => source.toLowerCase().includes(term.toLowerCase()));

if (missing.length || present.length) {
  console.error('ARM buyer orientation contract check failed.');
  if (missing.length) console.error(`Missing required content: ${missing.join(', ')}`);
  if (present.length) console.error(`Prohibited legacy content found: ${present.join(', ')}`);
  process.exit(1);
}

console.log('ARM buyer orientation contract check passed.');
