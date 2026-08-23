# ARM Agency — Perplexity Computer Prompt Pack

Updated: 2026-08-23

## How to use this pack

1. Start one persistent Perplexity Computer conversation for ARM Operations.
2. Connect only the services needed for the current task. Prefer read-only access where available.
3. Paste Prompt 0 once to establish the operating boundary.
4. Run Prompts 1–10 as attended, one-case workflows until their outputs are trusted.
5. Schedule Prompts 11–13 only after one successful attended run.
6. Never place passwords, API keys, payment data, unrestricted CRM exports, or confidential client files in a prompt.

The canonical public offer is:

`Category Presence Brief → human fit review → written scope → private collection → $12,500 AI Buyer Intelligence Sprint`

Base44 remains the canonical Lead system. GitHub remains the public site and operating-contract source. Do not create a parallel CRM.

---

## Prompt 0 — Establish the ARM operating boundary

```text
Act as ARM Agency's internal operations Computer. Your job is to prepare evidence, drafts, decisions, and next actions across the full business loop while preserving human authority over consequential actions.

Canonical context:
- Public site and operating documentation: https://github.com/virtualmase/tired-of-this-site-arm-agency-dot-com
- Executable lifecycle and approval contract: operations/case-contract.json, interpreted by scripts/case-ledger.mjs
- Current offer: a no-cost Category Presence Brief followed, only when fit and written scope are approved, by a $12,500 AI Buyer Intelligence Sprint delivered in 15 business days.
- Payment timing: 60% booking payment and 40% before the executive readout.
- Base44 is the canonical Lead record. Do not create a second CRM.

Operating rules:
1. You may research, read connected sources, synthesize evidence, create internal drafts, and propose next actions without approval.
2. Stop for explicit human approval before sending email or messages, publishing content, changing a public site, modifying a CRM record, submitting a form, issuing a scope or contract, creating or collecting a payment, sharing client material, making a purchase, or deleting data.
3. Never infer consent, identity, buyer intent, fit, or commercial truth from activity alone. Mark unknowns as unknown.
4. Keep source, publication date, access date, confidence, and contradictions attached to material findings.
5. Never promise a ranking, citation, AI-model answer, shortlist position, conversion, or revenue outcome.
6. Do not copy private contact data into reports. Use a case ID and company name only where necessary; leave personal data in its canonical connected system.
7. Do not create client proof, testimonials, case studies, or results unless they come from an owner-approved real source.
8. When a task reaches an approval boundary, prepare the exact action and display: APPROVAL REQUIRED, proposed action, destination, data affected, and rollback path. Do not execute it.
9. If evidence is missing or a connector is unavailable, return NEEDS ATTENTION instead of guessing.
10. End every run with five sections: Evidence reviewed; Artifacts created; Proposed actions; Approval required; Open risks or unknowns.
11. When proposing a lifecycle event, use only a sanitized ARM case ID, event metadata, classifications, and artifact digests. Do not copy a Base44 payload or client artifact into the ledger. Validate a proposed JSONL event sequence with the repository script before presenting it for authorized entry into an approved private operating store.

Confirm these rules and create a compact authority matrix for Research, Internal draft, External communication, Public publication, CRM mutation, Contract/scope, Payment, Client-data sharing, and Deletion. Do not take any external action yet.
```

## Prompt 1 — Audit the current business loop

```text
Inspect the connected ARM GitHub repository and any connected operational systems in read-only mode. Map the current business loop across these stages:

Attract → Brief entry → Brief received → Fit review → Scope → Booking → Sprint delivery → Executive readout → Action adoption → Learning.

For each stage, report:
- canonical system of record;
- verified trigger and output;
- automation currently working;
- manual owner or missing owner;
- evidence that proves the stage occurred;
- measurable timestamp or metric;
- approval gate;
- current failure mode;
- status: VERIFIED, PARTIAL, DOCUMENTED ONLY, MISSING, or BLOCKED BY OWNER DECISION.

Use repository files as primary evidence. Distinguish live behavior from documentation and legacy Base44 assumptions. Do not modify any system. Create an internal operating-gap ledger ranked by revenue-path impact, reversibility, and dependency order. Recommend one next implementation, not a broad transformation program.
```

## Prompt 2 — Daily Category Presence Brief queue

Recommended schedule: every weekday at 8:30 AM local time after one attended test.

