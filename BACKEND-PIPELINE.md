# ARM Agency — Backend Pipeline & Operations Scaffold

**Version:** 1.2
**Last updated:** 2026-08-23
**Status:** External Base44 scaffold plus repo-owned case contract; public Lead intake verified, production adapters pending owner decisions

> **Current-offer boundary:** The public site offers a no-cost Category Presence Brief followed, when fit and scope are confirmed, by a $12,500 AI Buyer Intelligence Sprint. The Base44 schema and function source are not stored in this repository and still use legacy enum and entity names. Those names below describe the external compatibility layer; they are not approved public product names.

---

## 1. Architecture Overview

The documented backend scaffold covers lead intake, a legacy sales pipeline, client and campaign records, deliverables, and observation tracking. A controlled public-form submission on 2026-08-22 verified that `intakeLead()` created a Lead. Notification delivery, automatic creation of a secondary audit record, and a Sprint-specific `closeDeal()` template could not be verified from this repository.

```
Lead → Opportunity → Client → Campaign → Deliverables
  │         │           │         │           │
  │         │           │         │           └── updateDeliverable() — status, assignee, completion
  │         │           │         └── auto-scaffolded by closeDeal() based on service type
  │         │           └── closeDeal() — converts opp to client + scaffolds campaign + deliverables
  │         └── qualifyLead() — promotes lead, creates opportunity with deal value
  └── intakeLead() — creates lead + auto-creates SignalAudit if relevant

Parallel tracking:
  SignalAudit → 5-dimension baseline scoring (entry point for every engagement)
  ShareOfModel → weekly engine-by-engine measurement (ongoing KPI)
```

---

## 2. Entity Schemas

### 2.1 Lead
The entry point. Every inbound inquiry — website form, referral, outbound, social.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Contact name (required) |
| email | string | Contact email (required) |
| company | string | Company or brand |
| source | enum | website, referral, outbound, social, other |
| service_interest | enum | signal_audit, geo, reputation, enterprise_visibility, due_diligence, agentic_trust |
| notes | string | Initial inquiry details |
| status | enum | new, contacted, qualified, disqualified (required) |
| priority | enum | low, medium, high, urgent |

**Pipeline behavior:** When `service_interest` is signal_audit, enterprise_visibility, or due_diligence, `intakeLead()` auto-creates a SignalAudit record in "requested" status.

### 2.2 Opportunity
A qualified lead with deal value and a sales stage. Created by `qualifyLead()`.

| Field | Type | Description |
|-------|------|-------------|
| lead_id | string | Reference to originating Lead |
| company | string | Company name (required) |
| contact_name | string | Primary contact (required) |
| contact_email | string | Contact email (required) |
| deal_value | number | Estimated deal value in USD |
| service_type | enum | signal_audit, geo_repair, reputation_management, enterprise_visibility, due_diligence, agentic_trust, retainer |
| stage | enum | discovery, audit_scheduled, audit_complete, proposal_sent, negotiation, closed_won, closed_lost (required) |
| probability | number | Win probability 0-100 |
| expected_close_date | string | ISO date |
| notes | string | Deal context |

**Sales stages flow:**
```
discovery → audit_scheduled → audit_complete → proposal_sent → negotiation → closed_won
                                                                → closed_lost
```

### 2.3 Client
A signed client. Created by `closeDeal()` when an opportunity moves to closed_won.

| Field | Type | Description |
|-------|------|-------------|
| opportunity_id | string | Reference to originating Opportunity |
| company | string | Client company (required) |
| contact_name | string | Primary contact (required) |
| contact_email | string | Primary email (required) |
| plan | enum | signal_audit, quarterly, retainer, project, enterprise |
| deal_value | number | Contract value in USD |
| start_date | string | ISO date |
| end_date | string | ISO date (if applicable) |
| status | enum | onboarding, active, paused, completed, churned (required) |
| entity_url | string | Client's primary website |
| notes | string | Client context |

**Client lifecycle:**
```
onboarding → active → paused → completed
                   → churned
```

### 2.4 Campaign
A body of work for a client. Auto-created by `closeDeal()` with type matching the opportunity's service type.

