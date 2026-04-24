import { NextResponse } from "next/server";
import { getAnthropic } from "@/lib/anthropic";
import type { BannerTemplate } from "@/lib/godiva-data";

export const dynamic = "force-dynamic";

interface GenerateBannerRequest {
  sys: string;
  reason: string;
  dateStr: string;
  timeStr: string;
  features: string[];
  templates: BannerTemplate[];
}

interface GenerateBannerResponse {
  templateIndex: number;
  title: string;
  body: string;
}

export async function POST(request: Request) {
  let body: GenerateBannerRequest;
  try {
    body = (await request.json()) as GenerateBannerRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sys, reason, dateStr, timeStr, features, templates } = body;
  if (!sys || !reason || !dateStr || !timeStr || !features || !templates) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const client = getAnthropic();

  const tmplList = templates
    .map(
      (t) =>
        `Index ${t.id} (${t.scenario}):\nTitle: ${t.title}\nBody: ${t.body}`,
    )
    .join("\n\n");

  const userContent = `Event: ${sys}. Reason: ${reason}. Date: ${dateStr}. Window: ${timeStr}. Affected: ${features.join(", ")}.\n\nTemplates:\n${tmplList}\nReplace [Date: DD-MM] with ${dateStr} and [Time: HH:MM] with ${timeStr}. Return JSON only.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system:
        'Select the best maintenance banner template and fill ALL placeholders. Return ONLY valid JSON: {"templateIndex":number,"title":"string","body":"string"}. No markdown.',
      messages: [{ role: "user", content: userContent }],
    });

    const raw = message.content[0];
    if (raw.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const cleaned = raw.text
      .trim()
      .replace(/^```[a-z]*\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    const result = JSON.parse(cleaned) as GenerateBannerResponse;
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 },
    );
  }
}