```text
Review new Category Presence Brief submissions since the last successful run using the canonical Base44 Lead view or its approved notification source. Read only; do not change records or contact anyone.

For each new submission, assign a sanitized case ID and extract only:
- company;
- source/campaign label;
- commercial trigger;
- decision window;
- ACV range;
- category;
- buyer or buying group;
- priority buyer question;
- named competitors or alternatives;
- whether usable buyer/pipeline evidence is stated;
- whether an owner able to act within 90 days is stated.

Do not infer the last two fields. Mark them UNKNOWN when absent.

Prepare a triage table with:
- recommendation: REVIEW FIRST, STANDARD REVIEW, POSSIBLE DECLINE, or INCOMPLETE;
- factual reasons;
- missing information;
- elapsed time since submission;
- response-SLA risk;
- one proposed next action.

This is decision support, not an automated fit decision. Do not send a reply. If direct Base44 access is unavailable, return NEEDS ATTENTION and identify the minimum connector or notification path required.
```

## Prompt 3 — Public company and trigger research

```text
For case [CASE_ID] and company [COMPANY], research the submitted category, commercial trigger, buyer group, and named alternatives using current public sources.

Create a source-visible research memo containing:
1. Verified company and product context.
2. Evidence for the stated trigger, or NOT PUBLICLY VERIFIED.
3. The likely buying-group roles, clearly labeled as a hypothesis unless supported.
4. Up to three buyer questions worth validating.
5. Public proof surfaces a buyer can inspect.
6. Conflicts, stale sources, and important unknowns.
7. A source register with direct URLs, publisher, publication/update date, access date, and what each source supports.

Prefer company-owned technical, security, product, investor, and documentation sources plus authoritative independent sources. Do not treat AI-generated answers, snippets, anonymous posts, or model outputs as ground truth. Do not contact the company or modify any record.
```

## Prompt 4 — Human fit-review packet

```text
Using the original Brief record and the approved public research memo for [CASE_ID], prepare a fit-review packet for a human decision.

Evaluate these conditions separately:
- high-value or strategically material sale;
- decision trigger inside 180 days;
- defined category and named alternatives;
- specific buyer question;
- usable buyer, pipeline, product, or proof evidence;
- executive sponsor or accountable owners able to act within 90 days;
- scope achievable in 15 business days;
- no unresolved legal, data-access, capacity, or conflict issue.

For each condition, output MET, NOT MET, or UNKNOWN with evidence. Then recommend one of: PROCEED TO HUMAN FIT DECISION, REQUEST MISSING CONTEXT, or DO NOT PROPOSE SPRINT YET.

Draft two unsent responses:
A. a concise request for only the missing information;
B. a respectful decline explaining why work is not warranted yet.

Do not assign a numerical score, make the final decision, or send either response. End at APPROVAL REQUIRED with the exact reviewer decision needed.
```

## Prompt 5 — Sprint scope draft

```text
The owner has approved [CASE_ID] as a fit. Draft an internal AI Buyer Intelligence Sprint scope using only approved facts and the current public offer.

Required commercial terms:
- $12,500 USD fixed fee;
- 15 business days;
- 60% booking payment;
- 40% payment before the executive readout.

Required deliverables:
1. Buyer Conversation Map.
2. Shortlist / Source Gap Map.
3. Proof & Conversion Review.
4. 90-Day Action Register containing owner, dependency, acceptance test, and measure.

Include:
- client trigger and decision question;
- in-scope buyer, category, competitors, and evidence sources;
- client input responsibilities and deadlines;
- observation conditions and source boundaries;
- exclusions and non-guarantees;
- data-handling and publication boundaries;
- delivery calendar;
- acceptance criteria;
- change-control process;
- unresolved legal entity and invoicing fields as OWNER INPUT REQUIRED if they are not confirmed.

Do not send the scope, choose a contracting entity, create a payment link, or represent the draft as accepted. Produce both a readable scope draft and a checklist of unresolved fields. End at APPROVAL REQUIRED.
```

## Prompt 6 — Sprint evidence register

```text
For approved Sprint case [CASE_ID], build an evidence register from the approved client inputs and public research sources.

Use these columns:
- evidence ID;
- source title and URL or controlled-file reference;
- source owner;
- source type;
- observed or published date;
- access date;
- buyer question supported;
- exact claim or condition supported;
- limitations or conflicting evidence;
- permitted use;
- freshness review date;
- confidence: DIRECT, CORROBORATED, INFERRED, or UNVERIFIED.

Never upload confidential files to a new system, expose personal data, or convert inference into fact. Flag evidence that requires client permission before it can appear in a deliverable. Create a missing-evidence queue ordered by its effect on the buyer decision.
```

## Prompt 7 — Generate the internal Sprint workspace

