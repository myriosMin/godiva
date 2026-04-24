"use client";

import { useEffect, useRef } from "react";
import { useGodiva } from "@/components/godiva/godiva-context";
import type { Signal } from "@/lib/godiva-data";

const SCENARIOS = [
  {
    signalType: "monitoring_alert" as const,
    system: "UOB PayNow API",
    domain: "PayNow",
    sev: "critical",
  },
  {
    signalType: "maintenance_email" as const,
    system: "SAP EBS / SAP MSSL",
    domain: "SAP / Billing",
    sev: "critical",
  },
  {
    signalType: "manual_trigger" as const,
    system: "MPGS / Mastercard Gateway",
    domain: "Card Payment",
    sev: "critical",
  },
  {
    signalType: "maintenance_email" as const,
    system: "K2 / CFMS",
    domain: "Live Chat",
    sev: "major",
  },
  {
    signalType: "monitoring_alert" as const,
    system: "Magnolia CMS",
    domain: "Content",
    sev: "minor",
  },
];

export function DemoController() {
  const { state, dispatch } = useGodiva();
  const counterRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firingRef = useRef(false);

  useEffect(() => {
    if (!state.demoMode) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const fire = async () => {
      if (firingRef.current) return;
      firingRef.current = true;

      const scenario = SCENARIOS[counterRef.current % SCENARIOS.length];
      counterRef.current++;

      try {
        const res = await fetch("/api/godiva/generate-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scenario),
        });
        if (!res.ok) return;
        const { signal } = (await res.json()) as { signal: Signal };
        const id = Date.now();
        dispatch({
          type: "ADD_SIGNAL",
          signal: { ...signal, id, isNew: true, signalType: scenario.signalType },
        });
        setTimeout(
          () => dispatch({ type: "MARK_SIGNAL_SEEN", signalId: id }),
          4000
        );
      } catch {
        // skip on network error
      } finally {
        firingRef.current = false;
      }
    };

    fire();
    intervalRef.current = setInterval(fire, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.demoMode, dispatch]);

  return null;
}
