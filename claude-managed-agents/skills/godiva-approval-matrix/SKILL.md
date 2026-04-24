---
name: Godiva Approval Matrix
description: Detailed approval workflow for Godiva execution — who approves what, what constitutes valid approval, delegation rules, split decisions, and the approval logging format.
---

# Godiva Approval Matrix

Defines exactly who must approve a Godiva action before execution, what counts as valid approval, and how to handle edge cases including approver unavailability, split decisions, and scope changes.

## Approval Requirements by Severity

| Severity | Approvers Required | Count | Time Constraint | Preferred Channel |
|---|---|---|---|---|
| Critical | Product Lead + Engineering Lead | Both (2/2) | Both within 1 hour of incident confirmation | Phone call |
| Major | Product Lead + Engineering Lead | Both (2/2) | Prompt — no hard deadline, but do not delay | Slack DM; phone if no response in 10 min |
| Minor | Product Lead | Product Lead only (1/1) | Prompt | Slack DM |

## What Counts as Valid Approval

Valid approval is an explicit, traceable confirmation that the approver has reviewed:
1. The incident summary — what is down and which customers are affected
2. The proposed bundle — which flags will be toggled
3. The blast radius — Low / Medium / High / Extremely High

The approval must include the approver's name, the timestamp (SGT), and an unambiguous "approve." Phrases such as "go ahead", "confirmed", and "do it" are valid.

**Invalid approval examples**:
- Ambiguous responses: "sure", "ok maybe", "talk to X first"
- Approval from someone other than the designated role
- Approval granted after execution has already started
- Implicit approval (no response treated as consent)

## High Blast Radius Overrides

For the following bundles, additional confirmation is required even if severity alone would not mandate it:

| Bundle | Extra Requirement |
|---|---|
| INF_FULL_OUTAGE | Written explicit confirmation required; phone call mandatory — this is last resort |
| INF_TKG_OUTAGE | Engineering Lead must be on a live call during execution |
| UPO_FULL_OUTAGE | Confirm impact to all 13+ portal tracks with Portal PM before executing |
| UTILITIES_OUTAGE | Confirm MyTengah cascade impact with MyTengah PM before executing |
| INF_WINTEL_OUTAGE | Confirm full impact list (UPortal, Kiosk, OEM, SSP, MIMO, EMTR, DER) with Engineering Lead |

## Delegation Rules

If a required approver is unavailable:

| Scenario | Action |
|---|---|
| Product Lead unreachable for Critical (>15 min) | Escalate to Product Lead's designated Deputy |
| Engineering Lead unreachable for Critical (>15 min) | Escalate to Platform Lead as Engineering backup |
| Both unavailable for Critical | Do NOT execute — escalate to senior leadership and document the gap |
| Product Lead unavailable for Major (>20 min) | Escalate to Deputy Product Lead |
| Engineering Lead unavailable for Major (>20 min) | Escalate to Platform Lead |
| Product Lead unavailable for Minor (>30 min) | Escalate to Product Manager |

**Do not self-approve.** The operator submitting the action cannot be one of the approvers.

## Split Decision Handling

| Scenario | Resolution |
|---|---|
| Engineering Lead approves, Product Lead declines | Do NOT execute. Product Lead holds the business veto. |
| Product Lead approves, Engineering Lead declines | Do NOT execute. Engineering Lead holds the technical veto. |
| Approver requests more information | Pause execution. Provide the requested information and restart the approval clock. |
| Approver approves but requests scope reduction | Revise the bundle before executing — do not execute the original scope. |
| Approver approves with a condition | Treat as conditional — satisfy the condition first, then confirm with the approver before executing. |

## Approval Timeline for Critical Incidents

The 1-hour clock starts from **incident confirmation** — when the signal has been parsed, severity classified, and bundle identified. Not from when the email was received.

| Time | Action |
|---|---|
| T+0 | Incident confirmed. Approval requests sent to both approvers. |
| T+15 | If either approver has not responded, call their phone. |
| T+30 | If still no response, escalate to designated backup. |
| T+60 | Hard deadline. If both approvals are not obtained, escalate to senior leadership. Do NOT execute without approval. |

## Approval Log Format

Every execution must have an approval record logged before any flags are toggled. Log the following:

```
Service Event ID:   [INC-YYYY-NNN]
Severity:           [Critical / Major / Minor]
Bundle:             [BUNDLE_NAME]
Blast Radius:       [Low / Medium / High / Extremely High]

Approver 1 (Product Lead):
  Name:      _________________________
  Timestamp: [HH:MM SGT, YYYY-MM-DD]
  Channel:   [phone / Slack / email]

Approver 2 (Engineering Lead, if required):
  Name:      _________________________
  Timestamp: [HH:MM SGT, YYYY-MM-DD]
  Channel:   [phone / Slack / email]

Operator (executing):
  Name:      _________________________
  Timestamp: [HH:MM SGT, YYYY-MM-DD]
```

This log is permanent and must be attached to the Service Event ID before execution begins.
