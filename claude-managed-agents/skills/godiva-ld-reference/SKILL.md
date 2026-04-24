---
name: Godiva LD Reference
description: Authoritative lookup table mapping systems and functions to LaunchDarkly feature flag bundles, dependencies, customer impact, and severity for Project Godiva incident response.
---

# Godiva LaunchDarkly Bundle Reference

Authoritative lookup table mapping systems and functions to LaunchDarkly feature flag bundles, dependencies, customer impact, and severity for Project Godiva incident response.

## How to Use

When a system outage is identified, find the matching row by Domain or Function. The **Bundle Name** is what gets activated in LaunchDarkly. Toggle all listed FE flags simultaneously. Check severity to determine approval requirements before executing.

## Bundle Reference Table

### Payment Domain

| Function | Bundle Name | BE Dependency | FE Flags | Customer Impact | Severity |
|---|---|---|---|---|---|
| PayNow Payment | PAYNOW_OUTAGE | UOB PayNow API | pay_now, bill_pay_button, ppms_paynow | PayNow disappears from payment screen. Customer cannot pay bill via PayNow. | Critical |
| Credit & Debit Card Payment | CARD_OUTAGE | MPGS / UOB | credit_cards, fetch_credit_cards, manage_card, init_auth | Customer cannot pay by card, add, remove or manage cards. | Critical |
| GIRO Link Account | GIRO_OUTAGE | eGIRO backend | giro | Customer cannot set up or manage GIRO. | Major |
| UNI$ Payment | UNIDOLLAR_OUTAGE | UOB UNI$ | und | Customer cannot use UNI$ loyalty points to pay. | Major |
| Prepaid Meter (PPMS) | PPMS_OUTAGE | PPMS dependency | ppms, ppms_paynow | Prepaid meter customers cannot top up meter credit via PayNow. | Major |

### Core Domain

| Function | Bundle Name | BE Dependency | FE Flags | Customer Impact | Severity |
|---|---|---|---|---|---|
| Billing & SAP Charts | SAP_OUTAGE | SAP EBS / SAP MSSL | billing_enabled, sap_chart_enabled, elec_sap_chart, home_chart | Customer cannot view bill. Yearly electricity, water and gas charts gone. | Critical |
| Smart Meter & Usage Data | SMRD_DEGRADED | MDMS | smrd, elec_ami_chart | Customer sees incomplete or stale usage data. AMI and home charts unavailable. App still loads. | Minor |
| EAM Asset Management | EAM_OUTAGE | SAP HEC / SAP EAM | eam_enabled | Customer cannot access EAM asset and service management features. | Major |
| Utilities (broad) | UTILITIES_OUTAGE | Jarvis / SAP EBS / SAP MSSL / Yggdrasil | jarvis, smrd, manage_shared_premises, elec_sap_chart, elec_ami_chart, home_chart | Home chart, utilities, green goals, carbon footprint, green credits, meter reading and bill services all down. MyTengah also goes down automatically. BLAST RADIUS: High (60+). | Critical |

### Channel Domain

| Function | Bundle Name | BE Dependency | FE Flags | Customer Impact | Severity |
|---|---|---|---|---|---|
| Portal (uPortal) Full Outage | UPO_FULL_OUTAGE | Yggdrasil | portal_enabled | Customer cannot log in or access uPortal at all. BLAST RADIUS: Highest (affects 13+ tracks). | Critical |
| Portal Utilities | UPO_UTILITIES_OUTAGE | Yggdrasil | utilities | Utilities section in uPortal unavailable. | Major |
| GreenUP Tab | INF_GREENUP_OUTAGE | Yggdrasil | greenup_tab, green_up_lifechallenges, advocado | Entire GreenUP tab in maintenance. NOTE: Toggle all 4 flags simultaneously. | Minor |

### Support Domain

| Function | Bundle Name | BE Dependency | FE Flags | Customer Impact | Severity |
|---|---|---|---|---|---|
| Live Chat & Messaging | SUPPORT_DEGRADED | K2 / CFMS | halp_livechat_hide, halp_livechat_maint, halp_message_hide, halp_message_maint, halp_reportInc_hide, halp_reportInc_maint | Customer cannot reach support via live chat, messaging, or report incident. NOTE: Toggle all 6 flags together. | Major |
| Account Services | ALL_ACCOUNT_OUTAGE | BCAS / EBS | account_enabled | Customer cannot access account, profile or settings. | Critical |

### EV Domain

