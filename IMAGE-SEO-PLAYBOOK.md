# ARM Image SEO Playbook

Updated: 2026-08-23

## Purpose

Use one useful, page-specific diagram to help a reader understand each major topic. Images support the page; they do not replace crawlable explanations, proof tables, or claim boundaries. No filename, alt attribute, caption, or schema property should promise a ranking, citation, model answer, or revenue outcome.

## Visual system

- Palette: ink, violet, mint, and paper only, except where an approved source artifact requires a redaction color.
- Drawing language: thin mono-weight lines, simple nodes, restrained geometric marks, and generous whitespace.
- Type: DM Mono for labels and Manrope for explanatory text when text is necessary inside the image.
- Primary formats: 16:9 or 3:2 for page headers; 1:1 for compact taxonomies such as the four-trigger quadrant.
- Keep `#proof` as HTML tables. Do not replace crawler-legible sample maps with screenshots.

## Naming template

Use lowercase words separated by hyphens:

`[primary-topic]-[diagram-type]-[audience].webp`

Examples:

- `ai-buyer-conversation-map.webp`
- `enterprise-gtm-revenue-triggers.webp`
- `signal-orchestration-pipeline-enterprise-gtm.webp`

Keep filenames short and descriptive. Do not repeat synonyms or append keyword lists.

## Page implementation template

```html
<figure class="article-visual">
  <img
    src="/assets/images/descriptive-topic-diagram.webp"
    width="1536"
    height="1024"
    loading="lazy"
    decoding="async"
    alt="One sentence describing the diagram and its useful relationship."
  >
  <figcaption>TOPIC · STEP → STEP → STEP</figcaption>
</figure>
```

Use eager loading and `fetchpriority="high"` only for a likely above-the-fold/LCP image. Every image must have explicit dimensions, a contextual alt attribute, relevant nearby copy, and a standard `<img src>` reference.

For an active page's primary image:

1. Set page-specific `og:image`, accurate dimensions, and an accurate `og:image:alt`.
2. Set the matching Twitter image and alt text.
3. Associate an `ImageObject` with the page or article schema.
4. Add the image URL beneath its canonical page in `sitemap.xml` using only `image:image` and `image:loc`.
5. Update `dateModified` and the sitemap `lastmod` when the page meaningfully changes.

## Silo batches

### Batch 1 — Buyer intelligence foundations

- Homepage: shortlist → comparison / validation → trust node map. Complete.
- About: category / launch / pipeline / competitive quadrant. Complete.
- Signal orchestration: capture → filter → enrich → prioritize → activate pipeline. Complete.
- Buyer intent vs buyer intelligence: two-lane activity-versus-decision diagram.
- Enterprise buying committee intelligence: stakeholder constellation around one decision.
- Enterprise proof readiness: question → source → owner → acceptance evidence chain.
- Category narrative intelligence: buyer language → category claim → proof → commercial action.

### Batch 2 — Accountable agentic commerce

- Agentic commerce pillar: mandate → authorization → payment → fulfillment → reconciliation.
- Accountable agentic commerce glossary: compact relationship map for mandate, wallet, settlement, and receipt terms.

### Hold — Redirected legacy resources

Do not add images, schema, or sitemap entries to a URL that permanently redirects. The supplied `geo-vs-seo-comparison.webp` is retained as a design source only. `/resources/geo-vs-seo/` redirects to `/resources/buyer-intent-vs-buyer-intelligence/`; the artwork should not be attached to that destination because it describes a different comparison. Reuse requires a new canonical GEO-versus-SEO page and a claim-boundary review.

## Duplicate control

- Publish one primary diagram per page unless a second image explains a materially different concept.
- Do not publish alternate compositions with the same message solely to repeat keywords.
- Before importing a batch, compare the concept, not just the file hash. Keep the clearest, most claim-safe version.
- The landscape “Four triggers. One root cause.” version was rejected as a duplicate and because its claim was more absolute than the selected quadrant.

## Real-proof template

Do not fabricate an Action Register example. When an owner-approved real Sprint artifact exists:

1. Duplicate the approved source into a private working copy.
2. Remove names, company identifiers, domains, account values, dates, and indirect identifiers.
3. Apply irreversible blur plus solid redaction bars; do not rely on removable overlays.
4. Crop to the smallest excerpt that demonstrates the artifact structure.
5. Export a WebP using a descriptive topic filename, never a client name.
6. Add visible context: `Redacted Action Register excerpt · shared with permission`.
7. Have the artifact owner verify that no protected information remains before publication.

The reusable frame should preserve the same ink/violet/mint visual system, but the underlying rows must come from real, approved work.
