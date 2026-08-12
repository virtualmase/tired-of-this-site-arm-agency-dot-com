# ARM Agency — Prospect List: Campaign 1A (Pre-Raise Founders)

**Generated:** 2026-08-11  
**Source:** Public funding announcements (TechCrunch, Crunchbase News, VC News Daily)  
**Target:** AI startup founders who raised in the last 30 days — they're about to be searched by investors, partners, and press.

---

## Prospect Table

| # | Company | Founder/CEO | Funding | Date | Stage | What They Do | Priority | Email Status |
|---|---------|-------------|---------|------|-------|--------------|----------|--------------|
| 1 | Ellis AI | Ryan Williams | $10M | Jul 31 | Seed | AI agents for private credit managers | HIGH | Needs enrichment |
| 2 | June AI | TBD | $20M | Aug 2026 | Pre-seed | AI (emerging from stealth, Benioff-backed) | HIGH | Needs enrichment |
| 3 | Emerald AI | TBD | $90M | Aug 7 | Growth | Data center energy tech | MEDIUM | Needs enrichment |
| 4 | Simile | TBD | $200M+ | Aug 2026 | Series B+ | Human behavior prediction to reduce AI errors | HIGH | Needs enrichment |
| 5 | Together AI | TBD | $800M | Jul 2026 | Series C | AI infrastructure / inference | HIGH | Needs enrichment |
| 6 | Chai Discovery | TBD | $400M | Jul 2026 | Series C | AI drug discovery | MEDIUM | Needs enrichment |
| 7 | Prime Intellect | TBD | $130M | Jul 2026 | Series A | Decentralized AI training | HIGH | Needs enrichment |
| 8 | Qualified Health | TBD | $125M | Mar 2026 | Series B | Generative AI in health systems | MEDIUM | Needs enrichment |
| 9 | Delightree | TBD | $25M | Aug 2026 | Growth | AI for franchise/multi-unit operations | MEDIUM | Needs enrichment |
| 10 | Actualyze AI | TBD | $7M | 2026 | Seed | Enterprise AI platform | LOW | Needs enrichment |

## Targeting Rationale

Every company on this list just raised a funding round. Within 30 days of a raise, the following happens:

1. **Investors search them** — due diligence teams, LPs, and prospective investors run queries on the company and founder across ChatGPT, Claude, Gemini, and Perplexity
2. **Press covers them** — TechCrunch, Crunchbase, and trade publications publish articles that get scraped into AI training data
3. **Partners evaluate them** — potential partners search for the company's reputation, reliability, and track record
4. **Recruits research them** — engineers and operators who just saw the funding announcement search to learn more

If the AI models have wrong, outdated, or missing information about these companies, it damages credibility at the exact moment when credibility matters most — right after a raise.

## The Pitch Angle

"Before your next investor call, check what ChatGPT says about you."

Link to the [Reputation Due Diligence guide](https://www.arm-agency.com/resources/reputation-due-diligence-ai-search/) as the educational hook, then offer a Signal Audit.

## Next Actions

1. **Email enrichment needed** — Apollo's search API is on their free plan (locked). Options:
   - Upgrade Apollo to paid plan for direct API access
   - Use Hunter.io or similar for email lookup
   - Manual research via LinkedIn + company websites
2. **Create leads in backend** — once emails are enriched, batch-create via `intakeLead`
3. **Send outreach** — use the email templates in `OUTREACH-TEMPLATES.md`
4. **Track responses** — every reply becomes a qualified lead in the pipeline

---

## Alternative Targeting (if email enrichment is slow)

If we can't enrich emails quickly, we can pivot Campaign 1A to LinkedIn-based outreach:
- Find each founder on LinkedIn (connected via Base44 OAuth)
- Send connection requests with personalized notes
- Follow up with the Signal Audit offer in DM

This trades speed for personalization — LinkedIn outreach has lower volume but higher response rates than cold email.
