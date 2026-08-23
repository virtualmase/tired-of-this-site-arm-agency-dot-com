# ARM Agency — Phase 1 Strategic Framework & Agent Directives

**Status:** Draft for owner review — not an approved public claim or launch change
**Generated:** 2026-08-22
**Trigger:** Autonomous Business Orchestrator run (Phase 1: Foundation & Market Positioning), scoped to the live ARM Agency asset at [arm-agency.com](https://www.arm-agency.com) rather than a generic template

## 0. Grounding — what already exists (do not rebuild)

Before assigning new work, this run audited the canonical repository and live site instead of starting from the orchestrator template's generic SaaS assumptions:

- Live positioning: *"Know what shapes the shortlist before sales gets the call"* — a fixed-scope **$12,500 AI Buyer Intelligence Sprint** for high-ACV B2B companies facing a category, launch, pipeline, or competitive trigger, entered through a free Category Presence Brief ([MARKET-LAUNCH.md](https://github.com/virtualmase/tired-of-this-site-arm-agency-dot-com/blob/main/MARKET-LAUNCH.md)).
- Live resource pages already cover buyer-intent-vs-buyer-intelligence, enterprise buying-committee intelligence, enterprise proof readiness, category-narrative intelligence, and a signal-orchestration guide — this is real content, not a gap.
- Backend scaffold (Base44): `Lead → Opportunity → Client → Campaign → Deliverable`, plus legacy `SignalAudit`/`ShareOfModel` entities from the prior GEO-era offer ([BACKEND-PIPELINE.md](https://github.com/virtualmase/tired-of-this-site-arm-agency-dot-com/blob/main/BACKEND-PIPELINE.md)).
- Governance: Portfolio OS holds this asset inside the AURE/ARM/ARISE consolidation cluster, caps cluster investment at **$1,000**, and reserves owner (Mason) attention for A5 decisions only — irreversible exceptions, brand safety, or >$1,000 exposure ([EXECUTIVE-BRIEF.md](https://github.com/virtualmase/portfolio-os/blob/main/EXECUTIVE-BRIEF.md)).
- Open launch gates already logged and **not yet closed**: legal contracting entity unconfirmed, Base44 notification delivery unverified, backend rate limiting/CORS unavailable, named source attribution unverified on a real Brief.

The directives below are scoped to close real gaps against this state — not to re-litigate work that already exists, and not to import the generic competitor set (Gong/Clari/6sense/Demandbase) or CFO-pricing-tier assumptions from the orchestrator template without checking they still fit. They mostly do fit, with adjustments noted per agent.

## 1. AGENT_STRATEGY — positioning & wedge

**Gap found:** the site argues *against* commodity intent data in the abstract but does not name the incumbent category (Gong, Clari, 6sense, Demandbase) anywhere public. That's a legal/brand-safety call, not a drafting gap — see Section 6.

**Directive (safe to ship now — internal battlecard, not public copy):**

| Axis | Incumbent pattern (Gong/Clari/6sense/Demandbase) | ARM wedge |
|---|---|---|
| Scoring | Opaque composite "intent" or "health" score | Every signal keeps its source, date, and confidence — no unexplained score |
| Unit of analysis | Account or single contact | The buying group itself — modeled as 13–17 stakeholders with distinct questions per role |
| Delivery | Always-on dashboard, seat-priced | Fixed-scope $12,500 Sprint, decision record, no new dashboard to maintain |
| Deployment | CRM cleanup + data engineering project | Human-reviewed intake (Category Presence Brief) → scoped Sprint, no CRM migration |
| Evidence standard | Third-party inferred intent | Approved first-party/proprietary evidence preferred; third-party signal treated as context, never certainty |

**Pricing:** already fixed at $12,500/Sprint. Recommend holding this single price point through the controlled launch — do not introduce CFO-facing tiers yet; that's premature ahead of any signed client.

## 2. AGENT_PRODUCT — architecture & integration

**Gap found:** the orchestrator template assumes an always-on "auto-capture" SaaS module (email/calendar/call ingestion). ARM's actual current product is a human-delivered Sprint, not a live capture system. Building the auto-capture module now would violate the portfolio's own "no new surface without proven demand" rule.

**Directive:**
- Do **not** start SaaS/auto-capture engineering this phase.
- Treat the Sprint's core artifact — the **Buyer Conversation Map** (already on the live homepage) — as the templatable unit. Phase 2 candidate: turn the manually-produced map into a repeatable internal template (not a customer-facing app) once 2–3 Sprints have shipped and the format is validated.
- Lightweight integration plan for *intake only* (the one 30-day-deployable piece): confirm Base44 notification delivery so a submitted Brief reaches a human within a defined SLA, and close the backend rate-limiting/CORS gap already flagged in `BACKEND-PIPELINE.md`. These two items block the funnel today and are genuinely 30-day-fixable without a CRM migration.

## 3. AGENT_OUTREACH — GTM execution

**Gap found:** the repository's own `SALES-CAMPAIGN-ROADMAP.md` is explicitly marked "archived legacy, not approved." There is currently no live outbound sequence.

**Directive — draft sequence for a small, owner-approved list only** (per `MARKET-LAUNCH.md`'s Days 1–3 rule: no purchased or scraped bulk lists):

1. **Email 1 (trigger-based, category/launch/pipeline signal observed):**
   Subject: "What {{Company}}'s buying committee is actually asking right now"
   Body: name the observed trigger (new category entry, competitive RFP, missed-target quarter) → one line on "Silent Deal Decay" (deals that go quiet in committee, not in the CRM) → CTA: free Category Presence Brief.
2. **Email 2 (proof-of-method, sent 4–5 days later if no reply):**
   Share the Buyer Conversation Map concept as a sample artifact — "shortlist" persona/stage/question structure — no client names, since no case studies exist yet.
3. **Email 3 (break-up, explainability angle):**
   Contrast an unexplained "hot lead" score with a sourced, dated, confidence-tagged buying-group record. CTA restated once.

**Targeting:** newly appointed CROs/VPs RevOps within their first 90 days, and revenue teams with a public missed-target signal — matches the orchestrator template's targeting logic and ARM's existing "trigger inside 180 days" launch thesis.

**Constraint:** hold all sends for Mason's list approval before dispatch — this framework produces drafts only, per the controlled-launch cadence already in force.

## 4. AGENT_CONTENT — thought leadership

**Gap found:** strong resource-page foundation already exists; missing pieces are (a) a synthesizing whitepaper and (b) comparison content.

**Directive:**
- Outline (not publish) a short whitepaper: *"Glass-Box Revenue Intelligence: Why Explainable Beats Black-Box for the Buying Group"* — synthesizes the five existing resource pages into one downloadable asset for the outbound sequence above.
- Do **not** publish a named-competitor comparison page this phase. Comparing against Gong/Clari/6sense/Demandbase by name is a public claim with disparagement and accuracy risk — route through Section 6 as an A5 decision before any draft goes live.
- Case studies: cannot be produced yet — zero signed clients. Build the template now (fields: trigger, buying-group size, decision made, time-to-decision) so the first real Sprint can populate it without inventing evidence.

## 5. AGENT_FINANCE — ops & procurement

**Gap found:** this is the largest real gap. No legal contracting entity is confirmed, no security/procurement packet exists, and there is no CAC/ROI framing tying the $12,500 Sprint to the cost of a slipped enterprise deal.

**Directive:**
- ROI framing for the Sprint pitch: position $12,500 against the cost of *one* late-stage enterprise deal slipping a quarter — not against a CFO software-consolidation budget line (ARM isn't selling a seat-priced tool yet).
- Security/procurement one-pager: data handling for Brief submissions (already documented — no PII in campaign params), sourcing standard (first-party preferred), and a placeholder SOC 2/GDPR statement that says "not yet certified" rather than implying compliance that doesn't exist. Overclaiming here is a Portfolio OS hard-gate violation.
- **Escalate, don't resolve:** the legal contracting entity used on invoices/scopes is explicitly an owner decision already logged as blocking paid work. This framework does not choose one.

## 6. Decisions that need Mason directly (A5 — not resolved by this framework)

1. Which legal entity appears on Sprint scopes and invoices (blocks all paid work today).
2. Approval to draft (not publish) a named-competitor comparison page.
3. The specific 5–15 accounts approved for the first small-batch outbound send.
4. Whether to stand up a Stripe product/payment link for the Sprint now — held off in this pass because the contracting entity above isn't confirmed yet, and Base44 already owns the Lead→Client pipeline (no duplicate CRM object was created in HubSpot for the same reason).

## 7. What this run deliberately did not build, and why

- No HubSpot pipeline — Base44 already holds canonical Lead/Opportunity/Client records; a parallel CRM would violate the portfolio's one-canonical-home rule.
- No Stripe objects — legal entity unconfirmed (see Section 6.1).
- No mass outbound send — only a draft sequence; sending requires the owner-approved list in Section 6.3.
- No public competitor-comparison content — brand-safety/A5 gate, not a drafting gap.
