import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { db } from "@/lib/db";
import { managedAgentSession, godivaIncident } from "@/lib/schema";
import { createCodingSession } from "@/lib/managed-agents";
import { requireUserId } from "@/lib/session";
import { getOrCreateVaultForUser, syncMCPCredential } from "@/lib/vault";
import { getUserToken, MCP_SERVERS } from "@/lib/mcp-oauth";
import { sessionWorkflow } from "@/app/workflows/tail-session";
import type { Signal } from "@/lib/godiva-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatSignalPrompt(signal: Signal): string {
  const signalType = signal.signalType ?? "maintenance_email";
  const featureList = signal.features
    .map((f) => `  - ${f.n}: ${f.i}`)
    .join("\n");

  return `Analyze this incident signal and call submit_recommendation with your structured assessment.

SIGNAL TYPE: ${signalType}
SYSTEM: ${signal.sys}
DOMAIN: ${signal.domain}
DATE: ${signal.date}
MAINTENANCE WINDOW: ${signal.win} (${signal.dur})
REASON: ${signal.reason}
OPERATOR-NOTED SEVERITY: ${signal.sev}
NO CUSTOMER IMPACT: ${signal.noImpact}

AFFECTED FEATURES (operator-identified):
${featureList || "  (none listed)"}

SOURCE EMAIL/ALERT:
---
${signal.email}
---

Use your skills to:
1. Parse and validate the signal
2. Check vendor status if this is an external vendor with a public status page
3. Classify severity using severity-rules
4. Map to the correct LaunchDarkly bundle using ld-reference
5. Determine required approvers using approval-matrix
6. Generate customer banner copy using banner-templates
7. Generate SOP steps using sop-playbook
8. Call submit_recommendation with your complete structured analysis`.trim();
}

export async function POST(request: Request) {
  const authz = await requireUserId();
  if ("error" in authz) return authz.error;

  let body: { signal?: Signal };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.signal) {
    return NextResponse.json({ error: "signal is required" }, { status: 400 });
  }

  const signal = body.signal;
  const id = crypto.randomUUID();
  const title = `Incident: ${signal.sys} (${signal.sev})`;

  let anthropic;
  try {
    const vaultId = await getOrCreateVaultForUser(authz.userId);
    await Promise.all(
      Object.entries(MCP_SERVERS).map(async ([name, info]) => {
        const mcpToken = await getUserToken(authz.userId, name);
        if (mcpToken) {
          await syncMCPCredential(vaultId, name, info.url, mcpToken);
        }
      }),
    );
    anthropic = await createCodingSession([vaultId]);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const initialMessage = formatSignalPrompt(signal);

  const run = await start(sessionWorkflow, [
    {
      internalSessionId: id,
      anthropicSessionId: anthropic.anthropicSessionId,
      initialMessage,
    },
  ]);

  // Insert managed session row so the session appears in the UI and /api/readable works
  await db.insert(managedAgentSession).values({
    id,
    userId: authz.userId,
    anthropicSessionId: anthropic.anthropicSessionId,
    title,
    agentId: anthropic.agentId,
    environmentId: anthropic.environmentId,
    workflowRunId: run.runId,
    repoUrl: null,
    repoOwner: null,
    repoName: null,
    baseBranch: null,
  });

  // Insert incident row — recommendation will be filled in by the workflow
  await db.insert(godivaIncident).values({
    id: crypto.randomUUID(),
    sessionId: id,
    anthropicSessionId: anthropic.anthropicSessionId,
    signalData: signal as unknown as Record<string, unknown>,
  });

  return NextResponse.json({
    sessionId: id,
    workflowRunId: run.runId,
    anthropicSessionId: anthropic.anthropicSessionId,
  });
}
