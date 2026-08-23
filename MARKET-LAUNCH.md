# ARM Agency — Market Launch Operating Record

**Status:** Controlled launch preparation

**Updated:** 2026-08-22

**Current offer path:** Category Presence Brief → human fit review → written scope → private collection → $12,500 AI Buyer Intelligence Sprint

## Launch thesis

ARM is not launching as a GEO, SEO, reputation-management, contact-list, or commodity intent-data service. ARM helps high-ACV B2B teams turn fragmented buyer signals into a defensible buying-group decision record and an owner-led action plan.

The launch wedge is one company with:

- a category, product-launch, pipeline, or competitive trigger inside 180 days;
- a research-heavy, multi-stakeholder buying process;
- approved buyer voice, pipeline, product, or proof evidence;
- named people who can act within 90 days.

## Research decision log

An owner-supplied August 2026 research synthesis reinforced five operating choices:

1. Treat multiple signals as context, never as purchase certainty.
2. Model the buying group and its unanswered questions instead of treating an isolated lead as the decision.
3. Prefer approved first-party and proprietary evidence over commodity third-party lists.
4. Structure every signal with source, time, confidence, decay or freshness, permitted use, suggested action, and owner.
5. Measure decisions supported and actions adopted rather than report volume.

The PDF did not provide source links for its numerical claims. Those figures are not approved as public claims. Its recommendation to pursue GEO/AEO is outside ARM's current strategy and is not part of this launch.

## Measurement system

### Anonymous traffic

Vercel Web Analytics records aggregated, cookie-free page views and referrers. The current Hobby plan supports page views but not custom events. Do not add paid event tracking or a second analytics provider without an owner decision and privacy review.

Review these paths separately:

- `/` — positioning entry
- `/sprint/` — offer evaluation
- `/brief/` — fit-intake entry
- `/resources/` and guide routes — education
- `/about/` and `/glossary/` — trust and category understanding

### Conversion truth

A conversion is a successful Lead creation through the Category Presence Brief form. The Lead notes include only sanitized launch context when present:

- source page or campaign label;
- UTM source, medium, campaign, and content;
- optional campaign reference;
- referring origin and path, with its query string removed.

Do not place names, email addresses, account IDs, or other personal data in campaign parameters.

### Funnel definitions

| Stage | Evidence source | Decision question |
| --- | --- | --- |
| Visit | Vercel page view | Which routes and referrers bring relevant attention? |
| Offer evaluation | `/sprint/` page view | Are visitors investigating scope, price, and fit? |
| Brief entry | `/brief/` page view | Does the positioning create enough confidence to begin intake? |
| Brief requested | Base44 Lead created | Did the complete request reach ARM's operating record? |
| Fit decision | Human review record | Is the trigger, value, evidence, and ownership sufficient? |
| Scope issued | Written scope record | Was a bounded Sprint proposed? |
| Sprint booked | Accepted scope and booking payment | Did the qualified decision become paid work? |
| Adoption | Accepted actions and owner updates | Did the client use the decision system? |

Do not publish a conversion-rate claim or set an optimization target until a real baseline exists. Record counts and reasons first.

## Campaign link convention

Use lowercase, non-personal labels. Example:

```text
https://www.arm-agency.com/brief/?source=linkedin_operator_outreach&utm_source=linkedin&utm_medium=organic&utm_campaign=buyer_intelligence_launch
```

For communities or partner referrals, change the source and medium; never encode a person's identity in the URL.

## Controlled launch cadence

### Before the first outreach

- Production deployment, DNS, TLS, sitemap, and redirects pass.
- Brief success and failure paths pass with a controlled test.
- Vercel Web Analytics collection is visible after production deployment.
- The owner confirms the legal contracting entity shown in written scopes and invoices.
- The owner confirms where new Base44 Leads are reviewed and whether notifications arrive.

### Days 1–3

- Use a small, owner-approved set of relevant conversations; do not buy or scrape a bulk contact list.
- Use one campaign label per channel or message variant.
- Review every Brief manually and record fit or decline reasons.
- Check Base44 directly at least once daily until notification delivery is verified.

### Days 4–7

- Compare landing routes, Sprint views, Brief entries, and completed Briefs.
- Review the words prospects use for the problem; do not infer buying intent from a visit alone.
- Change one material message or path at a time and document the reason.

### Days 8–14

- Review qualified-Brief rate, response time, recurring fit gaps, scope decisions, and source quality.
- Keep, revise, or stop each channel based on decision quality—not traffic volume.
- Broaden the launch only after the intake owner, notification path, and contracting entity are confirmed.

## Current launch gates

| Gate | State |
| --- | --- |
| Positioning and active resources aligned to buyer intelligence | Pass |
| Production DNS, TLS, sitemap, and legacy redirects | Pass |
| Brief validation, abuse friction, timeout, and accessible error state | Pass |
| Controlled Lead creation test | Pass |
| Anonymous page-view analytics | Enabled; production verification pending deployment |
| Source attribution in successful Brief records | Browser test passed; production verification pending deployment |
| Base44 notification delivery and downstream automation | Unverified; manual Lead review required |
| Legal contracting entity | Owner confirmation required before paid scope |
| Backend rate limiting and restrictive CORS | Not available in this repository |
