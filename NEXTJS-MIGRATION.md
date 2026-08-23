# Next.js Migration

## Release shape

This repository now has a Next.js 16 compatibility layer for the existing ARM Agency site. It preserves the canonical HTML documents while moving request routing and deployment builds into Next.js.

The migration covers all 16 URLs in `sitemap.xml`. It does not replace the pages with shortened React copies, and it does not claim that changing frameworks improves rankings.

The original site was already server-delivered, crawlable HTML. The migration therefore optimizes for route and content parity first. React component conversion can happen page by page in a later release, with visual and form regression testing for each page.

## Architecture

```text
app/
├── route.ts                 # Serves the canonical homepage HTML
└── [...path]/route.ts       # Pre-renders the 15 nested canonical routes

lib/
└── site-pages.ts            # Explicit route-to-source allowlist

public/
├── assets/                  # Runtime images, CSS, icons, and attribution JS
├── robots.txt
└── sitemap.xml

index.html                   # Canonical homepage source
about/, brief/, ...          # Canonical nested-page sources
next.config.js               # Headers, trailing slashes, redirects, file tracing
vercel.json                  # Production CSP, headers, and redirect parity
```

For `/about/`, for example, Next resolves the allowlisted route, reads `about/index.html`, and returns the complete document as `text/html`. Unknown paths return 404. `generateStaticParams` pre-renders every nested sitemap route during `next build`.

This bridge deliberately avoids `dangerouslySetInnerHTML` and client-side replacement of full documents. Existing inline page behavior, metadata, JSON-LD, CSS, forms, and internal links remain in their canonical HTML sources.

## Runtime requirements

- Node.js 20.9 or newer
- npm with the committed `package-lock.json`
- Next.js 16.3.2 and React 19.2.8, pinned in `package.json`

Install reproducibly:

```bash
npm ci
```

## Local verification

Run the source contracts, type check, and production build:

```bash
npm run verify:launch
npm run lint
npm run build
```

Then exercise the production server:

```bash
npm start
```

In another terminal, verify representative pages and a legacy redirect:

```bash
curl -fsS http://127.0.0.1:3000/ | rg "Know what shapes"
curl -fsS http://127.0.0.1:3000/about/ | rg "Four revenue triggers"
curl -fsS http://127.0.0.1:3000/brief/ | rg "Category Presence Brief"
curl -fsS http://127.0.0.1:3000/resources/signal-orchestration-guide/ | rg "Signal Orchestration"
curl -sSI http://127.0.0.1:3000/resources/geo-vs-seo | rg "^(HTTP|location:)"
```

The build output must list the root route plus 15 generated nested paths. A successful build alone does not verify production DNS, Vercel project settings, form delivery, analytics receipt, or Google indexation.

## Route and content contract

Every active public route must exist in all relevant layers:

1. Its canonical HTML source exists in the repository.
2. `sitemap.xml` includes its canonical URL.
3. `lib/site-pages.ts` allowlists the route and source file.
4. `next.config.js` includes the source in output-file tracing.
5. `public/sitemap.xml` matches the root sitemap used by the static validators.

When adding or removing a route, update these layers together and run the full verification sequence.

Legacy resource URLs remain permanent redirects. They are declared in both `next.config.js` for local/framework behavior and `vercel.json` for deployment-level enforcement.

## Metadata and crawlability

Titles, descriptions, canonical links, Open Graph fields, Twitter cards, and JSON-LD remain in each canonical HTML document. The Next route handlers return that complete document in the initial response; page content does not depend on React hydration.

`robots.txt` and `sitemap.xml` are served from `public/`. Crawlability is testable, but indexing and ranking remain Google decisions. Do not describe a successful build as guaranteed indexation, ranking improvement, or a measured performance gain.

## Security and forms

Production security policy remains in `vercel.json`. The Next config repeats the non-CSP defensive headers for non-Vercel deployments. The inline-script allowance is retained because existing pages contain inline structured data and page behavior; tightening it requires a separate nonce/hash migration and regression test.

The Brief form still posts directly to the configured Base44 intake endpoint. Verify a synthetic submission in the production environment before declaring form delivery operational. Never use real customer data for a release smoke test.

## Deployment

Pushes may trigger a deployment if the GitHub repository is connected to Vercel, but that external connection is not asserted by this repository.

The Vercel project must use the **Next.js** Framework Preset and leave Output Directory unset so Vercel uses the framework build output. `public/` contains input assets; it is not a deployable site root. A project configured as **Other** can auto-select `public/` as its output and return platform 404s even when `next build` succeeds. Verify these project settings with `vercel project inspect` before relying on a preview or production build.

Before promoting a deployment:

1. Confirm the hosting project reports the Next.js Framework Preset and no custom Output Directory.
2. Complete [GSC-READY.md](GSC-READY.md).
3. Confirm the deployment preview returns 200 for all sitemap URLs.
4. Confirm legacy redirects return a permanent redirect to the canonical destination.
5. Confirm images, CSS, icons, `robots.txt`, and `sitemap.xml` return 200.
6. Perform a synthetic Brief form submission and verify receipt without exposing personal data.
7. Record the deployment URL and commit SHA in the release notes or deployment system.
8. After promotion or rollback, inspect `www.arm-agency.com` and `arm-agency.com` directly; a Ready deployment does not prove the custom-domain aliases moved.

## Rollback

Use the hosting provider's prior deployment promotion when available, or create and push a normal revert commit:

```bash
git revert <migration-commit>
git push origin main
```

Do not rewrite shared branch history. After rollback, repeat route, asset, redirect, and form checks.

## Follow-on React conversion

The compatibility layer is an intermediate architecture, not a requirement to leave pages as raw HTML forever. Convert one route at a time only when the new component preserves:

- the page's complete claims and copy;
- canonical URL and metadata;
- structured data;
- internal links and image semantics;
- responsive presentation and accessibility;
- Brief form privacy disclosure, failure behavior, and delivery contract.

Keep the legacy source until the replacement passes those checks in a preview deployment.