| Function | Bundle Name | BE Dependency | FE Flags | Customer Impact | Severity |
|---|---|---|---|---|---|
| EV Charging | INF_EV_OUTAGE | EVA backend | jom_charge, infinity_ev | Customer cannot access JOM charge or any EV charging feature. | Major |

### Content Domain

| Function | Bundle Name | BE Dependency | FE Flags | Customer Impact | Severity |
|---|---|---|---|---|---|
| Home Banner & Ads | INF_BANNER_MAINT | Magnolia CMS | home_announcement_banner, infinity_ads | Home banner and ads disappear. No impact to core app features. | Minor |
| My Green Credits | INF_MGC_OUTAGE | Magnolia CMS | mgc_transaction_history | My Green Credits section in Bills tab disappears. | Minor |

### MyTengah Domain

| Function | Bundle Name | BE Dependency | FE Flags | Customer Impact | Severity |
|---|---|---|---|---|---|
| MyTengah Full App | TEN_FULL_OUTAGE | Jarvis | tengah | The entire MyTengah app is in maintenance. | Critical |
| MyTengah Cooling Chart | TEN_COOLING_DEGRADED | CCUS | ccus | Customer cannot view cooling consumption chart. | Minor |
| MyTengah FCU Payment | TEN_FCUPAYMENT_OUTAGE | Frieza endpoint | fcu_payment, frieza | Customer cannot pay for indoor cooling unit or access CCS servicing. | Major |
| MyTengah IDU Remote Pairing | TEN_ICU_OUTAGE | TBC | TBC | TBC — new bundle, confirm flags with engineering. | TBC |
| MyTengah Warranty & Servicing | TEN_WARRANTY_OUTAGE | Service Now / K2 | ewns_payment, websocket, service_now | Customer sees error on warranty and servicing screen. Real-time updates stop. | Major |
| MyTengah Frosty Services | TEN_FROSTY_OUTAGE | Frosty endpoint | frosty | Frosty-powered features in MyTengah unavailable. | Minor |

### Infrastructure Domain

| Function | Bundle Name | BE Dependency | FE Flags | Customer Impact | Severity |
|---|---|---|---|---|---|
| Kubernetes Infrastructure | INF_TKG_OUTAGE | TKG | infinity_app_enabled, portal_enabled | All apps potentially unavailable. SP App, UPortal, Kiosk, OEM, SSP, EMTR, DER all affected. BLAST RADIUS: Extremely high. | Critical |
| Job Scheduling & Automation | INF_AUTOMIC_OUTAGE | Automic | billing_enabled, pay_now | Backend scheduled jobs halt billing runs, data syncs, and payment processing — silent failures. SP App Payments, Kiosk, Open Account, EMTR affected. | Critical |
| Field & Workforce Management | INF_WWMS_OUTAGE | WWMS | TBC with frontend engineer | Kiosk, Open Account, Close Account and Reschedule Appointment affected. Customers cannot book or reschedule field appointments. | Major |
| Windows Server Infrastructure | INF_WINTEL_OUTAGE | WINTEL | portal_enabled, billing_enabled | Multiple portals and backend services affected: UPortal, Lumina, SP App Bill Services, Kiosk, OEM, SSP, MIMO, EMTR, DER. | Critical |
| Network & Meter Data | INF_NMS_DEGRADED | NMS / MDMS | smrd, elec_ami_chart | UPortal and SP App meter features degraded. Meter data incomplete or unavailable. | Minor |

### Cross-Cutting

| Function | Bundle Name | BE Dependency | FE Flags | Customer Impact | Severity |
|---|---|---|---|---|---|
| Full App Outage | INF_FULL_OUTAGE | All systems | infinity_app_enabled | Entire SP App replaced with maintenance screen. LAST RESORT ONLY. | Critical |
| GMP (Deprecated) | INF_GMP_DEPRECATED | Not in use | gmp_explore, gmp_home | No customer impact. Fully deprecated — do not activate. | None |

## Key Execution Notes

- **Simultaneous flag toggling**: For bundles with multiple FE flags (e.g., SUPPORT_DEGRADED, INF_GREENUP_OUTAGE), all flags in the bundle MUST be toggled at exactly the same time to avoid partial states.
- **Blast radius indicators**: Entries marked with high blast radius require extra caution — confirm with Engineering Lead before execution.
- **INF_FULL_OUTAGE**: Last resort only. Activating this replaces the entire SP App with a maintenance screen.
