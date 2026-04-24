import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { godivaIncident, managedAgentSession } from "@/lib/schema";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authz = await requireUserId();
  if ("error" in authz) return authz.error;

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  // Verify the session belongs to this user
  const [session] = await db
    .select({ id: managedAgentSession.id })
    .from(managedAgentSession)
    .where(
      and(
        eq(managedAgentSession.id, sessionId),
        eq(managedAgentSession.userId, authz.userId),
      ),
    )
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [incident] = await db
    .select({ recommendation: godivaIncident.recommendation })
    .from(godivaIncident)
    .where(eq(godivaIncident.sessionId, sessionId))
    .limit(1);

  return NextResponse.json({
    recommendation: incident?.recommendation ?? null,
  });
}
