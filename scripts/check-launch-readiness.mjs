import fs from 'node:fs';

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};

const read = (file) => fs.readFileSync(file, 'utf8');
const sitemap = read('sitemap.xml');
const routes = [...sitemap.matchAll(/<loc>https:\/\/www\.arm-agency\.com\/([^<]*)<\/loc>/g)].map((match) => match[1]);
const activeFiles = routes.map((route) => route ? `${route.replace(/\/$/, '')}/index.html` : 'index.html');

for (const file of activeFiles) {
  if (!fs.existsSync(file)) {
    fail(`sitemap route has no local page: ${file}`);
    continue;
  }
  const html = read(file);
  const attributionCount = (html.match(/\/assets\/launch-attribution\.js/g) || []).length;
  const analyticsCount = (html.match(/\/_vercel\/insights\/script\.js/g) || []).length;
  if (attributionCount !== 1 || analyticsCount !== 1) {
    fail(`${file} analytics instrumentation count is ${attributionCount}/${analyticsCount}, expected 1/1`);
  }
}

const indexedContent = [
  'index.html', 'sprint/index.html', 'about/index.html', 'resources/index.html', 'llms.txt', 'sitemap.xml',
  'resources/signal-orchestration-guide/index.html',
  'resources/buyer-intent-vs-buyer-intelligence/index.html',
  'resources/enterprise-buying-committee-intelligence/index.html',
  'resources/enterprise-proof-readiness/index.html',
  'resources/category-narrative-intelligence/index.html'
].map(read).join('\n');

for (const retired of ['Generative Engine Optimization', 'GEO vs SEO', 'AI Reputation Management', 'AI visibility reporting']) {
  if (indexedContent.toLowerCase().includes(retired.toLowerCase())) fail(`retired positioning remains active: ${retired}`);
}

const brief = read('brief/index.html');
for (const required of ['armLaunchContext', 'Launch source:', 'UTM campaign:', 'Referrer path:']) {
  if (!brief.includes(required)) fail(`Brief attribution missing: ${required}`);
}

const privacy = read('privacy/index.html');
for (const required of ['cookie-free page-view analytics', 'Vercel Web Analytics', 'query strings are excluded']) {
  if (!privacy.includes(required)) fail(`privacy disclosure missing: ${required}`);
}

const redirects = JSON.parse(read('vercel.json')).redirects;
const legacyRoutes = [
  'generative-engine-optimization-guide',
  'geo-vs-seo',
  'enterprise-ai-visibility-audit',
  'reputation-due-diligence-ai-search',
  'ai-reputation-management-guide',
  'agentic-reputation-infrastructure'
];
for (const route of legacyRoutes) {
  for (const suffix of ['', '/']) {
    const source = `/resources/${route}${suffix}`;
    if (!redirects.some((redirect) => redirect.source === source && redirect.permanent === true)) {
      fail(`permanent legacy redirect missing: ${source}`);
    }
  }
}

if (!process.exitCode) console.log(`PASS: ${activeFiles.length} active pages, launch attribution, privacy disclosure, positioning, and redirects verified`);
