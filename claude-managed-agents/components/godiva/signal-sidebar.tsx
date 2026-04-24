"use client";

import { useState } from "react";
import { Mail, Zap, MousePointer, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useGodiva } from "@/components/godiva/godiva-context";
import { ManualInjectPanel } from "@/components/godiva/manual-inject-panel";
import { SeverityBadge, SignalCountBadge } from "@/components/godiva/severity-badge";
import type { Signal } from "@/lib/godiva-data";

function SignalTypeIcon({ type }: { type: Signal["signalType"] }) {
  if (type === "monitoring_alert")
    return <Zap className="size-3 shrink-0" style={{ color: "#e07b3a" }} />;
  if (type === "manual_trigger")
    return <MousePointer className="size-3 shrink-0" style={{ color: "#9b72cf" }} />;
  if (type === "maintenance_email")
    return <Mail className="size-3 shrink-0" style={{ color: "#5b9bd5" }} />;
  return null;
}

async function analyzeSignal(
  signal: Signal,
  dispatch: ReturnType<typeof useGodiva>["dispatch"],
  setLocalError: (id: number, msg: string) => void,
) {
  // Select signal first if not already selected
  dispatch({ type: "SELECT_SIGNAL", signalId: signal.id });

  try {
    const res = await fetch("/api/godiva/analyze-signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signal }),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setLocalError(signal.id, json.error ?? "Analysis failed");
      dispatch({ type: "ANALYSIS_ERROR" });
      return;
    }

    const { sessionId, workflowRunId } = (await res.json()) as {
      sessionId: string;
      workflowRunId: string;
    };
    dispatch({ type: "ANALYSIS_START", sessionId, workflowRunId });
  } catch (err) {
    setLocalError(signal.id, String(err));
    dispatch({ type: "ANALYSIS_ERROR" });
  }
}

export function SignalSidebar() {
  const { state, dispatch, signals } = useGodiva();
  const [localErrors, setLocalErrors] = useState<Record<number, string>>({});
  const [injectOpen, setInjectOpen] = useState(false);

  function setLocalError(id: number, msg: string) {
    setLocalErrors((prev) => ({ ...prev, [id]: msg }));
  }

  return (
    <div
      style={{
        width: "clamp(200px, 25vw, 255px)",
        minWidth: 200,
        flexShrink: 0,
        background: "var(--gv-sb)",
        borderRight: "1px solid var(--gv-bdr)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 14px 12px",
          borderBottom: "1px solid var(--gv-bdr)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "var(--gv-tx3)",
            textTransform: "uppercase",
            letterSpacing: ".1em",
          }}
        >
          Signal intake
        </span>
        <SignalCountBadge count={signals.length} />

        {state.demoMode && (
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 500,
              color: "#4caf72",
            }}
          >
            <span className="live-dot" />
            LIVE
          </span>
        )}
      </div>

      {/* Signal list */}
      <div
        style={{
          flex: 1,
          padding: 8,
          overflowY: "auto",
        }}
      >
        {signals.map((s) => {
          const isActive = state.selectedSignalId === s.id;
          return (
            <div
              key={s.id}
              onClick={() => dispatch({ type: "SELECT_SIGNAL", signalId: s.id })}
              className={s.isNew ? "signal-new" : undefined}
              style={{
                padding: "10px 11px",
                borderRadius: 10,
                cursor: "pointer",
                marginBottom: 3,
                border: `1px solid ${isActive ? "var(--gv-acc-bg)" : "transparent"}`,
                background: isActive ? "var(--gv-card)" : "transparent",
                boxShadow: isActive ? "0 1px 4px rgba(139,92,56,.08)" : "none",
                transition: "all .12s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.background = "var(--gv-card)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gv-bdr)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 2,
                }}
              >
                <SignalTypeIcon type={s.signalType} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--gv-tx1)",
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.domain}
                </span>
                {s.isNew && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#4caf72",
                      background: "rgba(76,175,114,.12)",
                      borderRadius: 4,
                      padding: "1px 5px",
                      letterSpacing: ".05em",
                      flexShrink: 0,
                    }}
                  >
                    NEW
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--gv-tx3)",
                  marginBottom: 5,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.from}
              </div>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <SeverityBadge sev={s.sev} noImpact={s.noImpact} />
                <span
                  style={{ fontSize: 10, color: "var(--gv-tx3)", marginLeft: "auto" }}
                >
                  {s.time}
                </span>
              </div>

              {/* Analyze button — shown when this signal is selected */}
              {isActive && (() => {
                const isAnalyzing =
                  state.analysisStatus === "analyzing";
                const isReady = state.analysisStatus === "ready";
                const hasError = state.analysisStatus === "error" || !!localErrors[s.id];

                return (
                  <div style={{ marginTop: 8 }}>
                    {isReady ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11,
                          color: "#4caf72",
                          fontWeight: 500,
                        }}
                      >
                        <CheckCircle2 className="size-3" />
                        Analysis ready
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAnalyzing) {
                            void analyzeSignal(s, dispatch, setLocalError);
                          }
                        }}
                        disabled={isAnalyzing}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 500,
                          color: isAnalyzing ? "var(--gv-tx3)" : "var(--gv-acc)",
                          background: "var(--gv-acc-bg)",
                          border: "1px solid var(--gv-bdr)",
                          borderRadius: 7,
                          padding: "4px 9px",
                          cursor: isAnalyzing ? "default" : "pointer",
                          width: "100%",
                          justifyContent: "center",
                        }}
                      >
                        {isAnalyzing ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Sparkles className="size-3" />
                        )}
                        {isAnalyzing ? "Analyzing…" : hasError ? "Retry analysis" : "Analyze with AI"}
                      </button>
                    )}
                    {hasError && !isAnalyzing && (
                      <div style={{ fontSize: 10, color: "#e07b3a", marginTop: 4 }}>
                        {localErrors[s.id] ?? "Analysis failed — try again"}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Inject panel / trigger */}
      {injectOpen ? (
        <ManualInjectPanel onClose={() => setInjectOpen(false)} />
      ) : (
        <button
          onClick={() => setInjectOpen(true)}
          style={{
            margin: "0 8px 8px",
            padding: "7px 0",
            borderRadius: 8,
            border: "1px dashed var(--gv-bdr)",
            background: "transparent",
            color: "var(--gv-tx3)",
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--gv-tx1)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gv-tx3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--gv-tx3)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gv-bdr)";
          }}
        >
          + Inject signal
        </button>
      )}
    </div>
  );
}
