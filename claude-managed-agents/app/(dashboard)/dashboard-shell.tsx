"use client";

import { HeaderNav } from "@/components/header-nav";
import { GodivaPanel } from "./godiva-panel";
import { GodivaProvider } from "@/components/godiva/godiva-context";
import { DemoController } from "@/components/godiva/demo-controller";
import { FeatureStatusBar } from "@/components/godiva/feature-status-bar";

interface ViewerData {
  name: string;
  email: string;
  image?: string | null;
}

interface SessionListItem {
  id: string;
  title: string | null;
  updatedAt: string;
}

export function DashboardShell({
  children,
  viewer,
  initialSessions,
}: {
  children: React.ReactNode;
  viewer: ViewerData | null;
  initialSessions: SessionListItem[];
}) {
  return (
    <GodivaProvider>
      <DemoController />
      <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden">
        <HeaderNav viewer={viewer} initialSessions={initialSessions} />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <GodivaPanel />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </div>

        <FeatureStatusBar />
      </div>
    </GodivaProvider>
  );
}
