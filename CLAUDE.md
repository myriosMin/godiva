# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What We're Building

**Project Godiva** — an AI-driven service event automation platform. It ingests operational signals (emails, monitoring alerts, manual triggers), uses AI to classify incident severity and recommend response actions, then executes those responses via LaunchDarkly feature flag bundles, applying changes consistently across App, uPortal, and Kiosk customer channels.

**Core problem**: Manual, inconsistent incident response — fragmented signal interpretation, delayed customer impact mitigation, and error-prone multi-channel execution.

**In-scope tracks:**
- **Track 1**: LaunchDarkly Execution Control — structured feature flag/bundle model (20+ domains: Payment, Core, Channel, Support, EV, Content, Infrastructure, etc.) with Critical/Major/Minor severity tiers
- **Track 2**: AI Event Decisioning & Signal Intake — interprets incoming signals, classifies severity, generates SOPs

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

| Doc | Covers |
|-----|--------|
| `AGENTS.md` | Stack, constraints, env vars, project structure, end-to-end flow |
| `docs/SPEC.md` | User flows, API contracts, tailing workflow, security model |
| `docs/ARCHITECTURE.md` | Routing, layout hierarchy, key directories |
| `docs/DATA_MODEL.md` | Drizzle schema, DB conventions, migrations |
| `docs/AUTH.md` | Better Auth + Vercel OAuth setup |
| `docs/UI_CONVENTIONS.md` | shadcn/base-ui patterns, layout rules, taste preferences |

## LaunchDarkly Model (Track 1)

The flag structure maps domains to severity tiers. When adding Godiva execution logic, align to this model — do not invent ad-hoc flag names. The full domain/flag reference is in `raw_docs/`.
