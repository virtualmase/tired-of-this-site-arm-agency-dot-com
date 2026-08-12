# ARM Agency — Initial Sales Campaign Roadmap

**Version:** 1.0  
**Last updated:** 2026-08-11  
**Status:** Draft — ready for execution  
**Owner:** ops924.base.eth

---

## 0. Premise

The backend scaffold is live. Seven entities, six functions, a full pipeline from lead to fulfillment. What's missing is the sales motion — how we fill the pipeline, move deals through it, and convert auditions into retainers.

This roadmap is the first 90 days of sales campaigns for ARM Agency, built directly on the scaffold we just deployed.

---

## 1. The Offer Stack

Three tiers, each mapping to a campaign type in the backend:

| Tier | Price | Service Type | Campaign Type | What They Get |
|------|-------|-------------|---------------|---------------|
| Signal Audit | $2,500 | signal_audit | visibility_audit | 5-dimension audit, SoM baseline, prioritized recommendations |
| GEO Engagement | $8,500/mo | geo_repair | geo_optimization | Schema deployment, authority mapping, content structure, monthly SoM tracking |
| Reputation Retainer | $12,000/mo | retainer | ongoing_retainer | Weekly SoM, monthly schema maintenance, monthly report, quarterly strategy review |

**The funnel logic:** Signal Audit is the paid diagnostic. It's low-risk, high-value, and surfaces the gap. GEO Engagement is the fix. Reputation Retainer is the ongoing protection.

Every Signal Audit should produce findings that justify a GEO Engagement. Every GEO Engagement should convert to a Reputation Retainer. The backend already scaffolds this progression — `closeDeal()` auto-creates the right campaign type with the right deliverables.

---

## 2. The 90-Day Roadmap

### Phase 1: Pipeline Fill (Days 1-30)

**Goal:** 20 leads in the pipeline, 5 Signal Audits sold.

#### Campaign 1A — Outbound to Pre-Raise Founders

**Target:** Founders who announced a funding round in the last 30 days. They're about to be searched by investors.

**Channel:** Apollo.io for lead enrichment → email outreach → Telegram follow-up.

**The hook:** "Before your next investor call, check what ChatGPT says about you." Link to the [Reputation Due Diligence guide](/resources/reputation-due-diligence-ai-search/).

**Backend flow:** 
- Lead created via `intakeLead` with `service_interest: "due_diligence"` and `source: "outbound"`
- SignalAudit auto-created in "requested" status
- If they respond, `qualifyLead` → Opportunity in "discovery"
- Close the Signal Audit → `closeDeal` with `plan: "signal_audit"`, `service_type: "signal_audit"`
- Backend auto-scaffolds: visibility_audit campaign + 4 deliverables

**KPIs:**
- 50 outbound emails sent
- 15% reply rate (7-8 conversations)
- 5 Signal Audits sold ($12,500 revenue)

#### Campaign 1B — Inbound Capture (Website)

**Target:** Visitors to arm-agency.com who hit the Signal Audit CTA.

**Channel:** Homepage form wired to `intakeLead`.

**The hook:** Five content silo pages are live and crawlable. Each has a CTA box linking to `#pricing`. The resource hub funnels traffic to the pillars, which funnel to the CTA.

**Backend flow:**
- Form submission → `intakeLead` with `source: "website"`
- SignalAudit auto-created if service_interest matches
- Manual follow-up → `qualifyLead`

**KPIs:**
- 200 unique visitors to /resources/ (organic search)
- 10% CTA click-through (20 leads)
- 3 Signal Audits sold from inbound ($7,500)

#### Campaign 1C — Referral Network

**Target:** Existing contacts in the Arctura / Coreweaver ecosystem, Bittensor subnet operators, Web3 founders.

**Channel:** Direct Telegram messages, LinkedIn DMs.

**The hook:** "We just built the infrastructure to measure and fix how AI represents you. I'll run a Signal Audit on your entity — 5 dimensions, 4 engines, 48 hours."

**Backend flow:**
- Manual lead entry via `intakeLead` with `source: "referral"`
- Direct to audit → `qualifyLead` → `closeDeal` (skipping full sales cycle)

**KPIs:**
- 15 referral messages sent
- 5 warm conversations
- 2 Signal Audits sold ($5,000)

### Phase 1 Targets
| Metric | Target |
|--------|--------|
| Leads created | 20+ |
| Signal Audits sold | 10 |
| Signal Audit revenue | $25,000 |
| Opportunities in pipeline | 15+ |
| Pipeline value (GEO + Retainer upsell) | $85,000 |

---

### Phase 2: Audit-to-Engagement Conversion (Days 31-60)

**Goal:** Convert 40% of completed Signal Audits into GEO Engagements. Launch 3 active campaigns.

#### Campaign 2A — Audit-to-Engagement Upsell

