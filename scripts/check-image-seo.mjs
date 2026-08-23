import { existsSync, readFileSync } from 'node:fs';

const sitemap = readFileSync('sitemap.xml', 'utf8');
const pages = [
  {
    file: 'index.html',
    pageUrl: 'https://www.arm-agency.com/',
    imagePath: '/assets/images/ai-buyer-conversation-map.webp',
    width: 1250,
    height: 700,
  },
  {
    file: 'about/index.html',
    pageUrl: 'https://www.arm-agency.com/about/',
    imagePath: '/assets/images/enterprise-gtm-revenue-triggers.webp',
    width: 1254,
    height: 1254,
  },
  {
    file: 'resources/signal-orchestration-guide/index.html',
    pageUrl: 'https://www.arm-agency.com/resources/signal-orchestration-guide/',
    imagePath: '/assets/images/signal-orchestration-pipeline-enterprise-gtm.webp',
    width: 1536,
    height: 1024,
  },
];

let failed = false;
const fail = (message) => {
  failed = true;
  console.error(`FAIL: ${message}`);
};

for (const page of pages) {
  const html = readFileSync(page.file, 'utf8');
  const assetFile = page.imagePath.slice(1);
  const imageUrl = `https://www.arm-agency.com${page.imagePath}`;
  const escapedPath = page.imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const imageTag = html.match(new RegExp(`<img[^>]+src="${escapedPath}"[^>]*>`))?.[0];

  if (!existsSync(assetFile)) fail(`${page.file} references missing ${assetFile}`);
  if (!imageTag) fail(`${page.file} needs a standard img element for ${page.imagePath}`);
  if (imageTag && !/alt="[^"]+"/.test(imageTag)) fail(`${page.file} image needs contextual alt text`);
  if (imageTag && !imageTag.includes(`width="${page.width}"`)) fail(`${page.file} image width is inaccurate`);
  if (imageTag && !imageTag.includes(`height="${page.height}"`)) fail(`${page.file} image height is inaccurate`);
  if (!html.includes(`<meta property="og:image" content="${imageUrl}">`)) fail(`${page.file} needs its page-specific og:image`);
  if (!html.includes(`"contentUrl":"${imageUrl}"`)) fail(`${page.file} schema needs the matching ImageObject contentUrl`);

  const sitemapEntry = sitemap.match(new RegExp(`<url><loc>${page.pageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>[\\s\\S]*?</url>`))?.[0];
  if (!sitemapEntry?.includes(`<image:loc>${imageUrl}</image:loc>`)) fail(`${page.file} image is missing from its sitemap entry`);

  if (existsSync(assetFile)) {
    const header = readFileSync(assetFile).subarray(0, 12);
    if (header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WEBP') fail(`${assetFile} is not a valid WebP container`);
  }
}

if (sitemap.includes('/resources/geo-vs-seo/')) fail('redirected GEO vs SEO legacy URL must not enter the active sitemap');
if (!readFileSync('index.html', 'utf8').includes('class="mini-table"')) fail('homepage #proof must remain crawler-legible HTML');

if (failed) process.exit(1);
console.log(`PASS: ${pages.length} primary images have crawlable HTML, contextual metadata, valid WebP assets, and sitemap discovery`);
