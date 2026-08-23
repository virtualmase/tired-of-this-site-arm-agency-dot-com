# ARM Agency Site — Agent Handoff

This repository is the production source for **www.arm-agency.com**. It is a static HTML/CSS/JavaScript site deployed through Vercel. It connects a visitor's Category Presence Brief to a human fit review and, only after written Sprint scope acceptance, a private collection path.

## Primary files and validation

| Area | Location | Rule |
| --- | --- | --- |
| Main page and offers | `index.html` | Preserve the ordered buyer path and use only the approved engagement names and prices. |
| Category Presence Brief | `brief/index.html` | Keep this a human-reviewed fit request. Verify intake changes with owner-controlled data and protect the downstream record. |
| Buyer Research Orientation | `audit/index.html` | Keep this self-guided, non-scoring, and subordinate to the human-reviewed Brief. |
| Discovery files | `sitemap.xml`, `robots.txt`, `llms.txt` | Keep canonical public routes aligned with live production. |
| Public resources | `resources/` | Use source-visible, people-first material. Do not extrapolate a third-party system observation into a promised repair outcome. |
| Hosting configuration | `vercel.json` | Do not change production routing or rewrites without direct route verification. |

## Approved offers and claim boundary

The approved public offer is the **AI Buyer Intelligence Sprint ($12,500 fixed scope, 15 business days, 60% booking payment and 40% before the executive readout)**. The no-cost **Category Presence Brief** is the human-reviewed fit step before a Sprint is proposed. Payments remain private and follow written scope acceptance. Do not create public checkout, promise a third-party model answer will change, or represent unverified buyer, reputation, governance, or agent outcomes as facts.

The Sprint produces four defined deliverables: a Buyer Conversation Map, Shortlist / Source Gap Map, Proof & Conversion Review, and 90-Day Action Register. Observations must record the agreed research conditions and sources. Recommendations must have a named owner, dependency, acceptance test, and measure. Terms such as *repair*, *correction*, *visibility*, or *machine-verifiable trust* are not performance guarantees.

## Operating controls

No fabricated reviews, ratings, testimonials, client results, sales metrics, or public proof. Keep private lead and test data out of the repository. The Base44 intake endpoint is a record-creation boundary; verify downstream handling only with owner-authorized test identities.

When editing a CTA, preserve the path **Category Presence Brief → human fit review → written Sprint scope → private collection → Sprint delivery**. Do not route a visitor from public educational content directly to payment.

## Collaboration workflow

Read the relevant page and static assets before editing. Write code, configuration, comments, tests, commit messages, file names, and implementation-facing documentation in English. Use another language only for explicitly approved public-facing localized content, with an English review note where it affects implementation. Keep copy claim-safe, source-backed, and accessible. After public route or CTA work, inspect the live route directly and record what created a downstream record versus what was view-only. Never add secrets, credentials, raw intake payloads, payment data, or personal prospect information to source control.
