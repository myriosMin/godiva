---
name: Godiva Vendor Status URLs
description: Status page URLs and internal monitoring links for each vendor and system in the Godiva signal intake — used to cross-reference incidents before bundle execution.
---

# Godiva Vendor Status URLs

Reference list for verifying vendor and infrastructure status before or during a Godiva incident. Always cross-reference the live status page before executing a bundle — if a vendor has already resolved the issue, do not toggle flags.

## External Vendor Status Pages

| Vendor / System | Status Page | Region to Check |
|---|---|---|
| AWS (infrastructure) | https://health.aws.amazon.com/health/status | ap-southeast-1 (Singapore) — check EC2, EKS, RDS |
| SAP Cloud | https://www.sap.com/about/trust-center/cloud-service-status.html | Filter: Asia Pacific & Japan |
| Mastercard (MPGS) | https://developer.mastercard.com/status | Mastercard Payment Gateway Services |

## Banks and Payment Networks (No Public Status Page)

These vendors do not publish public status pages. Rely on maintenance emails and the internal vendor contact directory.

| Vendor | System | How to Verify |
|---|---|---|
| UOB | PayNow API, UNI$ | Maintenance email is authoritative; corroborate with internal telemetry |
| OCBC / eGIRO | GIRO API | Maintenance email; internal monitoring |
| PPMS operator | Prepaid meter top-up | Maintenance email; internal monitoring |
| Frieza / FCU | MyTengah cooling payment | Internal monitoring only |

## Internal System Monitoring

| System | Monitoring Source | What to Check |
|---|---|---|
| TKG / Kubernetes | Internal Datadog / PagerDuty | Cluster health, pod availability |
| Automic | Internal Automic console | Job scheduler status and queue depth |
| WWMS / field ops | Internal monitoring | Worker node connectivity |
| WINTEL / Windows Server | Internal monitoring | Service health by server group |
| NMS / MDMS | Internal Datadog | Network and meter data feed latency |
| Yggdrasil / Portal layer | Internal health check | uPortal availability and API response codes |
| Jarvis | Internal Datadog | MyTengah backend and utilities API |
| K2 / CFMS | Internal monitoring | Live chat and support messaging uptime |
| SAP EBS / MSSL | Internal SAP monitoring | Billing and account services |
| MDMS / smart meter | Internal Datadog | Smart meter data pipeline |

## Verification Checklist Before Execution

Before toggling any bundle, confirm all applicable items:

1. Vendor status page (if available) shows the relevant service as degraded or down
2. Internal monitoring corroborates the issue — do not rely solely on a vendor email
3. If vendor status page shows "Operational" but a maintenance email was received, treat the email as authoritative — pre-emptive action is valid for planned maintenance
4. If the status page shows the issue as resolved but the maintenance window is still open, hold execution and check with Engineering Lead
5. If multiple monitoring sources give conflicting signals, escalate to Engineering Lead before proceeding

## Restoration Check

After the maintenance window end time, check the vendor status page and internal monitoring to confirm restoration before triggering rollback. Do not roll back flags until the system is confirmed operational via at least one authoritative source.
