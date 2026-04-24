"use client";

import { useEffect, useRef } from "react";
import { SignalSidebar } from "@/components/godiva/signal-sidebar";
import { WorkflowPanel } from "@/components/godiva/workflow-panel";
import { useGodiva } from "@/components/godiva/godiva-context";
import type { AgentClassification } from "@/components/godiva/godiva-context";

function ClassificationEffect() {
  const { state, dispatch } = useGodiva();
  const signalEmailRef = useRef<string | null>(null);

  useEffect(() => {
    const id = state.selectedSignalId;
    if (!id) return;

    const sig = state.signals.find((s) => s.id === id);
    if (!sig?.email) return;

    signalEmailRef.current = sig.email;
    dispatch({ type: "SET_CLASSIFYING" });

    let cancelled = false;

    fetch("/api/godiva/classify-signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sig.email }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.classification) {
          dispatch({
            type: "SET_CLASSIFICATION",
            classification: data.classification as AgentClassification,
          });
        } else {
          dispatch({ type: "CLEAR_CLASSIFICATION" });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[godiva] classification request failed", err);
        dispatch({ type: "CLEAR_CLASSIFICATION" });
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedSignalId]);

  return null;
}

export function GodivaPanel() {
  return (
    <div className="godiva flex h-full min-h-0">
      <ClassificationEffect />
      <SignalSidebar />
      <WorkflowPanel />
    </div>
  );
}
