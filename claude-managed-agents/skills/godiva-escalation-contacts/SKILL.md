---
name: Godiva Escalation Contacts
description: Role-based escalation contacts for Project Godiva incidents — who to notify by severity tier and domain, with escalation paths and after-hours rules.
---

# Godiva Escalation Contacts

Defines who to notify and how during a Godiva incident, organised by role and domain. This skill defines **roles and escalation logic** — actual contact details are maintained in the internal SP Group directory.

## Primary Approvers (All Incidents)

| Role | Responsibility | Required For |
|---|---|---|
| Product Lead | Business approval, customer comms sign-off | Critical, Major, Minor |
| Engineering Lead | Technical approval, blast radius sign-off | Critical, Major |

Both the Product Lead and Engineering Lead must be reachable before execution on Critical and Major incidents. If either is unavailable, escalate to their backup before proceeding.

## Domain Owners (Specialist Escalation)

When an incident is ambiguous or spans multiple domains, escalate to the domain owner before finalising severity and bundle selection.

| Domain | Domain Owner Role | Escalate When |
|---|---|---|
| Payment | Payments Product Manager | PAYNOW_OUTAGE, CARD_OUTAGE, GIRO_OUTAGE, UNIDOLLAR_OUTAGE |
| Core / SAP | Core Systems Engineer | SAP_OUTAGE, UTILITIES_OUTAGE, EAM_OUTAGE |
| Infrastructure | Platform Lead | INF_TKG_OUTAGE, INF_WINTEL_OUTAGE, INF_AUTOMIC_OUTAGE |
| MyTengah | MyTengah Product Manager | TEN_FULL_OUTAGE, TEN_FCUPAYMENT_OUTAGE |
| Channel / uPortal | Portal Product Manager | UPO_FULL_OUTAGE, UPO_UTILITIES_OUTAGE |
| Support | Customer Experience Lead | SUPPORT_DEGRADED, ALL_ACCOUNT_OUTAGE |
| EV | EV Product Manager | INF_EV_OUTAGE |
| Content | Content Platform Manager | INF_BANNER_MAINT, INF_MGC_OUTAGE, INF_GREENUP_OUTAGE |

## Escalation Path by Severity

### Critical
1. Page Product Lead immediately — phone call, not Slack
2. Page Engineering Lead immediately — phone call, not Slack
3. Both approvals required within 1 hour of incident confirmation
4. If either is unreachable within 15 minutes, escalate to their designated backup
5. Notify Domain Owner in parallel (does not block approval)

### Major
1. Notify Product Lead and Engineering Lead via Slack DM
2. If no response within 10 minutes, follow up by phone
3. Both approvals required before execution
4. Notify Domain Owner as FYI

### Minor
1. Notify Product Lead via Slack DM
2. Product Lead approval is sufficient — no phone escalation needed
3. Domain Owner notification optional

## After-Hours Rules

Outside business hours (before 08:00 or after 20:00 SGT) and on weekends/public holidays:

| Severity | After-Hours Action |
|---|---|
| Critical | Always phone — no exceptions. Do not wait until morning. |
| Major | Phone if the system has been down for more than 30 minutes with no vendor ETA |
| Minor | Can wait until next business day unless it escalates to Major |

## Vendor Escalation

When a vendor's system fails to restore on time or the maintenance window deviates from what was advised:
1. Escalate internally to Engineering Lead immediately
2. Contact vendor via the emergency contact in the internal vendor directory
3. Set a 30-minute reassessment timer — if not resolved, re-evaluate severity upward
