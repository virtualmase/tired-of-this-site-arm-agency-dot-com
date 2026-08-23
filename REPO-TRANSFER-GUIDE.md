# Repository Transfer Guide

Use this guide later if the ARM Agency repository moves from the `virtualmase` GitHub account to an organization. A repository transfer is an owner-controlled administrative change; do not automate it without explicit approval.

## Known repository state

At the time this guide was written:

```text
Repository: https://github.com/virtualmase/tired-of-this-site-arm-agency-dot-com
Default branch: main
Production domain referenced by the site: https://www.arm-agency.com
```

The repository does not prove who owns the Vercel project, DNS zone, Google Search Console property, analytics property, billing account, or external form endpoint. Verify those systems with their owners before transfer.

## What normally transfers with GitHub

- Git commits, branches, tags, releases, issues, pull requests, and repository settings supported by GitHub's transfer process.
- The source, Next.js configuration, static pages, validators, and documentation in this repository.

External services do not become organization-owned merely because the GitHub repository moves. GitHub App access, deploy hooks, secrets, environment variables, branch protections/rulesets, CODEOWNERS teams, webhooks, package permissions, and billing may require review or reauthorization.

## Authority and ownership checklist

Before scheduling the transfer, name a human owner for each system:

| System | Required verification |
| --- | --- |
| GitHub source and destination | Admin authority, organization transfer policy, repository-name availability |
| Vercel | Project/team owner, GitHub App access to the destination org, production branch, domains, variables, deploy hooks |
| DNS | Registrar/DNS owner and current Vercel records |
| Google Search Console | Property owners and organization access policy |
| Analytics | Property/team owners and continuity of data access |
| Base44 intake | Endpoint owner, allowed origins, operational contact, and synthetic test path |
| Billing | GitHub/Vercel plan owners and any transfer-related limits |

Do not remove the original administrators until the new organization owners have independently verified access.

## Pre-transfer record

1. Confirm the working tree is clean and the intended release is deployed.
2. Record the current repository URL, default branch, commit SHA, open pull requests, branch rules, webhooks, deploy keys, GitHub Apps, Actions variables/secrets names, environments, and Pages/package settings.
3. Record the Vercel project/team, Git repository connection, production branch, deployment SHA, custom domains, environment-variable names, deploy hooks, and protection settings. Do not copy secret values into this repository.
4. Record DNS entries, GSC property owners, analytics owners, and the approved Base44 endpoint owner outside the public repo.
5. Run the checks in [GSC-READY.md](GSC-READY.md) against production and retain the results.
6. Confirm the destination organization can accept the repository and has a rollback/escalation owner available during the change window.

Useful local evidence:

```bash
git status --short
git remote -v
git branch --show-current
git rev-parse HEAD
git ls-remote origin
```

Creating a backup tag is optional and requires owner approval because it changes the remote repository:

```bash
git tag -a pre-org-transfer-YYYYMMDD -m "Checkpoint before organization transfer"
git push origin pre-org-transfer-YYYYMMDD
```

## Transfer sequence

1. In GitHub, an authorized owner starts the repository transfer to the exact organization and repository name.
2. An organization owner accepts the transfer if GitHub requires acceptance.
3. Confirm organization teams, rulesets, required checks, Actions permissions, secrets/variables, environments, webhooks, deploy keys, and GitHub App access.
4. Verify or reconnect the Vercel Git integration to the transferred repository. Do not assume the prior connection survives.
5. Create a preview deployment from the transferred repository and run the full GSC release checklist.
6. Confirm the production domain and DNS remain attached to the intended Vercel project before promotion.
7. Promote only with owner approval, then verify routes, redirects, assets, headers, analytics, and a synthetic Brief submission.
8. Update local clones to the confirmed destination URL:

```bash
git remote set-url origin https://github.com/ORG-NAME/tired-of-this-site-arm-agency-dot-com.git
git fetch origin
git remote -v
git status -sb
```

## Google Search Console and analytics

A GitHub repository transfer does not itself change the public domain, so it does not inherently require a new GSC property. Add organization-managed owners if that is part of the governance change, verify access, and only then remove obsolete owners.

Likewise, confirm analytics team access and live event receipt. Moving source code does not transfer historical analytics data or account ownership.

## Rollback and incident handling

Do not rely on a fixed transfer-reversal window or promise zero downtime. Current provider rules and permissions must be checked at execution time.

If deployment continuity fails:

1. Stop promotion and preserve the last known-good production deployment.
2. Restore or reconnect the Git integration under the account that still has authority.
3. Re-run production route, asset, redirect, header, and form checks.
4. Record the failure and exact external-state change before retrying.

A Git revert only reverses code. It does not reverse repository ownership, GitHub App authorization, Vercel team membership, DNS changes, GSC ownership, secrets, or billing changes.

## Completion evidence

The transfer is complete only when:

- the destination organization owns the expected repository and branch history;
- required teams and rules are active;
- Vercel builds from the destination repository and the deployed SHA is known;
- production domains and DNS resolve to the intended project;
- every sitemap route, redirect, asset, and security header passes;
- a synthetic Brief reaches the approved destination;
- GSC and analytics owners retain access and live data continues;
- the local remote and internal documentation use the new repository URL;
- the human owner signs off on the recorded evidence.
