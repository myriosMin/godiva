export interface Feature {
  n: string;
  i: string;
  hideFromStep1: boolean;
  hideFromStep2: boolean;
}

export interface Signal {
  id: number;
  domain: string;
  from: string;
  sev: "critical" | "major" | "minor";
  time: string;
  date: string;
  win: string;
  dur: string;
  sys: string;
  reason: string;
  noImpact: boolean;
  features: Feature[];
  email: string;
}

export interface BannerTemplate {
  id: number;
  scenario: string;
  title: string;
  body: string;
}

const PAY = [
  "paynow",
  "uob",
  "mpgs",
  "mastercard",
  "giro",
  "egiro",
  "credit card",
  "debit card",
  "card payment",
];

export function isPay(s: Signal): boolean {
  const t = (s.domain + " " + s.sys + " " + s.reason).toLowerCase();
  return PAY.some((k) => t.includes(k));
}

export function parseDateWin(s: Signal): { dateStr: string; timeStr: string } {
  const dd = s.date.substring(0, 2);
  const mm = s.date.substring(2, 4);
  const parts = s.win.split("-");
  return { dateStr: `${dd}-${mm}`, timeStr: parts[0] ? parts[0].trim() : s.win };
}

export function fillTmpl(
  tmpl: BannerTemplate,
  s: Signal,
): { title: string; body: string } {
  const { dateStr, timeStr } = parseDateWin(s);
  const body = tmpl.body
    .replace(/\[Date: DD-MM\]/g, dateStr)
    .replace(/\[Time: HH:MM\]/g, timeStr);
  return { title: tmpl.title, body };
}

export function autoPickTmpl(s: Signal): number {
  const t = (s.domain + " " + s.sys + " " + s.reason).toLowerCase();
  if (t.includes("fast")) return 1;
  if (t.includes("paynow") || t.includes("uob")) return 0;
  if (t.includes("card") || t.includes("mpgs") || t.includes("mastercard"))
    return 2;
  return 3;
}

export const TMPLS: BannerTemplate[] = [
  {
    id: 0,
    scenario: "PayNow intermittent maintenance",
    title: "Scheduled Maintenance",
    body: "Our payment partner will be conducting scheduled maintenance on [Date: DD-MM], [Time: HH:MM] SGT. PayNow QR transactions on [Date: DD-MM] [Time: HH:MM] SGT may take up to 1 day to be reflected on the SP app. EV Charging remains available. Thank you for your understanding.",
  },
  {
    id: 1,
    scenario: "FAST platform - PayNow QR unavailable",
    title: "Scheduled Maintenance",
    body: "Our payment partner will be conducting scheduled maintenance on [Date: DD-MM], [Time: HH:MM] SGT. PayNow QR service will not be available during the period. Please use alternative payment modes. EV Charging remains available. Thank you for your understanding.",
  },
  {
    id: 2,
    scenario: "Card payment unavailable",
    title: "Scheduled Maintenance",
    body: "Our payment partner will be conducting scheduled maintenance on [Date: DD-MM], [Time: HH:MM] SGT. Credit and debit card payments will not be available during this period. Please use PayNow or GIRO as alternative payment modes. Thank you for your understanding.",
  },
  {
    id: 3,
    scenario: "General system maintenance",
    title: "Scheduled Maintenance",
    body: "We will be performing scheduled system maintenance on [Date: DD-MM], [Time: HH:MM] SGT. Some features may be temporarily unavailable. We apologise for the inconvenience and thank you for your understanding.",
  },
];

