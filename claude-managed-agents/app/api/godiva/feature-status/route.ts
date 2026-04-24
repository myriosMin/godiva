import { NextResponse } from "next/server";
import {
  getFeatureStatuses,
  setFeatureStatus,
  setAllFeatureStatuses,
} from "@/lib/feature-status";

export async function GET() {
  return NextResponse.json({ features: getFeatureStatuses() });
}

export async function PATCH(req: Request) {
  const body = await req.json();

  // Bulk reset: { all: true | false }
  if (typeof body.all === "boolean") {
    setAllFeatureStatuses(body.all);
    return NextResponse.json({ ok: true, features: getFeatureStatuses() });
  }

  // Single feature: { featureId: string, up: boolean }
  const { featureId, up } = body;
  if (typeof featureId !== "string" || typeof up !== "boolean") {
    return NextResponse.json({ error: "featureId and up are required" }, { status: 400 });
  }

  const ok = setFeatureStatus(featureId, up);
  if (!ok) {
    return NextResponse.json({ error: `Unknown feature ID: ${featureId}` }, { status: 400 });
  }
  return NextResponse.json({ ok: true, features: getFeatureStatuses() });
}
