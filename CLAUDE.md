# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What We're Building

**Project Godiva** — an AI-driven service event automation platform. It ingests operational signals (emails, monitoring alerts, manual triggers), uses AI to classify incident severity and recommend response actions, then executes those responses via mock feature flag bundles, applying changes consistently across App, uPortal, and Kiosk customer channels (mocked ones).

**Core problem**: Manual, inconsistent incident response — fragmented signal interpretation, delayed customer impact mitigation, and error-prone multi-channel execution.

**In-scope tracks:**

- **Track 1**: Admin Dashboard & Feature Control — single operator portal where the PO reviews AI recommendations, toggles affected features flag/bundle model (20+ domains: Payment, Core, Channel, Support, EV, Content, Infrastructure, etc.) with Critical/Major/Minor severity tiers, publishes app banners, and confirms actions in one click. Every action is logged to a Service Event ID.
- **Track 2**:
  AI Event Decisioning & Signal Intake — interprets incoming vendor signals, classifies severity (Critical/Major/Minor), maps affected features, and generates recommended actions and SOPs. Human approves before anything executes (checker-maker model).

## Codebase

All working code lives in `claude-managed-agents/`. That directory is a **Next.js 16 template** (Anthropic Managed Agents showcase) that serves as the foundation for Godiva. Read `claude-managed-agents/AGENTS.md` for the full stack reference, constraints, environment variables, project structure, and end-to-end flow — that file is authoritative.

## Commands

Run all commands from `claude-managed-agents/` using `pnpm`:

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm db:generate  # Generate Drizzle migrations
pnpm db:push      # Push schema to Neon
```

No test suite exists yet.

## Architecture

The template provides: Next.js 16 App Router · Better Auth (Vercel OAuth) · Neon PostgreSQL via Drizzle ORM · `@anthropic-ai/sdk` direct (beta managed sessions) · Vercel Workflow SDK for durable polling · shadcn/ui + Tailwind CSS v4.

**Signal-to-execution flow for Godiva:**

1. Operational signal arrives (email / alert / manual)
2. AI layer (Anthropic Managed Agent session) interprets signal → classifies severity → recommends LaunchDarkly bundle + SOP
3. Approval gate: Critical incidents require Product Lead + Engineering Lead sign-off (within 1 hour)
4. Execution layer applies LaunchDarkly feature flag changes across all three channels simultaneously

**Key architectural constraint**: The agent interaction is **poll-based, not streaming**. The server-side Workflow polls Anthropic every 10s, persists events to Postgres, and the UI fetches via REST. No SSE, WebSocket, or streaming patterns.

## Documentation Map

All docs live in `claude-managed-agents/docs/`:

| Doc                      | Covers                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| `AGENTS.md`              | Stack, constraints, env vars, project structure, end-to-end flow |
| `docs/SPEC.md`           | User flows, API contracts, tailing workflow, security model      |
| `docs/ARCHITECTURE.md`   | Routing, layout hierarchy, key directories                       |
| `docs/DATA_MODEL.md`     | Drizzle schema, DB conventions, migrations                       |
| `docs/AUTH.md`           | Better Auth + Vercel OAuth setup                                 |
| `docs/UI_CONVENTIONS.md` | shadcn/base-ui patterns, layout rules, taste preferences         |

## LaunchDarkly Model (Track 1)

The flag structure maps domains to severity tiers. When adding Godiva execution logic, align to this model — do not invent ad-hoc flag names. The full domain/flag reference is in `raw_docs/`.

## Godiva Agent Skills

The Godiva Anthropic managed agent uses four custom skills uploaded via the Skills API (`client.beta.skills`). Skills are reference documents the agent can access during sessions.

### Skill Files

Skills live in `claude-managed-agents/skills/`, one subdirectory per skill:

| Directory | Skill Name | Purpose |
| --- | --- | --- |
| `skills/godiva-ld-reference/` | Godiva LD Reference | Full LaunchDarkly bundle/flag/severity lookup table |
| `skills/godiva-severity-rules/` | Godiva Severity Rules | Critical/Major/Minor tiers, approval gates, blast radius guidance |
| `skills/godiva-signal-schema/` | Godiva Signal Schema | Extraction schema for parsing maintenance emails and alerts |
| `skills/godiva-sop-playbook/` | Godiva SOP Playbook | SOP templates for Critical, Major, and Minor incidents |

Each directory contains a single `SKILL.md` with YAML frontmatter at the top:

```markdown
---
name: <skill name — must slugify to match the directory name>
description: <one-line description>
---

# ...content...
```

**Critical constraint**: The `name` field in frontmatter, when lowercased and spaces replaced with hyphens, must exactly match the directory name. For example, `name: Godiva LD Reference` → `godiva-ld-reference`. Mismatches cause a 400 error on sync.

### Skill IDs

Uploaded skill IDs are stored in `claude-managed-agents/godiva-skills.json`. This file is the source of truth for which skill version is live. Do not edit it manually — it is written by the sync script.

### Syncing Skills

After editing any `SKILL.md`, run from `claude-managed-agents/`:

```bash
pnpm skills:sync
```

This uploads a new version of each skill to Anthropic and updates `godiva-skills.json`. If a skill is new (not yet in `godiva-skills.json`), it creates it; otherwise it pushes a new version to the existing skill ID.

The script reads `ANTHROPIC_API_KEY` from `.env.local`.

### Attaching Skills to the Agent

Skills must be attached to the Godiva agent in the Anthropic console:
**Agents > [Godiva agent] > Skills > Add custom skill** — paste each `skill_id` from `godiva-skills.json`.

Skill IDs are stable across versions — only the version pointer changes when you sync. You only need to re-attach a skill if you create a brand new one (new directory).

# Verification & Update

Check the build works and git commit after each change.
