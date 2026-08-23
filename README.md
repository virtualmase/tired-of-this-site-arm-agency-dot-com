# ARM Agency

AI Buyer Intelligence for high-ACV B2B teams facing a category, launch, pipeline, or competitive trigger.

Live at [arm-agency.com](https://www.arm-agency.com).

## Publishing boundary

- `arm-agency.com` is published from this repository as the current ARM Agency site.
- `arm-agency.xyz` is a separate legacy ARM Agency property with its own repository and release history.
- AI Mastery is a separate editorial property. Links between these sites describe relationships; they do not merge canonical identity or authorize mirrored publication.
- New `.com` pages must use `https://www.arm-agency.com/...` canonicals. New `.xyz` pages must retain `https://arm-agency.xyz/...` canonicals. Do not add a blanket redirect or cross-domain canonical between the properties.

## Project Structure

```
/
├── index.html                             # Homepage and current offer
├── brief/index.html                       # Category Presence Brief intake
├── sprint/index.html                      # AI Buyer Intelligence Sprint
├── audit/index.html                       # Self-guided buyer research orientation
├── about/index.html                       # Company ethos and operating model
├── glossary/index.html                    # Searchable industry and ARM vocabulary
├── llms.txt                               # AI crawler guidance
├── robots.txt                             # Crawler directives
├── sitemap.xml                            # URL map
├── vercel.json                            # Deployment config
├── operations/
│   ├── case-contract.json                 # Measurable lifecycle and authority gates
│   ├── deliverable-contract.json          # Evidence-led private Sprint package contract
│   ├── demand-experiment-contract.json    # Approval-gated attraction and learning contract
│   ├── README.md                          # Operating-control boundaries and adapter rules
│   └── examples/                          # Synthetic validator fixtures, never real cases
├── resources/
│   ├── index.html                       # Resources hub
│   ├── signal-orchestration-guide/       # Intent and evidence to action
│   ├── buyer-intent-vs-buyer-intelligence/ # Signal vs decision boundary
│   ├── enterprise-buying-committee-intelligence/ # Buying-group map
│   ├── enterprise-proof-readiness/       # Buyer validation surfaces
│   └── category-narrative-intelligence/  # Category creation and redefinition
├── CONTENT-SILO-keyword-clusters-and-internal-linking.md  # Content strategy
├── BACKEND-PIPELINE.md                  # Backend ops documentation
└── SALES-CAMPAIGN-ROADMAP.md            # Archived legacy sales roadmap
```

## Documentation

- [Backend Pipeline & Operations Scaffold](./BACKEND-PIPELINE.md) — Existing Base44 schema, verified public-intake mapping, and the remaining Sprint close/deal mapping decision.
- [Market Launch Operating Record](./MARKET-LAUNCH.md) — Current positioning, measurement definitions, controlled-launch cadence, and unresolved gates.
- [Operating Control Plane](./operations/README.md) — Executable case lifecycle, human-approval contract, privacy boundary, and adapter rules.
- [Autonomous Operations Roadmap](./AUTONOMY-ROADMAP.md) — Evidence-backed capability state, owner decisions, and dependency-ordered production rollout.
- [Perplexity Computer Prompt Pack](./PERPLEXITY-COMPUTER-PROMPTS.md) — Guarded research, qualification, delivery, and operating prompts.
- [Docker Gordon Prompt Pack](./DOCKER-GORDON-PROMPTS.md) — Guarded local validation, preview, security, and Docker diagnostic prompts.
- [Sales Campaign Roadmap](./SALES-CAMPAIGN-ROADMAP.md) — Archived legacy plan; not approved current offer guidance.
- [Content Silo Strategy](./CONTENT-SILO-keyword-clusters-and-internal-linking.md) — Archived legacy content plan; not approved current conversion guidance.

## Current engagement path

`Category Presence Brief → human fit review → written Sprint scope → private collection → AI Buyer Intelligence Sprint`

The public Brief submits to an external Base44 `intakeLead` function using a legacy-compatible service enum. A controlled production test verified Lead creation on 2026-08-22. This repository does not contain the Base44 function source, notification configuration, or a verified Sprint-specific `closeDeal` template.

See [BACKEND-PIPELINE.md](./BACKEND-PIPELINE.md) before changing intake fields or processing the first paid Sprint.

Run these contract checks before a production push:

```bash
node scripts/check-launch-readiness.mjs
node scripts/check-audit-contract.mjs
node scripts/check-image-seo.mjs
node scripts/check-case-ledger.mjs
node scripts/check-brief-event-candidate.mjs
node scripts/check-base44-brief-ingestion.mjs
node scripts/check-deliverable-package.mjs
node scripts/check-customer-ops-queue.mjs
node scripts/check-demand-experiment.mjs
```
