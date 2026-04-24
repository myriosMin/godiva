"use client";

import { useEffect, useRef } from "react";
import { useGodiva, useCurrentSignal, type AgentRecommendation } from "@/components/godiva/godiva-context";
import { StepEventDetails } from "@/components/godiva/step-event-details";
import { StepWorkflowConfig } from "@/components/godiva/step-workflow-config";
import { StepApproval } from "@/components/godiva/step-approval";
import { StepSummary } from "@/components/godiva/step-summary";
import { GButton } from "@/components/godiva/g-button";

const TABS = [
  "1. Event details",
  "2. Workflow config",
  "3. Approval",
  "4. Summary",
];

function useRecommendationStream() {
  const { state, dispatch } = useGodiva();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (state.analysisStatus !== "analyzing" || !state.agentWorkflowRunId) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    async function listen() {
      try {
        const res = await fetch(`/api/readable/${state.agentWorkflowRunId}`, {
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          dispatch({ type: "ANALYSIS_ERROR" });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6)) as {
                type: string;
                payload?: unknown;
              };
              if (event.type === "godiva.recommendation") {
                dispatch({
                  type: "ANALYSIS_DONE",
                  recommendation: event.payload as AgentRecommendation,
                });
                ctrl.abort();
                return;
              }
            } catch {
              // malformed JSON line — skip
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          dispatch({ type: "ANALYSIS_ERROR" });
        }
      }
    }

    void listen();
    return () => ctrl.abort();
  }, [state.analysisStatus, state.agentWorkflowRunId, dispatch]);
}

export function WorkflowPanel() {
  const { state, dispatch } = useGodiva();
  const sig = useCurrentSignal();
  useRecommendationStream();

  if (!sig) {
    return (
      <div
        style={{
          width: "clamp(320px, 50vw, 500px)",
          flexShrink: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--gv-card)",
          borderRight: "1px solid var(--gv-bdr)",
          height: "100%",
        }}
      >
        <EmptyState />
      </div>
    );
  }

  const dd = sig.date.substring(0, 2);
  const mm = sig.date.substring(2, 4);
  const yyyy = sig.date.substring(4, 8);
  const formattedDate = `${dd}/${mm}/${yyyy}`;

  const isDone = state.approved || state.rejected;

  const canNext = !(
    state.step === 1 &&
    sig.noImpact &&
    !state.ackNoImpact
  );

  return (
    <div
      style={{
        width: "clamp(320px, 50vw, 500px)",
        flexShrink: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--gv-card)",
        borderRight: "1px solid var(--gv-bdr)",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          padding: "13px 18px",
          borderBottom: "1px solid var(--gv-bdr)",
          background: "var(--gv-card)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--gv-tx1)",
            letterSpacing: "-.01em",
          }}
        >
          Incident Command
        </div>
        <div style={{ fontSize: 11, color: "var(--gv-tx3)", marginTop: 3 }}>
          {sig.domain} · {formattedDate} · {sig.win}
        </div>
      </div>

      {/* Step tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--gv-bdr)",
          background: "var(--gv-card)",
          padding: "0 4px",
          flexShrink: 0,
        }}
      >
        {TABS.map((tab, i) => {
          const isActive = state.step === i;
          const isDoneTab = state.step > i;
          return (
            <div
              key={i}
              onClick={() => {
                if (i < state.step)
                  dispatch({
                    type: "SET_STEP",
                    step: i as 0 | 1 | 2 | 3,
                  });
              }}
              style={{
                padding: "10px 14px",
                fontSize: 12,
                color: isDoneTab
                  ? "var(--gv-ok)"
                  : isActive
                    ? "var(--gv-acc)"
                    : "var(--gv-tx3)",
                cursor: i < state.step ? "pointer" : "default",
                borderBottom: isActive
                  ? "2px solid var(--gv-acc)"
                  : "2px solid transparent",
                whiteSpace: "nowrap",
                transition: "color .12s",
                fontWeight: isActive ? 500 : undefined,
                letterSpacing: ".01em",
              }}
            >
              {tab}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div
        style={{
          flex: 1,
          padding: "16px 18px",
          overflowY: "auto",
          background: "var(--gv-bg)",
        }}
      >
        {state.step === 0 && <StepEventDetails />}
        {state.step === 1 && <StepWorkflowConfig />}
        {state.step === 2 && <StepApproval />}
        {state.step === 3 && <StepSummary />}
      </div>

      {/* Navigation */}
      <div
        style={{
          padding: "11px 18px",
          borderTop: "1px solid var(--gv-bdr)",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          background: "var(--gv-card)",
          flexShrink: 0,
        }}
      >
        {state.step > 0 && (
          <GButton
            variant="secondary"
            onClick={() => dispatch({ type: "PREV_STEP" })}
          >
            Back
          </GButton>
        )}
        {state.step < 3 && (
          <>
            {state.step === 2 && isDone ? (
              <GButton
                variant="primary"
                onClick={() => dispatch({ type: "NEXT_STEP" })}
              >
                View summary
              </GButton>
            ) : !isDone ? (
              <GButton
                variant="primary"
                onClick={() => dispatch({ type: "NEXT_STEP" })}
                disabled={!canNext}
              >
                Next
              </GButton>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
        color: "var(--gv-tx3)",
        fontSize: 13,
        padding: 48,
        background: "var(--gv-bg)",
        height: "100%",
      }}
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
      >
        <rect
          x="4"
          y="6"
          width="28"
          height="24"
          rx="4"
          stroke="#A89478"
          strokeWidth="1.5"
        />
        <line
          x1="10"
          y1="14"
          x2="26"
          y2="14"
          stroke="#A89478"
          strokeWidth="1.2"
        />
        <line
          x1="10"
          y1="19"
          x2="20"
          y2="19"
          stroke="#A89478"
          strokeWidth="1.2"
        />
      </svg>
      <span
        style={{
          color: "var(--gv-tx3)",
          fontSize: 13,
          letterSpacing: ".01em",
        }}
      >
        Select a maintenance signal
      </span>
    </div>
  );
}

