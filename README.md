# ARM Agency

Reputation management for the AI era.

Live at [arm-agency.com](https://www.arm-agency.com).

## Project Structure

```
/
├── index.html                          # Homepage
├── llms.txt                             # AI crawler guidance
├── robots.txt                           # Crawler directives
├── sitemap.xml                          # URL map
├── vercel.json                          # Deployment config
├── resources/
│   ├── index.html                       # Resources hub
│   ├── agentic-reputation-infrastructure/  # Flagship pillar
│   ├── ai-reputation-management-guide/    # Pillar: reputation
│   ├── generative-engine-optimization-guide/ # Pillar: GEO
│   ├── geo-vs-seo/                      # Pillar: comparison
│   ├── enterprise-ai-visibility-audit/   # Pillar: enterprise
│   └── reputation-due-diligence-ai-search/ # Pillar: due diligence
├── CONTENT-SILO-keyword-clusters-and-internal-linking.md  # Content strategy
├── BACKEND-PIPELINE.md                  # Backend ops documentation
└── SALES-CAMPAIGN-ROADMAP.md            # 90-day sales roadmap
```

## Documentation

- [Backend Pipeline & Operations Scaffold](./BACKEND-PIPELINE.md) — Entity schemas, backend functions, pipeline flow, fulfillment workflow.
- [Sales Campaign Roadmap](./SALES-CAMPAIGN-ROADMAP.md) — 90-day sales motion, revenue projections, campaign-to-backend mapping.
- [Content Silo Strategy](./CONTENT-SILO-keyword-clusters-and-internal-linking.md) — Keyword clusters, internal linking architecture, GEO content standard.

## Backend

Seven entities: Lead → Opportunity → Client → Campaign → Deliverable + SignalAudit + ShareOfModel.

Six deployed functions: intakeLead, qualifyLead, closeDeal, updateDeliverable, logShareOfModel, getPipelineDashboard.

See [BACKEND-PIPELINE.md](./BACKEND-PIPELINE.md) for full documentation.
