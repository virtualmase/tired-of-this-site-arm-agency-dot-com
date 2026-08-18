import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../audit/index.html', import.meta.url), 'utf8');

const required = [
  'Entity record',
  'Evidence context',
  'Information clarity',
  'Technical access',
  'Observation baseline',
  'Request an Audit Fit Review',
  'This request does not create an engagement.',
  'before any private payment instruction is sent',
  "const allowedIntents = ['signal_audit', 'signal_repair', 'arm_mandate_pro'];",
];

const prohibited = [
  'Share of Model',
  'citation-ready',
  'repair how ChatGPT',
  'mentions, citations, and framing',
];

const missing = required.filter((term) => !source.includes(term));
const present = prohibited.filter((term) => source.toLowerCase().includes(term.toLowerCase()));

if (missing.length || present.length) {
  console.error('ARM audit contract check failed.');
  if (missing.length) console.error(`Missing required content: ${missing.join(', ')}`);
  if (present.length) console.error(`Prohibited legacy content found: ${present.join(', ')}`);
  process.exit(1);
}

console.log('ARM audit contract check passed.');
