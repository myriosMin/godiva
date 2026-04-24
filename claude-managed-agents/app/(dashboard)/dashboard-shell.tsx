"use client";

import { useMemo } from "react";
import { SidebarContext } from "@/lib/sidebar-context";
import { GodivaPanel } from "./godiva-panel";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sidebar is removed; provide a static context so ChatPanel doesn't crash
  const sidebarCtx = useMemo(() => ({ open: true, toggle: () => {} }), []);

  return (
    <SidebarContext value={sidebarCtx}>
      <div className="flex h-dvh min-h-0 w-full overflow-hidden">
        {/* Left + Middle: Godiva signal intake + workflow panels */}
        <GodivaPanel />

        {/* Right: Chat interface */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarContext>
  );
}
