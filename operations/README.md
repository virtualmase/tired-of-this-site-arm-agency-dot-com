# ARM Operating Control Plane

**Status:** Executable contract ready; external adapters not connected  
**Updated:** 2026-08-23

This directory defines a measurable, append-only case lifecycle from Category
Presence Brief through fit, scope, payment, Sprint delivery, action adoption, and
learning. It does not replace Base44, a payment processor, private client storage,
or human judgment. It gives those systems one testable operating contract.

## What is implemented

| Artifact | Purpose |
| --- | --- |
| `case-contract.json` | Machine-readable stages, events, commercial terms, deliverables, authority boundaries, and required fields |
| `../scripts/case-ledger.mjs` | Dependency-free JSONL validator and sanitized case summarizer |
| `../scripts/portfolio-metrics.mjs` | Cross-case count, timing, approval, evidence, and adoption rollup |
| `../scripts/check-case-ledger.mjs` | Adversarial contract tests for approvals, privacy, payment order, delivery completeness, and append-only ordering |
| `examples/qualified-sprint.jsonl` | Synthetic complete path with no person or company data |
| `examples/declined-brief.jsonl` | Synthetic human-declined path |

The examples are tests, not customers, proof, revenue, or operating results.

## System boundaries

| Concern | Canonical system | Ledger treatment |
| --- | --- | --- |
| Personal lead and company details | Base44 Lead | Omit; use a sanitized ARM case ID |
| Written scope and acceptance | Owner-approved document system | Store only an artifact digest and event time |
| Payments | Approved private payment system | Store installment, amount, currency, event time, and an opaque record digest |
| Client evidence and deliverables | Approved private client workspace | Store evidence/action IDs, classifications, digests, and lifecycle events only |
| Public site and operating contract | GitHub repository | Version the contract and validators, never live case data |
| Approval decision | Identified human in the approved operating system | Record the decision, role, scope, expiration, and artifact binding |

Do not commit a real case ledger. Production events belong in an access-controlled
operating store with retention, backup, access logging, and deletion procedures
approved by the owner.

## Event envelope

Every line is one JSON event:

```json
{
  "schema_version": 1,
  "event_id": "evt_example_001",
  "case_id": "arm_case_opaque_id",
  "occurred_at": "2026-08-23T16:00:00Z",
  "recorded_at": "2026-08-23T16:00:01Z",
  "actor": {"type": "agent", "role": "scope_drafter"},
  "type": "scope.drafted",
  "from_stage": "scope_preparation",
  "to_stage": "awaiting_scope_approval",
  "data": {
    "artifact_digest": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  }
}
```

Events are ordered by both occurrence and record time. IDs cannot be reused. A
consumer folds the events in order to derive current state; it does not overwrite
history. Corrections should be modeled as a future contract version and explicit
correction event, not by silently rewriting an accepted production ledger.

The JSONL format and hash checks are validation controls, not a tamper-proof
store. A production ledger must enforce append permissions, backups, retention,
and access logging outside this repository.

## Human authorization model

The contract recognizes these consequential boundaries:

- claims;
- publication;
- external communication;
- CRM mutation;
- contracts and scope;
- payments;
- private-data access and sharing;
- deletion.

An agent-run action such as issuing a scope, requesting either payment, or sending
deliverables requires a prior `approval.requested` and human
`approval.decided`. The approval is:

- limited to a named action and boundary set;
- bound to the SHA-256 digest of the exact artifact;
- time-limited;
- single-use;
- invalid after rejection, alteration, reuse, or expiry.

Fit decisions, private collection authorization, client action acceptance, and
case closure are human-only events. Confirmation from a payment system records an
external fact; it does not grant permission to request or spend money.

## Ordered lifecycle

```text
Brief received
  → human fit review
    → declined → closed
    → proceed → scope draft → human approval → scope issued
      → written acceptance → approved 60% request → booking confirmed
        → private collection authorized → evidence registered → delivery
          → QA pass → approved 40% request → final payment confirmed
            → human-approved delivery → adoption review → outcomes → closed
```

The contract rejects delivery unless all four approved Sprint deliverables pass QA
and the final installment is confirmed. Local example payment events encode the
approved $7,500 booking and $5,000 final installments; they do not assert that any
real payment occurred.

## Validation

From the repository root:

```bash
node scripts/check-case-ledger.mjs
node scripts/case-ledger.mjs validate operations/examples/qualified-sprint.jsonl
node scripts/case-ledger.mjs summarize operations/examples/qualified-sprint.jsonl
node scripts/portfolio-metrics.mjs operations/examples/qualified-sprint.jsonl operations/examples/declined-brief.jsonl
```

The case summary exposes case-local funnel booleans, elapsed hours, approval
counts, confirmed-payment amount, registered evidence, and action-adoption counts.
The portfolio summary combines sanitized cases into counts, reason distributions,
and timing observations. Neither script produces public conversion, revenue, or
performance claims.

## Adapter rule

An adapter may translate a verified external event into this envelope only after
the owner approves its access and mutation authority. Each adapter must:

1. read from the canonical system rather than create a parallel CRM;
2. emit sanitized IDs and digests, not copied private payloads;
3. be idempotent by source event plus case ID;
4. preserve the source timestamp and add a recording timestamp;
5. fail closed when required evidence or approval is missing;
6. expose retries and dead letters rather than guessing;
7. pass this validator before an event enters the operating ledger.

The first recommended adapter is a read-only/manual Base44 Lead-to-
`brief.received` mapper. Notification delivery, Base44 function source, legal
contracting entity, private payment system, and production ledger host remain
owner decisions.

## Metrics this enables

Across an approved private store, event timestamps can support:

- Brief-to-review and review-to-decision time;
- fit decision counts and reason-code distribution;
- scope issue and acceptance counts;
- acceptance-to-booking time;
- booked-to-delivery time;
- pending, rejected, expired, and consumed approvals;
- evidence registered by source class and freshness status;
- actions registered, owner-accepted, and supported by outcome evidence.

Targets are intentionally absent until the owner selects operating service levels
and a real baseline exists. Counts from synthetic examples must never be combined
with production metrics.
