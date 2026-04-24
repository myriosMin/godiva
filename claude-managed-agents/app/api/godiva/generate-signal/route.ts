import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function nowSGT() {
  const sgt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const h = String(sgt.getUTCHours()).padStart(2, "0");
  const m = String(sgt.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

const TYPE_GUIDE: Record<string, string> = {
  monitoring_alert:
    "This is a real-time monitoring alert (Datadog or PagerDuty). Set win to 'Ongoing', dur to 'TBD'. The email field should look like a PagerDuty/Datadog alert notification: include alert name, triggered time, affected service, error rate or HTTP status details, and a severity label (P1/P2). Make it terse and technical.",
  maintenance_email:
    "This is a formal vendor maintenance notice. Pick a maintenance date within the next 3 days from 24 Apr 2026. The email field should be a complete email with From/Subject/Date headers and a formal body announcing the planned downtime window, impact, and contact details.",
  manual_trigger:
    "This is an ops team escalation. Set from to ops-team@spgroup.com.sg. The email field should read like a Slack message posted by an on-call engineer: brief, urgent, informal, with a brief description of what they observed.",
};

export async function POST(req: Request) {
  const { signalType, system, domain, sev } = await req.json();

  const prompt = `You are generating a realistic mock operational signal for SP Group (Singapore utility company) incident management system called Godiva.

Generate a ${signalType} signal for system "${system}" (domain: "${domain}", severity: ${sev}).
Current SGT time: ${nowSGT()}. Today: 24 Apr 2026.

${TYPE_GUIDE[signalType] ?? ""}

Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Use exactly these fields:
{
  "domain": "${domain}",
  "from": "realistic sender email address",
  "sev": "${sev}",
  "time": "HH:MM",
  "date": "DDMMYYYY",
  "win": "HH:MM - HH:MM or Ongoing",
  "dur": "N hrs or TBD",
  "sys": "Full official system name",
  "reason": "One concise sentence describing the incident",
  "noImpact": false,
  "features": [
    { "n": "Short feature name", "i": "Customer-facing impact", "hideFromStep1": false, "hideFromStep2": false }
  ],
  "email": "Full realistic text"
}

Include 2-4 features relevant to the ${domain} domain and ${system} system. Feature names should be 2-4 words. Keep the email field realistic but under 200 words.`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const clean = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  const signal = JSON.parse(clean);
  return NextResponse.json({ signal });
}