| Field | Type | Description |
|-------|------|-------------|
| client_id | string | Reference to Client (required) |
| name | string | Campaign name (required) |
| type | enum | geo_optimization, reputation_repair, visibility_audit, due_diligence, agentic_trust, ongoing_retainer (required) |
| status | enum | planning, active, paused, completed, cancelled (required) |
| start_date | string | ISO date |
| end_date | string | Target end date |
| objectives | string | Success criteria |
| budget_hours | number | Estimated hours |
| actual_hours | number | Hours worked |
| query_cluster | string | Target query cluster (e.g., "who are the leading GEO providers") |
| target_engines | array | chatgpt, claude, gemini, perplexity |

### 2.5 Deliverable
Individual work items within a campaign. Auto-scaffolded by `closeDeal()` based on campaign type.

| Field | Type | Description |
|-------|------|-------------|
| campaign_id | string | Reference to Campaign (required) |
| title | string | Deliverable name (required) |
| type | enum | schema_deployment, entity_audit, content_creation, authority_mapping, som_measurement, report, qa_review, client_meeting, other (required) |
| status | enum | not_started, in_progress, review, completed, blocked (required) |
| assignee | string | Who is responsible |
| due_date | string | ISO date |
| completed_date | string | ISO date |
| priority | enum | low, medium, high, critical |
| notes | string | Context |
| dependency | string | ID of deliverable this depends on |

### 2.6 SignalAudit
The 5-dimension baseline audit. Entry point for every engagement.

| Field | Type | Description |
|-------|------|-------------|
| client_id | string | Reference to Client or Lead |
| company | string | Company audited (required) |
| entity_url | string | Primary URL audited (required) |
| audit_date | string | ISO date |
| entity_declaration_score | number | 0-100 |
| eeat_score | number | 0-100 |
| content_structure_score | number | 0-100 |
| crawler_infra_score | number | 0-100 |
| som_score | number | 0-100 |
| overall_score | number | Weighted 0-100 |
| findings | string | Key findings + recommendations |
| query_cluster | string | Query cluster used |
| engine_results | string | JSON snapshot of engine-by-engine results |
| status | enum | requested, in_progress, complete, delivered (required) |

