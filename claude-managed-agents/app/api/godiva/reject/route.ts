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

  let body: { sessionId?: string; rejectedBy?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sessionId, rejectedBy, reason } = body;
  if (!sessionId || !rejectedBy) {
    return NextResponse.json(
      { error: "sessionId and rejectedBy are required" },
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
      approvalStatus: "rejected",
      rejectedBy,
      rejectedAt: new Date(),
      operatorNotes: reason ?? null,
    })
    .where(eq(godivaIncident.sessionId, sessionId));

  const text = `Rejected by ${rejectedBy} at ${nowSGT()}${reason ? `. Reason: ${reason}` : ""}. The operator has declined this recommendation. Please acknowledge and await further instructions.`;

  try {
    await messageHook.resume(`msg:${sessionId}`, { text });
  } catch (err) {
    if (!HookNotFoundError.is(err)) {
      console.warn(`[reject] messageHook.resume failed: ${String(err)}`);
    }
  }

  return NextResponse.json({ ok: true });
}
