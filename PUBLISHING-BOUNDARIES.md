# ARM Publishing Boundaries

Updated: 2026-08-18

| Property | Source | Role | Canonical rule |
| --- | --- | --- | --- |
| `www.arm-agency.com` | `virtualmase/tired-of-this-site-arm-agency-dot-com` | Current ARM Agency site | Self-canonical `.com` URLs |
| `arm-agency.xyz` | `virtualmase/arm-agency-cashflow` | Legacy ARM Agency property | Self-canonical `.xyz` URLs |
| AI Mastery | `virtualmase/ai-mastery` | Independent technical/editorial platform | Its own canonical origin |

## Release controls

1. Publish `.com` and `.xyz` from separate repositories and deployment projects.
2. Never use a blanket redirect between them.
3. Never mirror a substantive article on both domains. Assign one canonical owner and write a distinct summary/link on the other property when cross-reference is useful.
4. Keep sitemap, robots, `llms.txt`, Open Graph URL, and JSON-LD identifiers on the same host as the page.
5. A Manus-authored AI Mastery section must land in `virtualmase/ai-mastery` unless the approved brief explicitly assigns the article to ARM Agency. An ARM-hosted companion page must be independently useful and link to the AI Mastery source.
6. Verify the intended host after every deployment before announcing publication.

## x402 and AiFi silo

The current ARM Agency `.com` property is the canonical owner for the agentic-commerce silo. The intended structure is:

- Pillar: agentic commerce infrastructure
- Spoke: x402 payment transport
- Spoke: AiFi authority, wallets, budgets, approvals, settlement, and reconciliation
- Spoke: agent-payment production readiness

The `.xyz` property may carry a distinct historical or implementation note, but must not mirror the `.com` pillar.