export const SIGS: Signal[] = [
  {
    id: 1,
    domain: "PayNow",
    from: "uob-paynow@uob.com.sg",
    sev: "critical",
    time: "09:14",
    date: "25042026",
    win: "02:00 - 06:00",
    dur: "4 hrs",
    sys: "UOB PayNow API",
    reason: "Scheduled backend infrastructure upgrade",
    noImpact: false,
    features: [
      {
        n: "PayNow payment",
        i: "Payment screen — PayNow feature shows MAINTENANCE pill (disallows user from generating QR)",
        hideFromStep1: false,
        hideFromStep2: false,
      },
      {
        n: "Bill pay button",
        i: "Button greyed out (disallows user from generating QR)",
        hideFromStep1: true,
        hideFromStep2: true,
      },
      {
        n: "PPMS PayNow",
        i: "Prepaid top-up via PayNow shows MAINTENANCE pill (disallows user from generating QR)",
        hideFromStep1: false,
        hideFromStep2: false,
      },
    ],
    email:
      "From: uob-paynow@uob.com.sg\nTo: sp-operations@spgroup.com.sg\nSubject: [MAINTENANCE] UOB PayNow API - 25 Apr 2026\n\nDear SP Group Ops Team,\n\nUOB PayNow will undergo scheduled maintenance.\n\nDate:   25 April 2026 (Saturday)\nTime:   02:00 - 06:00 SGT (4 hours)\nSystem: UOB PayNow API\n\nImpact:\n  All PayNow transactions unavailable.\n  Customers cannot pay bills via PayNow.\n\nRegards,\nUOB Operations Team",
  },
  {
    id: 2,
    domain: "SAP / Billing",
    from: "sap-ops@sp.com.sg",
    sev: "critical",
    time: "11:30",
    date: "03052026",
    win: "00:00 - 04:00",
    dur: "4 hrs",
    sys: "SAP EBS / SAP MSSL",
    reason: "SAP database patch - monthly billing cycle maintenance",
    noImpact: false,
    features: [
      {
        n: "Billing enabled",
        i: "Customer cannot view bill",
        hideFromStep1: false,
        hideFromStep2: false,
      },
      {
        n: "SAP chart enabled",
        i: "Yearly charts unavailable",
        hideFromStep1: false,
        hideFromStep2: false,
      },
      {
        n: "Electricity chart",
        i: "Elec chart down",
        hideFromStep1: false,
        hideFromStep2: false,
      },
      {
        n: "Home chart",
        i: "Home overview down",
        hideFromStep1: false,
        hideFromStep2: false,
      },
    ],
    email:
      "From: sap-ops@sp.com.sg\nTo: sp-operations@spgroup.com.sg\nSubject: [MAINTENANCE] SAP EBS Monthly Patch - 3 May 2026\n\nHi Team,\n\nSAP EBS / SAP MSSL monthly patch maintenance.\n\nDate:   3 May 2026 (Sunday)\nTime:   00:00 - 04:00 SGT\nSystem: SAP EBS / SAP MSSL\n\nImpact:\n  Bill viewing unavailable. Yearly charts offline.\n\nSAP Operations",
  },
  {
    id: 3,
    domain: "Card Payment",
    from: "mpgs-ops@mastercard.com",
    sev: "critical",
    time: "14:05",
    date: "28042026",
    win: "23:00 - 03:00",
    dur: "4 hrs",
    sys: "MPGS / UOB",
    reason: "Payment gateway TLS certificate rotation",
    noImpact: false,
    features: [
      {
        n: "Credit cards",
        i: "Cannot pay by card",
        hideFromStep1: false,
        hideFromStep2: false,
      },
      {
        n: "Fetch credit cards",
        i: "Card list unavailable",
        hideFromStep1: false,
        hideFromStep2: false,
      },
      {
        n: "Manage card",
        i: "Add / remove disabled",
        hideFromStep1: false,
        hideFromStep2: false,
      },
      {
        n: "Init auth",
        i: "Auth flow blocked",
        hideFromStep1: false,
        hideFromStep2: false,
      },
    ],
    email:
      "From: mpgs-ops@mastercard.com\nTo: sp-operations@spgroup.com.sg\nSubject: URGENT - MPGS Mastercard Gateway Maintenance 28 Apr\n\nDear Partner,\n\nMastercard Payment Gateway Services (MPGS) TLS certificate rotation.\n\nDate:   28 April 2026\nWindow: 23:00 SGT (28 Apr) - 03:00 SGT (29 Apr)\n\nImpact: Credit and debit card transactions unavailable.\n\nMastercard MPGS Operations",
  },
  {
    id: 4,
    domain: "Live Chat",
    from: "k2-support@sp.com.sg",
    sev: "major",
    time: "16:22",
    date: "26042026",
    win: "22:00 - 02:00",
    dur: "4 hrs",
    sys: "K2 / CFMS",
    reason: "K2 workflow engine upgrade",
    noImpact: false,
    features: [
      {
        n: "Live chat",
        i: "Chat entry hidden",
        hideFromStep1: false,
        hideFromStep2: false,
      },
      {
        n: "Messaging",
        i: "Messaging disabled",
        hideFromStep1: false,
        hideFromStep2: false,
      },
      {
        n: "Report incident",
        i: "Disabled",
        hideFromStep1: false,
        hideFromStep2: false,
      },
    ],
    email:
      "From: k2-support@sp.com.sg\nTo: sp-operations@spgroup.com.sg\nSubject: [SCHEDULED] K2 Workflow Engine Upgrade - 26 Apr 2026\n\nHi SP Ops,\n\nK2 workflow engine upgrade.\n\nDate: 26 April 2026, 22:00 - 02:00 SGT\nSystem: K2 / CFMS\n\nImpact: Live chat, messaging and incident reporting unavailable.\n\nK2 Platform Team",
  },
  {
    id: 5,
    domain: "Home Banner",
    from: "cms-ops@sp.com.sg",
    sev: "minor",
    time: "08:45",
    date: "27042026",
    win: "10:00 - 12:00",
    dur: "2 hrs",
    sys: "Magnolia CMS",
    reason: "CMS config update - no customer-facing impact",
    noImpact: true,
    features: [
      {
        n: "Home banner slot",
        i: "Internal config refresh only",
        hideFromStep1: false,
        hideFromStep2: false,
      },
    ],
    email:
      "From: cms-ops@sp.com.sg\nTo: sp-operations@spgroup.com.sg\nSubject: CMS Config Update - No Customer Impact\n\nHi Team,\n\nCMS backend config update for home banner slot.\n\nDate: 27 April 2026, 10:00 - 12:00 SGT\n\nImpact: None to end customers.\n\nCMS Team",
  },
];
