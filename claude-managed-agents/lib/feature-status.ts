export interface FeatureStatus {
  id: string;
  name: string;
  channel: string;
  up: boolean;
}

export const FEATURES: FeatureStatus[] = [
  // CX — uPortal / Lumina
  { id: "upportal", name: "uPortal", channel: "CX", up: true },
  { id: "lumina", name: "Lumina Admin", channel: "CX", up: true },
  // SP App
  { id: "app-consumption", name: "Consumption Chart", channel: "SP App", up: true },
  { id: "app-payments", name: "Payments", channel: "SP App", up: true },
  { id: "app-recurring", name: "Recurring Pay", channel: "SP App", up: true },
  { id: "app-bills", name: "Bill Services", channel: "SP App", up: true },
  // Kiosk
  { id: "kiosk", name: "Kiosk", channel: "Kiosk", up: true },
  // AM — OEM / Retailer
  { id: "oem-portal", name: "OEM eServices", channel: "AM", up: true },
  { id: "ssp-portal", name: "Retailer SSP", channel: "AM", up: true },
  { id: "pcw", name: "PCW", channel: "AM", up: true },
  // Cust Apps
  { id: "open-account", name: "Open Account", channel: "Cust Apps", up: true },
  { id: "close-account", name: "Close Account", channel: "Cust Apps", up: true },
  { id: "reschedule", name: "Reschedule Appt", channel: "Cust Apps", up: true },
  { id: "mimo", name: "MIMO", channel: "Cust Apps", up: true },
  // EMTR / DER
  { id: "emtr-payment", name: "EMTR Payment", channel: "EMTR", up: true },
  { id: "der-dashboard", name: "DER Dashboard", channel: "DER", up: true },
];

// In-memory state — resets on server restart (fine for demo)
const statusMap = new Map<string, boolean>(FEATURES.map((f) => [f.id, f.up]));

export function getFeatureStatuses(): FeatureStatus[] {
  return FEATURES.map((f) => ({ ...f, up: statusMap.get(f.id) ?? true }));
}

export function setFeatureStatus(id: string, up: boolean): boolean {
  if (!statusMap.has(id)) return false;
  statusMap.set(id, up);
  return true;
}

export function setAllFeatureStatuses(up: boolean): void {
  for (const id of statusMap.keys()) statusMap.set(id, up);
}
