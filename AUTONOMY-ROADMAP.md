# ARM Agency — Autonomous Operations Roadmap

**Updated:** 2026-08-23  
**Objective:** Operate the full business loop with autonomous preparation and
coordination while humans retain authority over claims, publication, payments,
private data, contracts, and other consequential decisions.

## Current evidence

| Capability | Current state | Authoritative evidence | What is still missing |
| --- | --- | --- | --- |
| Attract relevant demand | Draft experiment system ready, activation manual | `operations/demand-experiment-contract.json` binds active routes, non-personal attribution, exact artifacts, count-only measures, reviews, and human authority; adversarial checks pass | Approved exact message/publication, channel execution, production observations, and enough real evidence to select channels |
| Capture demand | Partial | Production Category Presence Brief created a Base44 Lead in a controlled test; signed-notification, canonical-read, HMAC ID, idempotency, privacy, and dead-letter boundaries pass `scripts/check-base44-brief-ingestion.mjs` | Verified notification delivery/signing, named daily owner, Base44 entity read access, production key custody, and durable ledger implementation |
| Qualify demand | Contract ready, operation manual | `operations/case-contract.json` requires a human fit decision and reason codes | Approved private review queue, response target, and production event store |
| Scope and book work | Live catalog ready, invoicing not connected | Stripe live product and immutable $7,500/$5,000 Prices match `operations/stripe-catalog.json`; artifact-bound scope, written acceptance, request, and confirmation order pass contract tests | Accepted-scope source, private invoice adapter, signed webhook consumer, and production event store |
| Produce evidence-led work | Package contract and prompt workflow ready | `operations/deliverable-contract.json` enforces the four deliverables, research conditions, evidence/action references, counts, and digest binding; adversarial checks pass | Approved private client workspace and a real attended Sprint proving evidence relevance and human QA |
| Coordinate owner actions | Queue and contract ready, not connected | `scripts/approval-queue.mjs` derives sanitized pending/ready/expired approvals; actions retain owner, dependency, acceptance test, measure, and review date | Authenticated approval UI, reminders, escalation ownership, and controlled mutations |
| Run customer operations | Due-work queue and lifecycle ready, not connected | `scripts/customer-ops-queue.mjs` derives delivery, evidence, action, and learning tasks without sending or mutating | Onboarding/access systems, authenticated reminders, communication, billing, and retention integrations |
| Learn from outcomes | Executable on sanitized ledgers | Portfolio metrics plus human-only evidence and recurring learning-review events pass lifecycle tests | Production observations, owner-selected service levels, and an attended recurring review |
| Engineering reproducibility | Prompted and contract-tested | Repository validators and `DOCKER-GORDON-PROMPTS.md` | Optional approved local QA containers; Docker is not required for production hosting |

No row above is evidence of a customer result, earned revenue, production
automation, or improved third-party model output.

## Authority architecture

```text
Agent prepares evidence or exact action
  → validator checks state, privacy, artifact digest, and prerequisites
    → human approves or rejects a named action and boundary set
      → authorized adapter performs that one action
        → result event records external evidence
          → portfolio rollup exposes operational learning
```

An approval expires, binds to one artifact digest, and can be consumed once. An
agent cannot broaden it to a new recipient, claim, amount, file, or channel.

## Dependency-ordered implementation

### 1. Confirm the operating owners and systems

Owner decisions required before connecting production data:

| Decision | Why it blocks automation |
| --- | --- |
| Legal contracting and invoicing identity | Stripe is configured for Autonomous Resource Management LLC; the written scope template must use the same approved identity |
| Base44 review owner and response target | A notification without accountable handling is not an operating system |
| Base44 read access and notification route | The repository cannot verify or poll new Leads today |
| Private ledger host, access roles, retention, backup, and deletion policy | Real case events must not live in GitHub |
| Document/acceptance system | Scope acceptance needs durable evidence and signer authority |
| Private payment adapter and event consumer | Live product/Prices exist; invoice creation and signed confirmation events are not connected yet |
| Client evidence workspace and permitted-use policy | Delivery automation cannot copy confidential evidence into an unapproved tool |
| Claim/publication approver | Public output needs one named accountable authority |

