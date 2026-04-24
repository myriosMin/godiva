"use client";

import { GodivaProvider } from "@/components/godiva/godiva-context";
import { SignalSidebar } from "@/components/godiva/signal-sidebar";
import { WorkflowPanel } from "@/components/godiva/workflow-panel";

export function GodivaPanel() {
  return (
    <GodivaProvider>
      <div className="godiva" style={{ display: "flex", height: "100dvh" }}>
        <SignalSidebar />
        <WorkflowPanel />
      </div>
    </GodivaProvider>
  );
}
