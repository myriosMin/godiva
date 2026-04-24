import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Godiva AI signal classifier for SP Group (Singapore utility company).

## System Mapping
| Affected System | Domain | Bundle |
|---|---|---|
| UOB PayNow API / PayNow | Payment | PAYNOW_OUTAGE |
| MPGS / Mastercard Gateway | Payment | CARD_OUTAGE |
| eGIRO / GIRO backend | Payment | GIRO_OUTAGE |
| UOB UNI$ | Payment | UNIDOLLAR_OUTAGE |
| PPMS | Payment | PPMS_OUTAGE |
| SAP EBS / SAP MSSL / SAP billing | Core | SAP_OUTAGE |
| MDMS / smart meter | Core | SMRD_DEGRADED |
| SAP HEC / SAP EAM | Core | EAM_OUTAGE |
| Jarvis / Yggdrasil / SAP EBS+MSSL combined | Core | UTILITIES_OUTAGE |
| Yggdrasil (portal layer) | Channel | UPO_FULL_OUTAGE |
| K2 / CFMS | Support | SUPPORT_DEGRADED |
| BCAS / EBS (account) | Support | ALL_ACCOUNT_OUTAGE |
| EVA backend | EV | INF_EV_OUTAGE |
| Magnolia CMS | Content | INF_BANNER_MAINT |
| Jarvis (MyTengah) | MyTengah | TEN_FULL_OUTAGE |
| CCUS | MyTengah | TEN_COOLING_DEGRADED |
| Frieza endpoint | MyTengah | TEN_FCUPAYMENT_OUTAGE |
| TKG / Kubernetes | Infrastructure | INF_TKG_OUTAGE |
| Automic | Infrastructure | INF_AUTOMIC_OUTAGE |
| All systems / full outage | Cross | INF_FULL_OUTAGE |

## Severity Tiers
- critical: Core payment or utility completely unavailable. Large segment affected. (PayNow, Card, SAP billing, full outages)
- major: Specific feature/payment method unavailable. Defined segment affected. (GIRO, UNI$, EAM, live chat, EV)
- minor: Secondary feature unavailable. Core payments still work. (Smart meter data, banners, GreenUP)

## Output Rules
- Set noImpact: true only if the signal explicitly states there will be NO customer impact
- features: 2-4 items relevant to the affected system; each "n" is 2-4 words, "i" is the customer-facing impact
- win: maintenance window as "HH:MM - HH:MM" (SGT), or "Ongoing" for live alerts
- dur: duration as "N hrs", "N mins", or "TBD"
- confidence: "high" if system/bundle mapping is unambiguous, "medium" if you inferred, "low" if unclear

Return ONLY a JSON object — no markdown, no explanation.`;

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Classify this operational signal and return a JSON object with exactly these fields:
{
  "sys": "full official system name",
  "reason": "one concise sentence describing the incident",
  "sev": "critical | major | minor",
  "domain": "Payment | Core | Channel | Support | EV | Content | MyTengah | Infrastructure | Cross",
  "bundle": "BUNDLE_NAME from the mapping table",
  "features": [{ "n": "short feature name", "i": "customer-facing impact", "hideFromStep1": false, "hideFromStep2": false }],
  "noImpact": false,
  "confidence": "high | medium | low",
  "win": "HH:MM - HH:MM or Ongoing",
  "dur": "N hrs or TBD"
}

Signal text:
${text}`,
      },
    ],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const clean = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  try {
    const classification = JSON.parse(clean);
    return NextResponse.json({ classification });
  } catch {
    return NextResponse.json({ error: "parse failed", raw }, { status: 400 });
  }
}