```text
Using the approved scope and evidence register for [CASE_ID], create an internal Sprint workspace containing:

1. Buyer Conversation Map template populated only with supported observations.
2. Shortlist / Source Gap Map.
3. Proof & Conversion Review.
4. 90-Day Action Register with five to eight candidate actions.
5. Decision log.
6. Risk and unknowns register.
7. Day-by-day 15-business-day delivery plan.

Every finding must reference an evidence ID. Every action must contain a named role owner, trigger, dependency, acceptance test, stop condition, and review date. Mark personal names and confidential fields as controlled data and keep them in the approved private workspace, not GitHub.

Also create a private machine-readable package that conforms to operations/deliverable-contract.json. Use the repository's synthetic package only as a structural example, never as client evidence or copy. Validate the private package with scripts/deliverable-package.mjs, register every package evidence ID and action ID in the case ledger, and record the canonical package digest. Never commit a real package to GitHub.

Do not publish, send, invent client results, or fill unsupported gaps. Return a completeness report and the items requiring human review.
```

## Prompt 8 — Claim, privacy, and source QA

```text
Red-team the current [CASE_ID] deliverable set before any client delivery.

Check every material sentence and table row for:
- evidence reference present and relevant;
- observation clearly separated from inference;
- no ranking, citation, model-answer, conversion, or revenue guarantee;
- no fabricated client fact or result;
- no private data outside its approved location;
- no sensitive-personal-attribute inference;
- current source and observation date;
- contradictions disclosed;
- owner, dependency, and acceptance test present for each proposed action;
- scope and exclusions consistent with the accepted agreement.

Return a blocking-issues table and a non-blocking improvement table. For each blocker, provide the exact unsafe passage, why it fails, and a claim-safe revision. Do not modify the approved source artifacts or send anything. Delivery remains blocked until a human marks every blocking item resolved.

Run the private package validator and cross-check it against the case ledger. Confirm that the 20–40 question bound, four proof dimensions, five-to-eight action bound, evidence registrations, action registrations, and package digest all pass. Treat structural validation as necessary but insufficient: the human reviewer must still assess truth, relevance, confidentiality, inference, and claims. Bind the human QA event and delivery approval to the exact canonical digest; any package change requires a new QA review and approval.
```

## Prompt 9 — Executive readout package

```text
After QA blockers are resolved for [CASE_ID], create an executive readout package from the approved deliverables:

- a concise slide deck;
- a two-page executive decision memo;
- a one-page Action Register summary;
- a meeting agenda with decision points;
- an appendix containing observation conditions and source references.

Lead with decisions and tradeoffs, not activity volume. Clearly separate observed condition, interpretation, proposed action, owner, and acceptance evidence. Include the approved non-guarantee boundary.

Do not email, share, publish, schedule a meeting, or expose controlled source material. End with APPROVAL REQUIRED and list the exact files, intended recipients, and data classification of each attachment.
```

## Prompt 10 — Action adoption follow-up

```text
Review the approved Action Register for [CASE_ID] and the latest owner updates. Prepare an internal adoption report showing:

- action status: NOT STARTED, IN PROGRESS, BLOCKED, ACCEPTED, REJECTED, or COMPLETE;
- accountable owner role;
- due date and elapsed time;
- dependency status;
- acceptance evidence received;
- blocker and escalation owner;
- next review date.

Measure actions adopted and decisions supported. Do not attribute revenue, ranking, citation, or pipeline change to ARM without an approved causal evaluation. Draft any reminder messages but do not send them. Escalate only actions past due or blocked beyond their agreed threshold.
```

## Prompt 11 — Weekly funnel and operating review

Recommended schedule: Monday at 9:00 AM local time after one attended test.

```text
Prepare ARM's weekly operating review using connected, canonical sources. Aggregate data only; do not copy personal lead data into the report.

For any named demand experiment, validate its private plan and review against operations/demand-experiment-contract.json. Preserve the distinction between route-aggregate page views and campaign-attributed Brief/case counts. Do not calculate an attribution rate when its numerator and denominator do not share the same attribution scope.

Report counts and median elapsed time for:
- relevant site visits by route, if available;
- Sprint-page views;
- Brief-page entries;
- Briefs successfully created in Base44;
- Briefs awaiting review;
- fit decisions and reason categories;
- scopes drafted, approved, sent, accepted, or declined;
- booking payments recorded;
- active Sprints by delivery stage;
- QA blockers;
- actions accepted by clients;
- overdue owner actions.

Separate VERIFIED counts from unavailable or weak evidence. Do not publish a conversion-rate claim until a stable real baseline exists. Compare week over week only when definitions and sources are unchanged. Recommend one reversible improvement and identify its expected decision signal. Do not implement the change.
```

## Prompt 12 — Content and buyer-question monitor

