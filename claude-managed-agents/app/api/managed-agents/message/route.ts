import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { HookNotFoundError } from "workflow/errors";
import { db } from "@/lib/db";
import { managedAgentSession } from "@/lib/schema";
import { requireUserId } from "@/lib/session";
import { checkMessageRateLimit } from "@/lib/rate-limit";
import { messageHook, sessionWorkflow } from "@/app/workflows/tail-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const authz = await requireUserId();
  if ("error" in authz) return authz.error;

  const rateCheck = checkMessageRateLimit(authz.userId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: rateCheck.reason },
      { status: 429 },
    );
  }

  let body: { sessionId?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  const text = body.text?.trim();
  if (!sessionId || !text) {
    return NextResponse.json(
      { error: "sessionId and text are required" },
      { status: 400 },
    );
  }

  const rows = await db
    .select()
    .from(managedAgentSession)
    .where(
      and(
        eq(managedAgentSession.id, sessionId),
        eq(managedAgentSession.userId, authz.userId),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isFirstMessage = row.title === "New chat";
  const titleUpdate = isFirstMessage
    ? { title: text.length > 60 ? `${text.slice(0, 57)}...` : text }
    : {};

  await db
    .update(managedAgentSession)
    .set({
      updatedAt: new Date(),
      ...titleUpdate,
    })
    .where(
      and(
        eq(managedAgentSession.id, sessionId),
        eq(managedAgentSession.userId, authz.userId),
      ),
    );

  let newRunId: string | undefined;
  try {
    await messageHook.resume(`msg:${sessionId}`, { text });
  } catch (err) {
    if (!HookNotFoundError.is(err)) throw err;

    // Workflow run was lost (e.g. dev server restart). Start a new one that
    // treats this message as the initial turn, then keeps waiting for more.
    const run = await start(sessionWorkflow, [
      {
        internalSessionId: sessionId,
        anthropicSessionId: row.anthropicSessionId,
        initialMessage: text,
      },
    ]);
    newRunId = run.runId;

    await db
      .update(managedAgentSession)
      .set({ workflowRunId: run.runId })
      .where(eq(managedAgentSession.id, sessionId));
  }

  return NextResponse.json({ ok: true, ...(newRunId ? { runId: newRunId } : {}) });
}
