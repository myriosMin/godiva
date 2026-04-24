---
name: Godiva Severity Rules
description: Severity classification system for Project Godiva — Critical/Major/Minor tiers, approval gates, and blast radius guidance for incident response decisions.
---

# Godiva Severity Rules

Defines the severity classification system for Project Godiva service incidents — including what each tier means, who must approve execution, and how quickly action is required.

## Severity Tiers

### Critical

**Meaning**: Core payment or utility function completely unavailable. Large customer segment affected.

**Execution gate**: Product Lead + Engineering Lead must both approve. Both approvals required within 1 hour of incident confirmation. If approvals are not obtained within 1 hour, escalate immediately.

**Examples of Critical incidents**:
- PayNow payment system down (PAYNOW_OUTAGE)
- Card payment unavailable (CARD_OUTAGE)
- SAP billing and charts down (SAP_OUTAGE)
- Entire SP App unavailable (INF_FULL_OUTAGE)
- uPortal full outage (UPO_FULL_OUTAGE)
- Kubernetes infrastructure failure (INF_TKG_OUTAGE)
- Account services down (ALL_ACCOUNT_OUTAGE)
- Automic job scheduler failure (INF_AUTOMIC_OUTAGE)
- Windows server infrastructure (INF_WINTEL_OUTAGE)
- Utilities broad outage (UTILITIES_OUTAGE)
- MyTengah full app (TEN_FULL_OUTAGE)

### Major

**Meaning**: Specific feature or payment method unavailable. Defined customer segment affected.

**Execution gate**: Approval required from Product Lead + Engineering Lead before execution. No 1-hour hard deadline, but response should be prompt.

**Examples of Major incidents**:
- GIRO account linking down (GIRO_OUTAGE)
- UNI$ payment unavailable (UNIDOLLAR_OUTAGE)
- Prepaid meter top-up affected (PPMS_OUTAGE)
- EAM asset management down (EAM_OUTAGE)
- Portal utilities section down (UPO_UTILITIES_OUTAGE)
- Live chat and messaging degraded (SUPPORT_DEGRADED)
- EV charging unavailable (INF_EV_OUTAGE)
- MyTengah FCU payment down (TEN_FCUPAYMENT_OUTAGE)
- MyTengah warranty and servicing (TEN_WARRANTY_OUTAGE)
- Field workforce management (INF_WWMS_OUTAGE)

### Minor

**Meaning**: Secondary or informational feature unavailable. Core payments and utility access still work.

**Execution gate**: Product Lead approval only. Engineering Lead sign-off not required.

**Examples of Minor incidents**:
- Smart meter data degraded (SMRD_DEGRADED)
- GreenUP tab in maintenance (INF_GREENUP_OUTAGE)
- Home banner and ads hidden (INF_BANNER_MAINT)
- My Green Credits section down (INF_MGC_OUTAGE)
- MyTengah cooling chart unavailable (TEN_COOLING_DEGRADED)
- MyTengah Frosty services down (TEN_FROSTY_OUTAGE)
- Network and meter data degraded (INF_NMS_DEGRADED)

## Severity Decision Logic

When classifying an incident, apply this decision tree:

1. **Is a core payment method completely unavailable?** (PayNow, Card, SAP billing) → Critical
2. **Is the entire app or a major channel (uPortal, Kubernetes) down?** → Critical
3. **Is a specific payment method or defined feature unavailable for a segment?** → Major
4. **Is it a support/chat degradation or feature-level issue?** → Major
5. **Is it informational only, or does core app functionality still work?** → Minor
6. **No customer impact?** → No action / Deprecated

## Approval Workflow Summary

| Severity | Approvers Required | Time Constraint |
|---|---|---|
| Critical | Product Lead + Engineering Lead | Both within 1 hour |
| Major | Product Lead + Engineering Lead | Prompt, no hard deadline |
| Minor | Product Lead only | Prompt |

## Blast Radius Awareness

High blast radius incidents require extra care regardless of their severity classification:
- **INF_FULL_OUTAGE** — affects all customers, entire SP App. Last resort only.
- **INF_TKG_OUTAGE** — affects SP App, UPortal, Kiosk, OEM, SSP, EMTR, DER simultaneously.
- **UPO_FULL_OUTAGE** — affects 13+ tracks and all uPortal users.
- **UTILITIES_OUTAGE** — affects 60+ features including MyTengah cascade.
- **INF_WINTEL_OUTAGE** — affects UPortal, Lumina, SP App Bill Services, Kiosk, OEM, SSP, MIMO, EMTR, DER.

For high blast radius incidents, always confirm with Engineering Lead even if severity is Major.
