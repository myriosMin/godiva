---
name: Godiva Signal Schema
description: Extraction schema for parsing maintenance emails, monitoring alerts, and manual triggers into structured incident records for Project Godiva AI decisioning.
---

# Godiva Signal Intake Schema

Defines how to parse and extract structured information from incoming operational signals — maintenance emails, monitoring alerts, and manual triggers — for Project Godiva's AI decisioning layer.

## Signal Types

### Type 1: Maintenance Email

Emails from vendors or internal teams announcing planned downtime. Typically sent 24–72 hours in advance.

**Fields to extract**:

| Field | Description | Example |
|---|---|---|
| `signal_type` | Always `"maintenance_email"` for this type | `"maintenance_email"` |
| `vendor` | Organisation or team sending the notice | `"UOB"`, `"Mastercard"`, `"SAP"`, `"SP Group Ops"` |
| `subject` | Original email subject line | `"Scheduled Maintenance for UOB API Services"` |
| `affected_system` | Backend system(s) going down | `"UOB PayNow API"`, `"MPGS"`, `"SAP EBS"` |
| `maintenance_start` | ISO 8601 UTC datetime | `"2026-03-28T14:00:00Z"` |
| `maintenance_end` | ISO 8601 UTC datetime | `"2026-03-29T22:00:00Z"` |
| `maintenance_window_hours` | Duration in hours (derived) | `32` |
| `impact_description` | Raw description of what will be affected | `"PayNow transactions will be unavailable"` |
| `is_planned` | True if scheduled in advance, false if adhoc/emergency | `true` |
| `urgency` | `"planned"`, `"adhoc"`, or `"emergency"` | `"planned"` |
| `raw_excerpt` | Key paragraph(s) from email body verbatim | `"..."` |

**Parsing rules for emails**:
- Convert all times to SGT (UTC+8) for display, store as UTC internally
- If a time range spans multiple days, calculate `maintenance_window_hours`
- "Adhoc" or "emergency" in the subject → set `urgency: "emergency"` and `is_planned: false`
- Vendor aliases to normalise: "MPGS" = "Mastercard Gateway", "EBS" = "SAP EBS", "MSSL" = "SAP MSSL"

### Type 2: Monitoring Alert

System-generated alert from monitoring tools (e.g., Datadog, PagerDuty, internal alerting).

**Fields to extract**:

| Field | Description | Example |
|---|---|---|
| `signal_type` | Always `"monitoring_alert"` | `"monitoring_alert"` |
| `alert_name` | Name or title of the alert | `"PayNow API 5xx Rate Elevated"` |
| `affected_service` | Service or endpoint affected | `"UOB PayNow API"` |
| `severity_from_alert` | Alert's own severity label if present | `"P1"`, `"Critical"`, `"High"` |
| `error_rate` | Percentage or count of errors if given | `"45%"` |
| `started_at` | ISO 8601 UTC when alert fired | `"2026-04-24T03:12:00Z"` |
| `is_ongoing` | Whether the alert is still active | `true` |
| `alert_source` | Tool that generated the alert | `"Datadog"`, `"PagerDuty"` |

### Type 3: Manual Trigger

Operator-initiated signal from Product/Ops team (e.g., via Godiva UI or Slack).

**Fields to extract**:

| Field | Description | Example |
|---|---|---|
| `signal_type` | Always `"manual_trigger"` | `"manual_trigger"` |
| `triggered_by` | Person or team initiating | `"Ops Team"`, `"Product Lead"` |
| `description` | Free-text description of the incident | `"SAP is down, customers cannot see bills"` |
| `reported_at` | ISO 8601 UTC when reported | `"2026-04-24T08:30:00Z"` |
| `channel` | How it was reported | `"slack"`, `"email"`, `"godiva_ui"` |

## System Mapping

After extracting the signal, map `affected_system` to the LaunchDarkly domain. Use this lookup:

| Affected System (from signal) | Maps to Domain | Likely Bundle |
|---|---|---|
| UOB PayNow API / PayNow | Payment | PAYNOW_OUTAGE |
| MPGS / Mastercard Gateway | Payment | CARD_OUTAGE |
| eGIRO / GIRO backend | Payment | GIRO_OUTAGE |
| UOB UNI$ | Payment | UNIDOLLAR_OUTAGE |
| PPMS | Payment | PPMS_OUTAGE |
| SAP EBS / SAP MSSL / SAP billing | Core | SAP_OUTAGE |
| MDMS / smart meter | Core | SMRD_DEGRADED |
| SAP HEC / SAP EAM | Core | EAM_OUTAGE |
| Jarvis / Yggdrasil / SAP EBS+MSSL (combined) | Core | UTILITIES_OUTAGE |
| Yggdrasil (portal layer) | Channel | UPO_FULL_OUTAGE or UPO_UTILITIES_OUTAGE |
| K2 / CFMS | Support | SUPPORT_DEGRADED |
| BCAS / EBS (account) | Support | ALL_ACCOUNT_OUTAGE |
| EVA backend | EV | INF_EV_OUTAGE |
| Magnolia CMS | Content | INF_BANNER_MAINT or INF_MGC_OUTAGE |
| Jarvis (MyTengah) | MyTengah | TEN_FULL_OUTAGE |
| CCUS | MyTengah | TEN_COOLING_DEGRADED |
| Frieza endpoint | MyTengah | TEN_FCUPAYMENT_OUTAGE |
| Service Now / K2 (warranty) | MyTengah | TEN_WARRANTY_OUTAGE |
| TKG / Kubernetes | Infrastructure | INF_TKG_OUTAGE |
| Automic | Infrastructure | INF_AUTOMIC_OUTAGE |
| WWMS | Infrastructure | INF_WWMS_OUTAGE |
| WINTEL / Windows Server | Infrastructure | INF_WINTEL_OUTAGE |
| NMS / MDMS (network) | Infrastructure | INF_NMS_DEGRADED |
| All systems / full outage | Cross | INF_FULL_OUTAGE |

## Structured Output Format

After parsing any signal, produce a structured event record:

```json
{
  "signal_type": "maintenance_email | monitoring_alert | manual_trigger",
  "vendor": "string",
  "affected_system": "string",
  "mapped_domain": "Payment | Core | Channel | Support | EV | Content | MyTengah | Infrastructure | Cross",
  "recommended_bundle": "BUNDLE_NAME",
  "maintenance_start": "ISO8601 UTC or null",
  "maintenance_end": "ISO8601 UTC or null",
  "is_planned": true,
  "urgency": "planned | adhoc | emergency",
  "raw_excerpt": "verbatim key excerpt",
  "confidence": "high | medium | low",
  "notes": "any ambiguity or multi-system concerns"
}
```

Set `confidence: "low"` if the system mapping is ambiguous or if multiple bundles could apply — flag for human review.
