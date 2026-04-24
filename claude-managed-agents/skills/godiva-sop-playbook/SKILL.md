---
name: Godiva SOP Playbook
description: Standard Operating Procedure templates for Critical, Major, and Minor incidents — including execution steps, approval gates, rollback instructions, and communication templates.
---

# Godiva SOP Playbook

Standard Operating Procedure templates for Project Godiva incident response. Use these templates to generate a complete, ready-to-execute SOP once a signal has been classified and a LaunchDarkly bundle identified.

## SOP Generation Rules

1. Always populate all fields — do not leave placeholders
2. Derive the maintenance window from signal intake data (start/end times in SGT)
3. State the exact bundle name and all FE flags to toggle
4. List approval chain based on severity (from godiva-severity-rules)
5. Always include rollback steps

## SOP Template: Critical Incident

```
INCIDENT SOP — CRITICAL
========================
Incident ID:    [auto-generated, e.g. INC-2026-001]
Generated:      [datetime SGT]
Status:         PENDING APPROVAL

INCIDENT SUMMARY
----------------
Signal Source:    [maintenance_email | monitoring_alert | manual_trigger]
Vendor / System:  [vendor name]
Affected System:  [backend system(s)]
Description:      [1–2 sentence plain-English summary of what is down]
Customer Impact:  [verbatim customer impact from LD reference table]
Channels Affected: [SP App / uPortal / Kiosk — list all that apply]

MAINTENANCE WINDOW
------------------
Start (SGT):  [YYYY-MM-DD HH:MM SGT]
End (SGT):    [YYYY-MM-DD HH:MM SGT]
Duration:     [X hours]
Planned:      [Yes / No — Adhoc if No]

CLASSIFICATION
--------------
Severity:     CRITICAL
Domain:       [Payment | Core | Channel | Support | Infrastructure | ...]
Bundle:       [BUNDLE_NAME]
Blast Radius: [Low | Medium | High | Extremely High]

APPROVAL GATE — REQUIRED BEFORE EXECUTION
-------------------------------------------
Required approvals (BOTH within 1 hour):
  [ ] Product Lead:      _________________________  Time: _______
  [ ] Engineering Lead:  _________________________  Time: _______

If approvals not received within 1 hour: ESCALATE IMMEDIATELY

EXECUTION STEPS
---------------
1. Confirm both approvals are obtained and logged above.
2. Log into LaunchDarkly production environment.
3. Navigate to Feature Flags > Bundles.
4. Locate bundle: [BUNDLE_NAME]
5. Toggle the following FE flags OFF simultaneously:
   [list each flag on its own line]
6. Verify flag states are all OFF in LaunchDarkly UI.
7. Perform smoke test: [describe what to check — e.g. "Open SP App, navigate to Payments, confirm PayNow option is hidden"]
8. Confirm with Ops team that customer-facing impact is as expected.
9. Record execution timestamp: _________________________

COMMUNICATION
-------------
Notify via [Slack channel / email]:
  "SERVICE UPDATE: [System] is currently under maintenance.
   Affected feature: [Customer impact description].
   Estimated restoration: [End time SGT].
   Tracking: [INC ID]"

ROLLBACK STEPS
--------------
If the incident resolves earlier than expected, or if the bundle application causes unexpected issues:
1. Return to LaunchDarkly > Bundles > [BUNDLE_NAME]
2. Toggle all flags listed above back ON simultaneously.
3. Verify flags are all ON in LaunchDarkly UI.
4. Perform smoke test to confirm feature is restored.
5. Notify Ops team of restoration.
6. Record rollback timestamp: _________________________

POST-INCIDENT
-------------
After system restoration:
1. Confirm all flags are back ON.
2. Update incident log with: actual start, actual end, duration, any deviations.
3. Flag for post-incident review if blast radius was High or Extremely High.
```

## SOP Template: Major Incident

```
INCIDENT SOP — MAJOR
=====================
Incident ID:    [auto-generated]
Generated:      [datetime SGT]
Status:         PENDING APPROVAL

INCIDENT SUMMARY
----------------
Signal Source:    [type]
Vendor / System:  [vendor]
Affected System:  [system(s)]
Description:      [1–2 sentence summary]
Customer Impact:  [from LD reference]
Channels Affected: [SP App / uPortal / Kiosk]

MAINTENANCE WINDOW
------------------
Start (SGT):  [datetime]
End (SGT):    [datetime]
Duration:     [X hours]
Planned:      [Yes / No]

CLASSIFICATION
--------------
Severity:     MAJOR
Domain:       [domain]
Bundle:       [BUNDLE_NAME]

APPROVAL GATE — REQUIRED BEFORE EXECUTION
-------------------------------------------
Required approvals:
  [ ] Product Lead:      _________________________  Time: _______
  [ ] Engineering Lead:  _________________________  Time: _______

EXECUTION STEPS
---------------
1. Confirm both approvals obtained.
2. Log into LaunchDarkly production.
3. Navigate to Feature Flags > Bundles.
4. Locate bundle: [BUNDLE_NAME]
5. Toggle the following FE flags OFF simultaneously:
   [list each flag]
6. Verify all flags are OFF.
7. Smoke test: [describe check]
8. Record execution timestamp: _________________________

ROLLBACK STEPS
--------------
1. Toggle all listed flags back ON simultaneously.
2. Verify ON state in LaunchDarkly.
3. Smoke test to confirm restoration.
4. Record rollback timestamp: _________________________
```

## SOP Template: Minor Incident

```
INCIDENT SOP — MINOR
=====================
Incident ID:    [auto-generated]
Generated:      [datetime SGT]
Status:         PENDING APPROVAL

INCIDENT SUMMARY
----------------
Signal Source:    [type]
Affected System:  [system]
Description:      [summary]
Customer Impact:  [from LD reference — note: core features still work]

MAINTENANCE WINDOW
------------------
Start (SGT):  [datetime]
End (SGT):    [datetime]

CLASSIFICATION
--------------
Severity:     MINOR
Domain:       [domain]
Bundle:       [BUNDLE_NAME]

APPROVAL GATE
-------------
Required approvals:
  [ ] Product Lead:  _________________________  Time: _______

EXECUTION STEPS
---------------
1. Confirm Product Lead approval.
2. Log into LaunchDarkly production.
3. Toggle flags OFF for bundle [BUNDLE_NAME]:
   [list flags]
4. Verify OFF state.
5. Record execution timestamp: _________________________

ROLLBACK
--------
Toggle all flags back ON when system is restored.
```

## Playbook: Multi-System Incidents

When multiple systems are affected simultaneously (e.g., SAP + Jarvis + MDMS):

1. Identify all bundles that apply
2. Classify severity as the HIGHEST severity among all affected bundles
3. Use that severity's approval gate for ALL bundles
4. Execute bundles in order: highest blast radius first
5. Smoke test after each bundle, not just at the end
6. List all bundle names and all flags in a single consolidated SOP

## Guardrails

- **Never execute INF_FULL_OUTAGE** without explicit written confirmation from both Product Lead and Engineering Lead — this is a last resort that replaces the entire SP App.
- **Simultaneous flag toggling is mandatory** for multi-flag bundles (SUPPORT_DEGRADED, INF_GREENUP_OUTAGE, etc.). Partial toggles create inconsistent UI states.
- **Blast radius check**: If blast radius is High or Extremely High, phone Engineering Lead rather than relying on async approval — do not wait passively.
- **Rollback readiness**: Always have the rollback tab open in LaunchDarkly before executing, so you can reverse instantly if needed.