**Target:** Every client who completed a Signal Audit in Phase 1.

**The motion:** The Signal Audit findings report IS the proposal. Every finding maps to a deliverable in the GEO Engagement template. The gap analysis is the sales document.

**The hook:** "Your audit found [X] gaps across [Y] dimensions. The GEO Engagement fixes all of them. Here's what month one looks like."

**Backend flow:**
- Update existing Opportunity from "audit_complete" → "proposal_sent"
- On close: `closeDeal` with `service_type: "geo_repair"`, `plan: "quarterly"`
- Backend auto-scaffolds: geo_optimization campaign + 6 deliverables (schema deployment, authority mapping, crawler check, SoM baseline, content review, findings report)

**KPIs:**
- 10 audits completed in Phase 1
- 4 convert to GEO Engagement ($8,500/mo × 4 = $34,000 MRR)
- 6 remain in pipeline (nurture with SoM tracking free trial)

#### Campaign 2B — Enterprise Visibility Outreach

**Target:** Companies with DA-60+ who don't appear in ChatGPT for their category queries.

**Channel:** Apollo.io firmographic filter → email with the [Enterprise AI Visibility guide](/resources/enterprise-ai-visibility-audit/) as the hook.

**The hook:** "Your domain authority is [DA score]. Your competitors show up in ChatGPT. You don't. Here's why — and how to fix it."

**Backend flow:**
- `intakeLead` with `service_interest: "enterprise_visibility"`, `source: "outbound"`
- SignalAudit auto-created
- `qualifyLead` → Opportunity
- If they want the full audit → `closeDeal` with `service_type: "enterprise_visibility"`

**KPIs:**
- 30 enterprise outreach emails
- 8 conversations
- 3 GEO Engagements ($8,500/mo × 3 = $25,500 MRR)

### Phase 2 Targets
| Metric | Target |
|--------|--------|
| GEO Engagements sold | 7 |
| MRR from GEO | $59,500 |
| Active campaigns | 3+ |
| Deliverables in progress | 20+ |

---

### Phase 3: Retainer Conversion & Scale (Days 61-90)

**Goal:** Convert 50% of GEO Engagements to Reputation Retainers. Establish weekly SoM tracking as standard.

#### Campaign 3A — GEO-to-Retainer Conversion

**Target:** Clients in active GEO Engagements who are seeing SoM improvement.

**The motion:** After 30 days of GEO work, run a formal SoM comparison (baseline vs current). If delta is positive — which it should be after schema deployment + authority mapping — the data sells the retainer.

**The hook:** "Your Share of Model went from [X]% to [Y]% in 30 days. The retainer keeps it climbing and protects against regression."

**Backend flow:**
- New Opportunity created for the existing client (upsell)
- `closeDeal` with `service_type: "retainer"`, `plan: "retainer"`
- Backend auto-scaffolds: ongoing_retainer campaign + 4 deliverables (weekly SoM, monthly schema, monthly report, quarterly review)
- Original GEO campaign marked "completed"

**KPIs:**
- 7 active GEO Engagements
- 4 convert to Retainer ($12,000/mo × 4 = $48,000 MRR)
- 3 remain on GEO ($8,500/mo × 3 = $25,500 MRR)

#### Campaign 3B — Case Study Publication

**Target:** 2 completed Signal Audits with measurable SoM improvement.

**Channel:** Publish as content on arm-agency.com/resources/ — case studies are the highest-converting content type and feed the content silo.

**The hook:** "How [Company] went from 0% to [X]% Share of Model in [N] days."

**This serves dual purpose:**
1. Sales asset — proof the methodology works
2. Content asset — new resource pages for the content silo, improving organic search and GEO

**KPIs:**
- 2 case studies published
- 5 inbound leads generated from case studies
- 1 retainer sold from case study inbound

### Phase 3 Targets
| Metric | Target |
|--------|--------|
| Retainers sold | 4 |
| MRR from Retainers | $48,000 |
| MRR from remaining GEO | $25,500 |
| Total MRR | $73,500 |
| Active clients | 7+ |
| Weekly SoM records logged | 28+ (7 clients × 4 weeks) |

---

## 3. 90-Day Revenue Projection

| Month | Signal Audits | GEO Engagements | Retainers | Total Revenue |
|-------|--------------|-----------------|-----------|----------------|
| Month 1 | $25,000 (10 × $2,500) | — | — | $25,000 |
| Month 2 | $7,500 (3 more) | $59,500 MRR (7 sold) | — | $67,000 |
| Month 3 | $5,000 (2 more) | $25,500 MRR (3 remaining) | $48,000 MRR (4 converted) | $78,500 |
| **90-day total** | **$37,500** | **$85,000** | **$48,000** | **$170,500** |
| **Run-rate MRR end of Q1** | — | $25,500 | $48,000 | **$73,500 MRR** |