**The 5 dimensions (ARM Agency's GEO pillars):**
1. Entity Declaration — schema completeness, structured data
2. E-E-A-T Signal — verifiable expertise, authority, trustworthiness
3. Content Structure — citation readiness, parseability
4. Crawler Infrastructure — robots.txt, sitemap, crawl accessibility
5. Share of Model — baseline SoM across 4 engines

### 2.7 ShareOfModel
Weekly tracking record. The ongoing KPI that proves the work is working.

| Field | Type | Description |
|-------|------|-------------|
| client_id | string | Reference to Client (required) |
| campaign_id | string | Reference to Campaign |
| week_of | string | ISO date for week measured (required) |
| chatgpt_presence | boolean | Surface in ChatGPT? |
| chatgpt_citation | boolean | Cited by ChatGPT? |
| chatgpt_sentiment | enum | positive, neutral, negative, absent |
| perplexity_presence | boolean | Surface in Perplexity? |
| perplexity_sentiment | enum | positive, neutral, negative, absent |
| gemini_presence | boolean | Surface in Gemini? |
| gemini_sentiment | enum | positive, neutral, negative, absent |
| claude_presence | boolean | Surface in Claude? |
| claude_sentiment | enum | positive, neutral, negative, absent |
| som_percentage | number | Presence across all engines / total queries |
| delta_vs_baseline | number | Change from baseline score |
| notes | string | Weekly observations |

---

## 3. Backend Functions

Prior documentation describes these functions as Base44 HTTP endpoints callable with JSON. Only `intakeLead()` has been exercised through the current public site. Treat the other contracts and side effects as a legacy implementation description until the external Base44 source and configuration are reviewed.

### 3.1 intakeLead
**Trigger:** Website form submission, manual lead entry, API call from referral sources.  
**Input:** name, email, company, source, service_interest, notes, priority  
**Output:** lead_id, auto-created SignalAudit if applicable  
**Side effects:** Creates Lead record; if service_interest matches audit-eligible types, auto-creates SignalAudit in "requested" status.

### 3.2 qualifyLead
**Trigger:** Manual qualification after initial contact.  
**Input:** lead_id, deal_value, service_type, expected_close_date, notes  
**Output:** opportunity_id  
**Side effects:** Updates Lead status to "qualified"; creates Opportunity in "discovery" stage with 25% probability.

### 3.3 closeDeal
**Trigger:** Opportunity moves to closed_won.  
**Input:** opportunity_id, plan, start_date, end_date, entity_url  
**Output:** client_id, campaign_id, deliverable_count  
**Side effects:** 
- Updates Opportunity to closed_won with 100% probability
- Creates Client in "onboarding" status
- Auto-scaffolds Campaign with type matching service type
- Auto-scaffolds 4-6 Deliverables based on campaign type template

**Deliverable templates by campaign type:**

| Campaign Type | Deliverables Auto-Scaffolded |
|---------------|------------------------------|
| geo_optimization | Entity schema deployment, sameAs authority mapping, Crawler infra check, SoM baseline, Content structure review, Initial findings report |
| reputation_repair | Query-cluster audit, Entity schema deployment, Authority node verification, Citation-ready content, SoM baseline, Correction roadmap |
| visibility_audit | 5-dimension audit, SoM baseline, Gap analysis report, Prioritized recommendations |
| due_diligence | Pre-transaction audit, Entity resolution check, SoM baseline, Risk assessment report |
| agentic_trust | Mandate Chain design, Attestation infrastructure audit, Truth Ledger setup, Trust signal architecture |
| ongoing_retainer | Weekly SoM tracking, Monthly schema maintenance, Monthly performance report, Quarterly strategy review |

### 3.4 updateDeliverable
**Trigger:** Status changes during campaign execution.  
**Input:** deliverable_id, status, assignee, notes, due_date, completed_date  
**Output:** Updated deliverable record  
**Side effects:** If status set to "completed" without completed_date, auto-stamps with current ISO timestamp.

### 3.5 logShareOfModel
**Trigger:** Weekly SoM measurement run.  
**Input:** client_id, campaign_id, week_of, chatgpt{present,cited,sentiment}, perplexity{present,sentiment}, gemini{present,sentiment}, claude{present,sentiment}, som_percentage, delta_vs_baseline, notes  
**Output:** record_id, som_percentage, delta

### 3.6 getPipelineDashboard
**Trigger:** Dashboard load, reporting, pipeline review.  
**Input:** none  
**Output:** Full pipeline metrics — lead counts by status, opportunity counts by stage, pipeline value, win rate, active clients, active campaigns, deliverable counts by status, total revenue.

---

## 4. Pipeline Flow

### 4.1 Sales Pipeline
```
1. Lead intake (intakeLead)
   ├── Website form → Lead created with status "new"
   └── If audit-eligible service → SignalAudit auto-created as "requested"

2. Initial contact (manual)
   └── Lead status → "contacted"

3. Qualification (qualifyLead)
   ├── Lead status → "qualified"
   └── Opportunity created in "discovery" stage, 25% probability

4. Audit scheduled (manual)
   └── Opportunity stage → "audit_scheduled"

5. Audit complete (manual)
   ├── SignalAudit status → "complete"
   └── Opportunity stage → "audit_complete", probability → 40%

6. Proposal sent (manual)
   └── Opportunity stage → "proposal_sent", probability → 60%

7. Negotiation (manual)
   └── Opportunity stage → "negotiation", probability → 80%

8. Close — Won (closeDeal)
   ├── Opportunity stage → "closed_won", probability → 100%
   ├── Client created in "onboarding" status
   ├── Campaign auto-scaffolded with matching type
   └── Deliverables auto-scaffolded from template (4-6 items)

9. Close — Lost (manual)
   └── Opportunity stage → "closed_lost"
```

### 4.2 Fulfillment Pipeline
```
1. Client onboarding
   ├── Client status: "onboarding" → "active"
   ├── Campaign status: "planning" → "active"
   └── Deliverables: all start as "not_started"

2. Execution
   ├── Deliverables → "in_progress" as work begins (updateDeliverable)
   ├── Dependencies tracked via dependency field
   └── Blocked items flagged for escalation

3. Quality assurance
   └── Deliverables → "review" before client delivery

4. Delivery
   ├── Deliverables → "completed" (auto-stamps completed_date)
   ├── SignalAudit findings delivered to client
   └── Share of Model baseline established

5. Ongoing tracking
   ├── Weekly SoM logs (logShareOfModel)
   ├── delta_vs_baseline tracked over time
   └── Monthly reports compiled from SoM trend data
```

### 4.3 Retainer Lifecycle
```
1. Initial engagement → Campaign type: visibility_audit or geo_optimization
2. Baseline established → SignalAudit complete, SoM baseline logged
3. Ongoing → Campaign type: ongoing_retainer
   ├── Weekly SoM tracking
   ├── Monthly schema maintenance
   ├── Monthly performance report
   └── Quarterly strategy review
4. Renewal or completion
   ├── Client status → "active" (renewed)
   └── Client status → "completed" (ended)
```

---

## 5. Integration Points

| Integration | Function | Status |
|-------------|----------|--------|
| Website form (arm-agency.com) | intakeLead | Connected; Lead creation verified 2026-08-22; notification pending confirmation |
| Telegram bot (@ops_1337_bot) | Pipeline notifications | Legacy documentation; not verified in this repository |
| Redis (Upstash) | Caching, state | Legacy documentation; not verified in this repository |
| Make.com MCP | Workflow orchestration | Legacy documentation; not verified in this repository |
| Notion | Content calendars, trend logs | Legacy documentation; not verified in this repository |
| Google Drive | Report exports | Legacy documentation; not verified in this repository |
| Apollo.io | Lead enrichment | Legacy documentation; not verified in this repository |
| GitHub | Repo versioning | Repository remote verified 2026-08-22 |

---

## 6. Current Public Offer → Legacy Backend Mapping

| Public step | Verified request mapping | Verified result | Remaining decision |
|-------------|--------------------------|-----------------|--------------------|
| Category Presence Brief | `intakeLead()` with `service_interest: enterprise_visibility`; notes begin `Requested service: AI Buyer Intelligence Sprint / Category Presence Brief` | Lead creation returned HTTP 200 and a `lead_id` on 2026-08-22 | Confirm notification delivery and whether a secondary record is created |
| Human fit review | Manual review of buyer, category, trigger, competitors, decision window, ACV, and submitted contact context | No repository-controlled automation | Name the operator, response owner, response-time target, and qualification record |
| AI Buyer Intelligence Sprint | Written scope before private collection; public price is $12,500 with 60/40 payment timing | Public scope and terms are live | Before the first paid Sprint, explicitly map the legacy Opportunity, Client, Campaign, and Deliverable enums to the four Sprint deliverables |

Do not infer a paid-Sprint mapping from `enterprise_visibility`, `visibility_audit`, or any other legacy enum. Until the external function configuration is reviewed, process a qualified Sprint manually under written scope and record the four approved deliverables without promising an automated scaffold.

The repo-owned operating contract in [`operations/case-contract.json`](./operations/case-contract.json)
now defines the current offer independently of those legacy enums. It provides a
sanitized event envelope, state transitions, exact 60/40 payment order, four-
deliverable QA gate, one-time artifact-bound approvals, and adoption/outcome
events. It is an executable compatibility target, not evidence that Base44 or a
payment system is connected to it. See [`operations/README.md`](./operations/README.md).

### 6.1 Legacy Service Type → Campaign → Deliverable Mapping

The following matrix is retained as a snapshot of the previously documented `closeDeal()` contract. It has not been verified against current external function source and does not define the public offer.

| Service Type | Campaign Type | Deliverable Count | Key Deliverables |
|-------------|---------------|-------------------|------------------|
| signal_audit | visibility_audit | 4 | 5-dimension audit, SoM baseline, gap analysis, recommendations |
| geo_repair | geo_optimization | 6 | Schema deployment, authority mapping, crawler check, SoM baseline, content review, findings report |
| reputation_management | reputation_repair | 6 | Query-cluster audit, schema deployment, authority verification, citation content, SoM baseline, correction roadmap |
| enterprise_visibility | visibility_audit | 4 | 5-dimension audit, SoM baseline, gap analysis, recommendations |
| due_diligence | due_diligence | 4 | Pre-transaction audit, entity resolution, SoM baseline, risk assessment |
| agentic_trust | agentic_trust | 4 | Mandate Chain design, attestation audit, Truth Ledger setup, trust signal architecture |
| retainer | ongoing_retainer | 4 | Weekly SoM, monthly schema, monthly report, quarterly review |
