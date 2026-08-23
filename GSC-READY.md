# GSC Release Checklist

Use this checklist for the Next.js compatibility migration. It distinguishes repository checks from production and Google Search Console checks.

## Before push

- [ ] `npm ci` completes from the committed lockfile.
- [ ] `npm run verify:launch` passes the existing 16-route site contract.
- [ ] `npm run lint` reports no TypeScript errors.
- [ ] `npm run build` succeeds and generates the root plus 15 nested routes.
- [ ] `.next/`, environment files, credentials, and private customer evidence are not staged.
- [ ] `git diff --check` passes.
- [ ] The staged diff contains only reviewed migration files.

## Local production smoke test

Start the built server with `npm start`, then confirm:

- [ ] `/`, `/about/`, `/sprint/`, `/brief/`, `/resources/`, `/privacy/`, `/terms/`, and `/audit/` return 200.
- [ ] Every URL in `sitemap.xml` returns 200.
- [ ] A nonexistent URL returns 404, not the homepage.
- [ ] Each legacy resource URL returns a permanent redirect to its canonical replacement.
- [ ] `/robots.txt`, `/sitemap.xml`, and the four WebP image assets return 200.
- [ ] View-source contains the page title, description, canonical link, body copy, and expected structured data where applicable.
- [ ] A synthetic Brief submission shows the expected success/failure behavior; no real personal data is used.

## Deployment preview

- [ ] The Vercel project Framework Preset is **Next.js**, not **Other**.
- [ ] Vercel Output Directory is unset/default; it is not `public/`.
- [ ] The hosting build uses Node.js 20.9 or newer.
- [ ] The preview deployment is tied to the intended commit SHA.
- [ ] Repeat the route, 404, redirect, asset, metadata, and synthetic form checks against the preview URL.
- [ ] Review browser console and network failures at desktop and mobile widths.
- [ ] Confirm the production CSP is present and required scripts/assets are not blocked.
- [ ] Obtain owner approval before promoting the preview to production.

## Production

- [ ] Confirm the promoted deployment SHA.
- [ ] Confirm both `www.arm-agency.com` and `arm-agency.com` resolve to the promoted deployment, especially after a rollback.
- [ ] Check all sitemap URLs from outside the authenticated hosting dashboard.
- [ ] Confirm `https://www.arm-agency.com/robots.txt` references the canonical sitemap.
- [ ] Confirm `https://www.arm-agency.com/sitemap.xml` serves the expected 16 canonical URLs.
- [ ] Confirm canonical URLs use `https://www.arm-agency.com` and the intended trailing slash.
- [ ] Verify one synthetic Brief reaches the approved intake destination.
- [ ] Verify analytics receipt separately; page script presence is not evidence of event receipt.
- [ ] Record the pre-release baseline for indexed pages, impressions, clicks, Core Web Vitals, and crawl errors before interpreting later changes.

## Google Search Console

- [ ] Verify the correct domain or URL-prefix property is selected.
- [ ] Submit or re-submit `https://www.arm-agency.com/sitemap.xml` if needed.
- [ ] Use URL Inspection on the homepage and representative nested/resource pages.
- [ ] Run the live test and inspect the rendered HTML/resources for blocking errors.
- [ ] Request indexing only for important changed canonical pages; sitemap discovery covers the set.
- [ ] Monitor Page Indexing, Crawl Stats, Core Web Vitals, and Enhancements for new errors.
- [ ] Annotate the release date and commit SHA in the measurement record.

Passing this checklist establishes technical delivery evidence. It does not guarantee crawling frequency, indexation, rankings, traffic, or revenue impact.
