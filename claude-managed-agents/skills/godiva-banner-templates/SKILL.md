---
name: Godiva Banner Templates
description: Pre-approved customer-facing banner copy for Critical, Major, and Minor incidents by domain — ready for the Godiva banner generator, with tone and customisation rules.
---

# Godiva Banner Templates

Pre-approved customer-facing copy for in-app and portal banners published during a service incident. Use these templates in the banner generator. Customise only the [placeholder] fields — do not alter the approved structure or tone.

## Tone Rules

- **Plain English** — no technical jargon ("API", "backend", "TKG", "SAP", "LaunchDarkly" must never appear)
- **Factual and calm** — state the impact clearly without alarm or dramatic language
- **Action-oriented** — tell customers what to do if they are affected
- **No apologies in the title** — apologies belong in the body only
- **No estimated restoration time unless confirmed** — never commit to a time you are not certain of

## Critical Incident Templates

### Payment System Down

```
Title: Payment Temporarily Unavailable

We are currently experiencing issues with [payment method, e.g. PayNow / card payments].
We are working to restore this as soon as possible.

In the meantime, you may use [alternative payment method if available, otherwise omit this sentence].

We apologise for the inconvenience and will update you when service is restored.
```

### Full App Unavailable

```
Title: SP App Currently Unavailable

The SP App is currently experiencing a service disruption. We are actively investigating
and working to restore access as quickly as possible.

Please try again later. For urgent enquiries, contact our support line at 1800-222-2333.

We apologise for the inconvenience.
```

### Billing and Account Information Unavailable (SAP)

```
Title: Billing Information Temporarily Unavailable

We are currently unable to display your billing and usage information.
Payment processing and account access are unaffected.

Our team is working to resolve this. Please check back later.
```

## Major Incident Templates

### Specific Payment Method Unavailable

```
Title: [Payment Method] Currently Unavailable

[GIRO linking / UNI$ payments / prepaid meter top-up] is temporarily unavailable
[due to scheduled maintenance by our service provider / due to a technical issue].

Please use an alternative payment method[, or try again after [end time SGT] when service
is expected to resume]. [Omit estimated time if not confirmed.]

We apologise for any inconvenience.
```

### Portal Feature Unavailable (uPortal)

```
Title: [Feature] Temporarily Unavailable

[Utilities section / Account services / EV charging information] in the SP Utilities Portal
is temporarily unavailable.

Core app functions and payments are unaffected. We are working to restore this feature.
```

### EV Charging Information Unavailable

```
Title: EV Charging Information Unavailable

EV charging information is temporarily unavailable in the app.
Physical charging stations are unaffected — you may proceed to charge as normal.

We apologise for the inconvenience.
```

### Support / Live Chat Unavailable

```
Title: Live Chat Currently Unavailable

Our live chat service is temporarily unavailable. You can reach us at 1800-222-2333
or via email at customer_service@spgroup.com.sg.

We apologise for any inconvenience and aim to restore chat shortly.
```

### Account Services Unavailable

```
Title: Account Services Temporarily Unavailable

Some account features are temporarily unavailable. We are working to restore them promptly.

For urgent account queries, please contact us at 1800-222-2333.
```

## Minor Incident Templates

### Smart Meter / Usage Data Unavailable

```
Title: Usage Data Temporarily Unavailable

Your electricity and water usage data may not reflect the latest readings.
Core app functions and payments are working normally.

Data will refresh automatically once our systems are restored.
```

### Green Credits / GreenUP Under Maintenance

```
Title: Green Credits Temporarily Unavailable

The Green Credits / GreenUP section is currently under maintenance and will return shortly.
All other app features are working normally.
```

### Home Banner / Promotional Content Hidden

```
Title: Some Content Temporarily Unavailable

Some promotional content in the app is temporarily unavailable.
All account, payment, and utility features are working normally.
```

### MyTengah Cooling Chart Unavailable

```
Title: Cooling Usage Data Temporarily Unavailable

Your cooling usage chart is temporarily unavailable. Account access and payments are unaffected.
```

### MyTengah Frosty Services Unavailable

```
Title: Frosty Services Temporarily Unavailable

Frosty services are temporarily unavailable in the MyTengah app.
Account access and cooling payments are unaffected.
```

### Network / Meter Data Degraded

```
Title: Meter Data Temporarily Delayed

Some meter readings may be delayed or unavailable. Payments and account access are working normally.
Data will update automatically once systems are restored.
```

## Planned Maintenance Template (Any Severity)

Use when maintenance is pre-announced and the window is known:

```
Title: Scheduled Maintenance — [Feature]

[Feature / service] will be undergoing scheduled maintenance on [date] from [start time SGT]
to [end time SGT].

During this window, [specific customer impact in plain English]. All other SP App services
remain available.

We apologise for any inconvenience.
```

## Post-Restoration Template

After flags are rolled back and service is confirmed operational:

```
Title: Service Restored

[Feature / service] has been restored and is now operating normally. Thank you for your patience.
```

## Customisation Rules

- Always use SGT (Singapore Standard Time) — never UTC or GMT+8 in copy
- Use the plain-English feature name (e.g. "PayNow", "GIRO", "card payments") — never the LD bundle code
- If restoration time is unknown, omit any time estimate entirely — do not guess
- For MyTengah-specific incidents, replace "SP App" with "MyTengah app"
- For uPortal-specific incidents, replace "SP App" with "SP Utilities Portal"
- For incidents affecting both SP App and uPortal, list both: "SP App and SP Utilities Portal"
- The support number (1800-222-2333) should only appear in Critical banners or Support-domain incidents
