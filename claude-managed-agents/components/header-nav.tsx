"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock, Ellipsis, LogIn, Play, Plus, Square, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { UserMenu } from "@/components/user-menu";
import { SignInModal } from "@/components/sign-in-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGodiva } from "@/components/godiva/godiva-context";
import { cn } from "@/lib/utils";

interface SessionListItem {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface ViewerData {
  name: string;
  email: string;
  image?: string | null;
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function HistoryPopover({
  viewer,
  initialSessions,
}: {
  viewer: ViewerData | null;
  initialSessions: SessionListItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/managed-agents/sessions");
      if (!res.ok) return;
      const data: { sessions?: SessionListItem[] } = await res.json();
      setSessions(data.sessions ?? []);
    } catch {
      // best effort
    }
  }, []);

  useEffect(() => {
    if (!viewer) return;
    void refresh();
    const id = setInterval(() => void refresh(), 5_000);
    return () => clearInterval(id);
  }, [viewer, refresh]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        const res = await fetch(
          `/api/managed-agents/session?sessionId=${encodeURIComponent(sessionId)}`,
          { method: "DELETE" },
        );
        if (!res.ok) return;
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (pathname === `/chat/${sessionId}`) router.push("/");
      } catch {
        // best effort
      }
    },
    [pathname, router],
  );

  const selectedId = pathname.startsWith("/chat/")
    ? (pathname.split("/")[2] ?? null)
    : null;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "cursor-pointer gap-1.5",
        )}
        aria-label="Chat history"
      >
        <Clock className="size-3.5" />
        History
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="w-72 gap-0 p-0"
      >
        <div className="border-b border-border/50 px-2 py-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="size-4" />
            New question
          </Link>
        </div>
        <div className="max-h-80 overflow-y-auto px-2 py-2">
          {sessions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No sessions yet
            </p>
          ) : (
            sessions.map((session) => {
              const active = selectedId === session.id;
              return (
                <div
                  key={session.id}
                  className={cn(
                    "group/session relative mb-0.5 rounded-lg transition-colors",
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Link
                    href={`/chat/${session.id}`}
                    className="block px-2 py-1.5 pr-8 text-sm"
                  >
                    <div className="truncate font-medium">
                      {session.title || "Untitled"}
                    </div>
                    <div
                      className="truncate text-[11px] text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {formatTimeAgo(session.updatedAt)}
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-0 transition-opacity hover:bg-muted group-hover/session:opacity-100 data-[popup-open]:opacity-100 cursor-pointer"
                      aria-label="Session options"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Ellipsis className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom">
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => void deleteSession(session.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function HeaderNav({
  viewer,
  initialSessions,
}: {
  viewer?: ViewerData | null;
  initialSessions?: SessionListItem[];
}) {
  const { data: session, isPending } = authClient.useSession();
  const [showSignIn, setShowSignIn] = useState(false);
  const { state, dispatch } = useGodiva();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <span className="text-sm font-semibold tracking-wide">Godiva</span>

      <div className="flex items-center gap-2">
        {viewer !== undefined && (
          <HistoryPopover
            viewer={viewer ?? null}
            initialSessions={initialSessions ?? []}
          />
        )}

        <Button
          variant={state.demoMode ? "default" : "outline"}
          size="sm"
          className="gap-1.5 cursor-pointer"
          onClick={() => dispatch({ type: "SET_DEMO_MODE", on: !state.demoMode })}
        >
          {state.demoMode ? (
            <>
              <Square className="size-3 fill-current" />
              Stop Demo
            </>
          ) : (
            <>
              <Play className="size-3 fill-current" />
              Start Demo
            </>
          )}
        </Button>

        {!isPending &&
          (session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 cursor-pointer"
                onClick={() => setShowSignIn(true)}
              >
                <LogIn className="size-4" />
                Sign in
              </Button>
              <SignInModal open={showSignIn} onOpenChange={setShowSignIn} />
            </>
          ))}
      </div>
    </header>
  );
}
