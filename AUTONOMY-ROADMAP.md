# ARM Agency — Autonomous Operations Roadmap

**Updated:** 2026-08-23  
**Objective:** Operate the full business loop with autonomous preparation and
coordination while humans retain authority over claims, publication, payments,
private data, contracts, and other consequential decisions.

## Current evidence

| Capability | Current state | Authoritative evidence | What is still missing |
| --- | --- | --- | --- |
| Attract relevant demand | Partial | Production site, active resource silo, image sitemap, Vercel analytics checks, `MARKET-LAUNCH.md` | A measured content/outreach cadence and enough real observations to select channels |
| Capture demand | Partial | Production Category Presence Brief created a Base44 Lead in a controlled test; `BACKEND-PIPELINE.md` | Verified notification delivery, named daily owner, and read-only event adapter |
| Qualify demand | Contract ready, operation manual | `operations/case-contract.json` requires a human fit decision and reason codes | Approved private review queue, response target, and production event store |
| Scope and book work | Contract ready, not connected | Artifact-bound scope approval, written acceptance, approved $7,500 request, and confirmation order pass contract tests | Legal contracting entity, approved document/payment systems, and adapters |
| Produce evidence-led work | Contract and prompt workflow ready | Four-deliverable QA gate, evidence register fields, `PERPLEXITY-COMPUTER-PROMPTS.md` | Approved private client workspace and a real attended Sprint proving the workflow |
| Coordinate owner actions | Contract ready, not connected | Action owner, dependency, acceptance test, measure, review date, and human acceptance events | Approval inbox, reminders, escalation ownership, and controlled mutations |
| Run customer operations | Designed, not operating | Booked → collection authorization → delivery → adoption lifecycle | Onboarding, access, schedule, communication, billing, and retention integrations |
| Learn from outcomes | Executable on sanitized ledgers | `scripts/case-ledger.mjs` and `scripts/portfolio-metrics.mjs` | Production observations, owner-selected service levels, and a recurring learning review |
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
| Legal contracting and invoicing entity | A scope or payment request cannot be issued accurately without it |
| Base44 review owner and response target | A notification without accountable handling is not an operating system |
| Base44 read access and notification route | The repository cannot verify or poll new Leads today |
| Private ledger host, access roles, retention, backup, and deletion policy | Real case events must not live in GitHub |
| Document/acceptance system | Scope acceptance needs durable evidence and signer authority |
| Private payment system and approver | Payment requests and confirmations must remain private and human-controlled |
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
node scripts/case-ledger.mjs validate operations/examples/qualified-sprint.jsonl
node scripts/portfolio-metrics.mjs operations/examples/qualified-sprint.jsonl operations/examples/declined-brief.jsonl
```

These commands verify repository contracts and synthetic paths. They do not prove
that an external adapter, notification, customer operation, or payment is live.

## Next executable slice

The highest-leverage next build is the Base44 read-only adapter plus private-ledger
deployment. It is blocked by the Base44 access route and private-store decision,
not by application code. Until those are authorized, manual Lead review remains
the correct production control while the repository contract supplies the event
format, validator, test fixtures, and metrics.
