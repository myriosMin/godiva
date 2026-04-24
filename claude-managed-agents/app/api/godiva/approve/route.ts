import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { HookNotFoundError } from "workflow/errors";
import { db } from "@/lib/db";
import { godivaIncident } from "@/lib/schema";
import { requireUserId } from "@/lib/session";
import { messageHook } from "@/app/workflows/tail-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function nowSGT(): string {
  const sgt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return sgt.toISOString().replace("T", " ").slice(0, 16) + " SGT";
}

export async function POST(request: Request) {
  const authz = await requireUserId();
  if ("error" in authz) return authz.error;

  let body: { sessionId?: string; approvedBy?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sessionId, approvedBy, notes } = body;
  if (!sessionId || !approvedBy) {
    return NextResponse.json(
      { error: "sessionId and approvedBy are required" },
      { status: 400 },
    );
  }

  const [incident] = await db
    .select()
    .from(godivaIncident)
    .where(eq(godivaIncident.sessionId, sessionId))
    .limit(1);

  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  await db
    .update(godivaIncident)
    .set({
      approvalStatus: "approved",
      approvedBy,
      approvedAt: new Date(),
      operatorNotes: notes ?? null,
    })
    .where(eq(godivaIncident.sessionId, sessionId));

  const confirmationText = `Approved by ${approvedBy} at ${nowSGT()}${notes ? `. Notes: ${notes}` : ""}. Generate the final execution SOP and confirm all steps are ready for the operator.`;

  try {
    await messageHook.resume(`msg:${sessionId}`, { text: confirmationText });
  } catch (err) {
    // HookNotFoundError means the workflow already ended — expected & benign.
    // Anything else is a real failure we want visible in prod logs.
    if (!HookNotFoundError.is(err)) {
      console.warn(`[approve] messageHook.resume failed: ${String(err)}`);
    }
  }

  return NextResponse.json({ ok: true });
}