### 2. Connect Base44 read-only

Build the first production adapter only after access is approved:

1. receive a verified notification or poll a narrow new-Lead view;
2. assign an opaque ARM case ID;
3. translate allowed classifications into `brief.received`;
4. keep names, emails, company details, notes, and payloads in Base44;
5. validate before append;
6. expose retries and a dead-letter queue;
7. alert the named human reviewer without changing the Lead.

Success evidence: a controlled owner-authorized test creates exactly one sanitized
event, no personal fields cross the boundary, a retry does not duplicate it, and
the reviewer can trace the opaque case back in the canonical system.

### 3. Establish the private ledger and approval inbox

Use the contract as the write API. Add authenticated human identity, append-only
permissions, access logs, backups, retention, and recovery tests. Present approvals
with exact action, destination class, boundary set, artifact digest, expiry, data
affected, and rollback. Reject changed, expired, reused, or out-of-order actions.

Success evidence: adversarial integration tests reproduce every repository test
against the chosen store, plus concurrent-write, authentication, recovery, and
access-revocation tests.

### 4. Run one attended Brief-to-scope path

Use Perplexity Computer or another approved research tool for preparation only.
Keep the human fit decision, scope approval, and communication in the explicit
gate. Record reason codes and cycle time. Do not request payment yet.

Success evidence: one owner-authorized case reaches either `declined` or
`scope_issued` with a complete audit trail and no parallel CRM.

### 5. Connect private acceptance and payment events

After the entity and systems are approved, create narrowly scoped adapters for
written acceptance, owner-approved booking request, booking confirmation,
owner-approved final request, and final confirmation. Never give an agent spending
authority or public checkout access.

Success evidence: sandbox tests prove exact $7,500/$5,000 order, idempotency,
refund/error handling, authorization expiry, and no deliverable release before
final confirmation. A live charge is a separate owner decision.

### 6. Prove the delivery and adoption loop

Run one attended Sprint in the approved private workspace. Bind every observation
to an evidence ID and every action to an owner, dependency, acceptance test,
measure, and review date. Human QA and delivery approval remain mandatory.

Success evidence: all four deliverables pass the contract; delivery evidence is
recorded; owner acceptance or rejection is explicit; outcome evidence is observed
without converting it into a public claim.

### 7. Add recurring internal learning

Run portfolio metrics on the private ledger at an owner-selected cadence. Review
counts and elapsed time before choosing service levels. Use decline reasons,
approval friction, evidence gaps, and action outcomes to propose one reversible
operating change at a time.

Success evidence: each change has a hypothesis, owner, baseline window,
acceptance test, stop condition, and post-change review. Publication of any metric
requires separate claim approval.

## Verification commands

```bash
node scripts/check-launch-readiness.mjs
node scripts/check-audit-contract.mjs
node scripts/check-image-seo.mjs
node scripts/check-case-ledger.mjs
node scripts/check-brief-event-candidate.mjs
node scripts/check-base44-brief-ingestion.mjs
node scripts/check-stripe-catalog.mjs
node scripts/check-deliverable-package.mjs
node scripts/check-customer-ops-queue.mjs
node scripts/check-demand-experiment.mjs
node scripts/approval-queue.mjs --as-of 2026-08-02T16:30:00Z operations/examples/qualified-sprint.jsonl
node scripts/case-ledger.mjs validate operations/examples/qualified-sprint.jsonl
node scripts/portfolio-metrics.mjs operations/examples/qualified-sprint.jsonl operations/examples/declined-brief.jsonl
```

These commands verify repository contracts and synthetic paths. They do not prove
that an external adapter, notification, customer operation, or payment is live.

## Next executable slice

The Base44 adapter core now covers signed notification verification, a canonical
Lead read boundary, opaque HMAC identifiers, atomic append semantics, duplicate
handling, and sanitized dead letters. The highest-leverage next build is the two
external implementations: the owner-authorized Base44 entity reader/notifier and
an access-controlled transactional ledger store. Connection remains blocked by
the Base44 entity access route and notification configuration, production HMAC
key custody, named review owner, and private-store deployment. Until those are
authorized, manual Lead review remains the correct production control.