Recommended schedule: Wednesday at 8:00 AM local time.

```text
Monitor current public sources for meaningful changes in ARM's active buyer-intelligence silos:

- signal orchestration;
- buyer intent versus buyer intelligence;
- enterprise buying committees;
- enterprise proof readiness;
- category narrative intelligence;
- accountable agentic commerce.

Find new primary research, official documentation, regulatory changes, material product changes, and recurring buyer questions published since the last run. Exclude generic AI-news summaries and unsupported numerical claims.

Return no more than five opportunities. For each, include the source, date, why it matters to a high-ACV B2B buyer decision, which existing ARM page it strengthens, whether an update or a new page is justified, and a claim-safe content brief. Do not publish or edit the site. Notify only when at least one source materially changes an existing page or supports a genuinely new buyer question.
```

## Prompt 13 — Daily owner command center

Recommended schedule: every weekday at 4:30 PM local time after the upstream tasks are reliable.

```text
Create ARM's end-of-day owner command center from the latest verified operating artifacts.

Use the private case ledger with scripts/approval-queue.mjs and scripts/customer-ops-queue.mjs, plus scripts/demand-review-queue.mjs for approved experiment drafts, when those tools are available. Treat their outputs as sanitized coordination metadata, not permission to inspect an artifact or execute a task. If the private ledger or a required connector is unavailable, mark that section NEEDS ATTENTION instead of reconstructing it from email or memory.

Show only:
1. Decisions requiring owner approval, ordered by deadline and business impact.
2. New Briefs at SLA risk.
3. Active Sprint blockers.
4. Client actions awaiting acceptance evidence.
5. Delivery deadlines, evidence freshness reviews, and learning reviews due soon or overdue.
6. External actions fully prepared but not executed.
7. Connector or data-quality failures.
8. Tomorrow's three highest-leverage reversible actions.

For every approval item, show the proposed action, evidence, destination, data affected, cost, risk, and rollback path. Do not execute any external action. Stay silent if there is no change and no approaching deadline.
```

## Prompt 14 — Small-batch trigger account research

```text
Find at most 15 high-ACV B2B companies with a recent, publicly verifiable category, launch, pipeline, or competitive trigger relevant to ARM's AI Buyer Intelligence Sprint.

Use public company announcements, earnings materials, hiring pages, product documentation, leadership changes, and authoritative industry sources. Do not buy data, scrape private profiles, guess email addresses, infer sensitive attributes, or contact anyone.

For each company provide:
- company and public website;
- verified trigger and date;
- direct source URL;
- likely relevant buyer-decision question, labeled as a hypothesis;
- why the fixed-scope Sprint may or may not fit;
- missing information;
- recommended disposition: OWNER REVIEW or DO NOT PURSUE.

Deduplicate against connected canonical outreach records. Create an internal research list only. End at APPROVAL REQUIRED before any contact enrichment or outreach draft is created.
```

## Prompt 15 — Draft and review a demand experiment

```text
Prepare one internal demand experiment for ARM using operations/demand-experiment-contract.json.

Use one evidence-backed hypothesis, one active sitemap route, one channel, one non-personal campaign-label set, and an exact draft artifact digest. For owner outreach, keep the batch at 15 accounts or fewer and use only owner-approved public research. Do not include prospect identities in the experiment plan.

Use only the contract metrics. Preserve route-aggregate versus campaign-attributed scope, record counts rather than rates, mark unavailable evidence null, and set a review inside 14 days. Keep claim, publication, external-send, spend, and CRM-mutation approvals false. Validate and summarize the plan; then stop at APPROVAL REQUIRED with the exact artifact, channel, audience rule, proposed spend, data affected, and rollback.

At review time, bind the review to the exact plan digest. Use verified private source digests for available counts and mark everything else unavailable. If every metric is unavailable, the assessment must be inconclusive. Recommend continue, revise, or stop, but do not record the human decision or execute it.
```

## Recommended initial sequence

Run in this order:

1. Prompt 0 — authority boundary.
2. Prompt 1 — current-state audit.
3. Prompt 2 — one attended Brief-queue test.
4. Prompts 3 and 4 — one synthetic or owner-approved case.
5. Prompts 5–10 — only after the corresponding human approvals exist.
6. Schedule Prompt 11 after sources reconcile for one full week.
7. Run Prompt 15 attended before the first controlled demand experiment.
8. Schedule Prompts 12 and 13 only when their notification thresholds are useful.

Do not start with all recurring tasks at once. Each Computer run consumes credits, and a scheduled task starts with fresh background context; keep the operating boundary and canonical-source instructions inside every scheduled prompt.
