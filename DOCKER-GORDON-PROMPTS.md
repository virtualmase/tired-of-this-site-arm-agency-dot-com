# ARM Agency — Docker Gordon Prompt Pack

Updated: 2026-08-23

## Purpose

Use Docker Gordon as a focused engineering operator for reproducible validation,
local preview, container security, and Docker diagnostics. ARM's production site is
a static site deployed through Vercel; Docker is a development and verification
tool unless an owner explicitly approves a different deployment architecture.

Gordon is available through Docker Desktop and the `docker ai` CLI in Docker
Desktop 4.74 or later. Start it from the repository root so the working directory
provides the intended project context:

```bash
cd /path/to/tired-of-this-site-arm-agency-dot-com
docker ai
```

Official references:

- [Gordon overview](https://docs.docker.com/ai/gordon/)
- [Capabilities](https://docs.docker.com/ai/gordon/concepts/capabilities/)
- [CLI usage](https://docs.docker.com/ai/gordon/how-to/cli/)
- [Permissions](https://docs.docker.com/ai/gordon/how-to/permissions/)
- [Tool controls](https://docs.docker.com/ai/gordon/how-to/configure-tools/)
- [Data privacy](https://docs.docker.com/ai/gordon/concepts/data-privacy/)

## Recommended use order

1. Run Prompt 0 at the start of every new Gordon session.
2. Run Prompt 1 before asking Gordon to create Docker assets.
3. Use Prompts 2–6 to build and verify the local QA environment.
4. Use Prompts 7–11 when a build, image, or container needs diagnosis.
5. Use Prompt 12 only for an inventory; approve cleanup targets individually.
6. Run Prompt 13 before accepting a Gordon-authored change.

Do not enable YOLO or auto-approve mode for this repository. Gordon's working
directory is context, not a filesystem sandbox, and destructive Docker operations
can permanently remove data.

---

## Prompt 0 — Establish the engineering boundary

```text
Act as ARM Agency's Docker engineering operator for this repository.

Repository facts:
- This is the production source for https://www.arm-agency.com.
- It is a static HTML, CSS, and JavaScript site deployed through Vercel.
- The public buyer path is Category Presence Brief → human fit review → written Sprint scope → private collection → AI Buyer Intelligence Sprint.
- The public Brief sends records to an external Base44 endpoint. That backend is outside this repository.
- Repository checks are dependency-free Node scripts under scripts/.

Authority rules:
1. Begin read-only. Inspect AGENTS.md, README.md, vercel.json, the active routes in sitemap.xml, and the validation scripts before proposing work.
2. You may read files, inspect Docker state, explain findings, and draft an exact change plan.
3. Ask for approval before every shell command, file write, file deletion, network fetch, image pull, build, container start/stop, or Docker resource change.
4. Never use YOLO/auto-approve mode. Never ask for blanket session approval.
5. Never run docker system prune, docker volume prune, docker builder prune, docker container prune, or remove an image, volume, network, container, file, or directory. Inventory cleanup candidates only.
6. Do not push images, publish packages, deploy to Vercel, modify DNS, submit the public Brief, contact Base44, change Git remotes, commit, or push.
7. Do not read or print .env files, credentials, cookies, tokens, private keys, personal lead data, client evidence, or unrelated directories. If a secret appears, redact it and stop.
8. Do not replace Vercel production hosting with a container. A container may provide local preview or deterministic QA only unless an owner approves an architecture change.
9. Preserve existing public claims and approval gates. Do not invent results, testimonials, customer facts, or performance guarantees.
10. Preserve user changes. Do not overwrite unrelated work.

For every proposed mutation, show:
- exact files or Docker resources affected;
- exact command;
- expected result;
- risk;
- rollback;
- APPROVAL REQUIRED.

End each task with: Findings; Changes made; Commands and results; Remaining risks; Approval still required. Confirm the boundary, then wait for a specific task without making changes.
```

## Prompt 1 — Decide whether Docker adds value

```text
Perform a read-only containerization-fit audit of this repository. Do not assume it needs a production Dockerfile.

Inspect the current static-site architecture, Vercel configuration, validation scripts, external Base44 boundary, and local preview needs. Compare these three options:

A. Keep the current non-containerized workflow.
B. Add a test-only Node container that runs all repository validators.
C. Add a local static preview container plus a separate validation service through Compose.

For each option, assess reproducibility, security surface, build time, maintenance burden, Vercel parity, health-check usefulness, and whether it moves ARM toward safer autonomous operations. Recommend the smallest option that closes a verified gap. List evidence for every gap and mark assumptions. Do not create files or run builds.
```

## Prompt 2 — Design a deterministic validation container

```text
Design a test-only container for this repository after reading every scripts/check-*.mjs file.

Requirements:
- run the existing dependency-free Node checks without npm install;
- use a current supported Node image and pin the chosen image immutably in the final approved implementation;
- use a non-root user;
- copy only files required by the checks;
- include a restrictive .dockerignore without hiding required site files;
- keep the image free of credentials and private operational data;
- produce a non-zero exit code when any check fails;
- require no writable bind mount;
- remain a local/CI verification tool, not the production server.

First return the proposed Dockerfile, .dockerignore rules, build command, run command, expected checks, and rollback plan as a review packet. Identify any validator whose paths prevent a minimal build context. Do not write files or build until I approve.
```

## Prompt 3 — Implement the approved validation container

```text
Implement the approved test-only validation-container design. Before writing, show the exact diff and ask for approval.

After approval:
1. Create only the agreed Docker assets.
2. Build with plain progress output and no secrets.
3. Run the image with network disabled, a read-only root filesystem, dropped Linux capabilities, no-new-privileges, and a temporary writable /tmp if Node requires it.
4. Report every validator command and exit status.
5. Inspect the resulting image configuration and effective user.
6. Show git diff and git diff --check.

Do not commit, push, publish the image, deploy, or alter current production files. If a check fails, diagnose it and stop before changing application content.
```

## Prompt 4 — Design a local static preview

```text
Design a local-only container preview for the ARM static site.

Requirements:
- serve the repository's public static files without embedding secrets;
- bind only to 127.0.0.1 on a non-production host port;
- use an unprivileged runtime and read-only filesystem where practical;
- reproduce clean URLs and the permanent legacy redirects defined in vercel.json closely enough for local QA;
- include a health check against a stable local route;
- make the limitations versus Vercel routing and security headers explicit;
- never proxy, invoke, or test the external Base44 endpoint;
- do not imply the preview proves production behavior.

Compare a simple static-server image with an unprivileged Nginx configuration. Recommend one based on this repository, then return a proposed file diff and verification matrix. Do not write or run anything until approved.
```

## Prompt 5 — Compose a two-service QA workflow

```text
Propose a Compose workflow with exactly two profiles or services:

1. verify — builds and runs all repository contract checks, then exits.
2. preview — starts the local static preview only when explicitly requested.

Use clear service names, deterministic build contexts, no privileged mode, no Docker socket mount, no host-wide filesystem mount, no secrets, and no persistent volume. Bind preview to 127.0.0.1 only. Add health status where meaningful.

Provide the exact commands for:
- validating the Compose file;
- building verify;
- running verify and propagating its exit code;
- starting preview;
- checking preview health;
- stopping only this project without deleting volumes or unrelated resources.

Return the proposed compose.yaml and assumptions for approval. Do not create or start services yet.
```

## Prompt 6 — Verify routes and contract checks in containers

```text
Using only the approved local QA containers, verify the repository without contacting external services.

Run and report:
- each scripts/check-*.mjs validator independently;
- the combined verification-container exit status;
- Compose configuration validation, if Compose exists;
- local HTTP status for every active sitemap route against preview;
- one representative permanent redirect, without following it;
- missing local assets referenced by active HTML;
- container health, effective user, port binding, mounts, capabilities, and restart policy.

Treat local preview as local evidence only. Do not claim Vercel, DNS, TLS, analytics ingestion, Base44 Lead creation, or notification delivery is verified. Return a pass/fail evidence table and exact remediation proposals for failures; do not edit automatically.
```

## Prompt 7 — Review Docker security

```text
Conduct a read-only security review of this repository's Docker assets and built local images.

Check for:
- root runtime;
- floating or untrusted base-image tags;
- unnecessary packages and build tools in runtime stages;
- secrets in files, layers, build arguments, environment variables, labels, or history;
- broad COPY instructions;
- writable root filesystems;
- excessive capabilities, privileged mode, host networking, Docker socket mounts, or broad bind mounts;
- publicly bound preview ports;
- absent health checks where they provide real signal;
- missing image provenance, SBOM, or vulnerability-review steps;
- cache choices that risk stale validation.

Separate exploitable issues, hardening opportunities, and irrelevant generic advice. For each real issue give evidence, severity, smallest fix, regression risk, and validation command. Do not reveal secret values or modify files.
```

## Prompt 8 — Inspect image contents and supply chain

```text
Inspect the approved ARM validation and preview images without running application-side network calls.

Report:
- exact image reference and digest;
- creation time and architecture;
- base image lineage;
- total and per-layer size;
- configured user, entrypoint, command, ports, environment-key names, labels, and health check;
- installed OS packages relevant to the runtime;
- high and critical vulnerabilities from available Docker-native scanning;
- whether an SBOM can be generated with current tools;
- whether the image contains files outside the approved build manifest.

Redact values that could be sensitive. Do not push, sign, attest, rebuild, pull a replacement, or accept a vulnerability exception. End with a prioritized review packet and APPROVAL REQUIRED for any action.
```

## Prompt 9 — Diagnose a failed build

```text
Diagnose this ARM image build failure: [PASTE ERROR OR IDENTIFY BUILD].

Start read-only. Inspect the failed build output, Dockerfile, .dockerignore, build context, platform, and relevant source files. Identify the earliest causal error rather than downstream noise.

Return:
1. observed failure;
2. evidence-backed root cause;
3. alternative hypotheses and how to disprove them;
4. smallest proposed fix;
5. exact rebuild and regression commands;
6. rollback.

Do not change application behavior merely to make the build green. Do not disable security checks, use an unpinned replacement image, expose secrets, clear global caches, or prune resources. Show the exact diff and request approval before editing.
```

## Prompt 10 — Diagnose a failing preview container

```text
Diagnose the ARM local preview container [CONTAINER NAME OR ID].

Inspect its state, exit code, health history, logs, image configuration, port mapping, mounts, user, resource usage, and Compose definition. Make only read-only observations first. Do not print environment values; report key names and redact values.

Determine whether the fault is build-time, startup, routing, health-check, permissions, missing-asset, resource, or host-port related. Propose the smallest reversible correction and the exact evidence that will prove it. Do not restart, exec into, recreate, stop, or remove the container until I approve the specific command.
```

## Prompt 11 — Optimize only after measuring

```text
Measure the ARM validation and preview image builds before proposing optimization.

Record clean-build time, warm-build time, image size, layer reuse, build-context size, and verification runtime. Then identify no more than three changes with measurable expected impact.

Reject optimizations that weaken reproducibility, remove contract checks, introduce a package manager unnecessarily, broaden the build context, depend on unpublished local state, or make the container the production architecture. Return baseline measurements and an approval-gated experiment plan. Make one approved change at a time and compare it with the baseline before retaining it.
```

## Prompt 12 — Inventory safe cleanup candidates

```text
Create a read-only Docker disk-usage and cleanup inventory. Do not clean anything.

List stopped containers, dangling images, unused project-specific images, build cache, networks, and volumes. For every candidate include:
- exact name or ID;
- size;
- creation and last-used evidence where available;
- what references it;
- whether it belongs to this ARM project;
- data-loss risk;
- reversible alternative.

Exclude running resources and anything not confidently attributable to this project. Never propose a blanket prune command. End with individually reviewable commands, one target per command, each labeled APPROVAL REQUIRED.
```

## Prompt 13 — Produce the change acceptance packet

```text
Prepare a final acceptance packet for the Docker-related changes made in this session.

Include:
- original verified gap;
- files changed and why;
- exact commands executed and exit codes;
- validator results;
- image digest, size, runtime user, network mode, mounts, and security controls;
- local route and health-check evidence;
- limitations and unverified external behavior;
- rollback commands that affect only this project;
- git diff and git diff --check result;
- a concise owner decision: ACCEPT, REVISE, or REJECT.

Do not commit, push, publish an image, deploy, submit forms, or describe local evidence as production proof. If any command or result is missing, mark the packet INCOMPLETE rather than inferring success.
```

## What Gordon should not own

Gordon can improve the reproducibility and safety of ARM's engineering workflow.
It should not qualify buyers, approve claims, issue scopes, handle payments, access
private client evidence, publish content, or decide whether production changes ship.
Those actions remain governed by ARM's human approval gates and the operating
control plane.