---

## 4. Campaign-to-Backend Mapping

Every campaign in this roadmap maps to the backend scaffold:

| Sales Campaign | intakeLead source | service_interest | Close path | Campaign type scaffolded |
|---------------|-----------------|------------------|------------|--------------------------|
| 1A: Pre-raise outbound | outbound | due_diligence | closeDeal → signal_audit | visibility_audit |
| 1B: Website inbound | website | signal_audit | closeDeal → signal_audit | visibility_audit |
| 1C: Referral network | referral | signal_audit | closeDeal → signal_audit | visibility_audit |
| 2A: Audit-to-GEO upsell | (existing client) | geo | closeDeal → geo_repair | geo_optimization |
| 2B: Enterprise outreach | outbound | enterprise_visibility | closeDeal → enterprise_visibility | visibility_audit |
| 3A: GEO-to-Retainer | (existing client) | (upsell) | closeDeal → retainer | ongoing_retainer |
| 3B: Case study inbound | website | geo | closeDeal → geo_repair | geo_optimization |

---

## 5. Fulfillment Workflow Per Engagement

Once a deal closes via `closeDeal()`, the fulfillment workflow runs against the auto-scaffolded deliverables:

### Signal Audit (visibility_audit campaign)
```
Day 1: 5-dimension audit (entity_audit) — START
Day 1: SoM baseline measurement (som_measurement) — START
Day 2: Gap analysis report (report) — depends on audit completion
Day 2: Prioritized recommendations (report) — depends on gap analysis
Day 3: QA review → deliver to client
```

### GEO Engagement (geo_optimization campaign)
```
Week 1:
  - Entity schema audit + deployment (schema_deployment) — CRITICAL
  - Crawler infrastructure check (entity_audit)
  - SoM baseline measurement (som_measurement)

Week 2:
  - sameAs authority mapping (authority_mapping) — depends on schema
  - Content structure review (entity_audit)

Week 3:
  - Initial findings report (report) — depends on all above
  - Client review meeting

Week 4:
  - Monthly SoM measurement (logShareOfModel)
  - Monthly report delivery
```

### Reputation Retainer (ongoing_retainer campaign)
```
Weekly:
  - SoM tracking (logShareOfModel) — every Monday

Monthly:
  - Schema maintenance (schema_deployment) — first week
  - Performance report (report) — last week

Quarterly:
  - Strategy review (client_meeting) — scheduled
```

---

## 6. Dashboard Metrics (getPipelineDashboard)

The pipeline dashboard function provides the real-time KPIs for this roadmap. Check weekly:

| Metric | Source | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|--------|---------------|---------------|---------------|
| leads.new | Lead status="new" | 10 | 5 | 5 |
| leads.qualified | Lead status="qualified" | 5 | 3 | 2 |
| opportunities.open | Opportunity stage ≠ closed | 15 | 10 | 5 |
| opportunities.won | Opportunity stage=closed_won | 10 | 7 | 4 |
| opportunities.win_rate | won / (won+lost) | 50% | 55% | 60% |
| opportunities.pipeline_value | Sum of open deal_value | $85K | $50K | $20K |
| clients.active | Client status=active/onboarding | 0 | 7 | 7 |
| campaigns.active | Campaign status=active | 0 | 7 | 7 |
| deliverables.in_progress | Deliverable status=in_progress | 0 | 20 | 15 |
| deliverables.completed | Deliverable status=completed | 0 | 10 | 35 |
| revenue | Sum of closed deal_value | $25K | $92K | $170K |

---

## 7. Tooling Stack for Execution

| Tool | Role | Status |
|------|------|--------|
| Base44 entities | CRM + project management | Deployed |
| Base44 backend functions | Pipeline automation | Deployed |
| Apollo.io | Lead enrichment, prospecting | Connected |
| Telegram bot | Lead notifications, pipeline alerts | Connected |
| Redis | Caching, dedup, state | Connected |
| Make.com MCP | Workflow orchestration, automations | Connected |
| Notion | Content calendars, meeting notes | Connected |
| Google Drive | Report exports, client deliverables | Connected |
| GitHub | Repo versioning, documentation | Connected |

---

## 8. Next Actions

1. **Wire the homepage Signal Audit form to `intakeLead`** — the form exists, the function is deployed, they need to be connected.
2. **Pull first prospect list from Apollo.io** — filter for founders who raised in the last 30 days.
3. **Draft outbound email templates** — 3 variants for the 3 outbound campaigns (1A, 2B, 1C).
4. **Set up Telegram pipeline alerts** — notify on new lead, qualified lead, closed deal.
5. **Create weekly SoM tracking reminder** — workflow that triggers the agent to run `logShareOfModel` for active clients every Monday.
