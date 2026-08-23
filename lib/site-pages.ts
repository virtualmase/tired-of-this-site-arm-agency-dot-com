import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PAGE_FILES = {
  '/': 'index.html',
  '/about/': 'about/index.html',
  '/audit/': 'audit/index.html',
  '/brief/': 'brief/index.html',
  '/glossary/': 'glossary/index.html',
  '/privacy/': 'privacy/index.html',
  '/resources/': 'resources/index.html',
  '/resources/accountable-agentic-commerce-glossary/':
    'resources/accountable-agentic-commerce-glossary/index.html',
  '/resources/agentic-commerce-x402-aifi/':
    'resources/agentic-commerce-x402-aifi/index.html',
  '/resources/buyer-intent-vs-buyer-intelligence/':
    'resources/buyer-intent-vs-buyer-intelligence/index.html',
  '/resources/category-narrative-intelligence/':
    'resources/category-narrative-intelligence/index.html',
  '/resources/enterprise-buying-committee-intelligence/':
    'resources/enterprise-buying-committee-intelligence/index.html',
  '/resources/enterprise-proof-readiness/':
    'resources/enterprise-proof-readiness/index.html',
  '/resources/signal-orchestration-guide/':
    'resources/signal-orchestration-guide/index.html',
  '/sprint/': 'sprint/index.html',
  '/terms/': 'terms/index.html',
} as const;

export const nestedPageParams = Object.keys(PAGE_FILES)
  .filter((route) => route !== '/')
  .map((route) => ({ path: route.split('/').filter(Boolean) }));

function routeForSegments(segments: string[]): string {
  return `/${segments.join('/')}/`;
}

export async function pageResponse(segments: string[] = []): Promise<Response> {
  const route = segments.length === 0 ? '/' : routeForSegments(segments);
  const relativeFile = PAGE_FILES[route as keyof typeof PAGE_FILES];

  if (!relativeFile) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const html = await readFile(
    path.join(/* turbopackIgnore: true */ process.cwd(), relativeFile),
    'utf8',
  );

  return new Response(html, {
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
