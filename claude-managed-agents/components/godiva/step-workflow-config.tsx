"use client";

import { useEffect, useState } from "react";
import { useGodiva, useCurrentSignal } from "@/components/godiva/godiva-context";
import { FeatureToggleRow, TogglePill } from "@/components/godiva/feature-toggle-row";
import { BannerGenerator } from "@/components/godiva/banner-generator";
import { isPay } from "@/lib/godiva-data";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function OkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15">
      <circle cx="7.5" cy="7.5" r="6.5" fill="#4A6B50" />
      <path
        d="M4.5 7.5l2.3 2.3L10.5 5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function StepWorkflowConfig() {
  const { state, dispatch } = useGodiva();
  const sig = useCurrentSignal();
  const isNarrow = useMediaQuery("(max-width: 599px)");
  if (!sig) return null;

  if (sig.noImpact) {
    if (state.ackNoImpact) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "10px 13px",
            background: "var(--gv-ok-bg)",
            borderRadius: 10,
            border: "1px solid rgba(74,107,80,.2)",
            fontSize: 12,
            color: "var(--gv-ok)",
            marginBottom: 10,
          }}
        >
          <OkIcon />
          Acknowledged — no customer impact. Proceed to approval.
        </div>
      );
    }
    return (
      <div
        style={{
          padding: 28,
          textAlign: "center",
          border: "1px solid var(--gv-bdr)",
          borderRadius: 10,
          background: "var(--gv-card)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--gv-ok-bg)",
            border: "1px solid rgba(74,107,80,.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#4A6B50" strokeWidth="1.5" />
            <path
              d="M12 8v5M12 15v1"
              stroke="#4A6B50"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--gv-tx1)",
            marginBottom: 6,
            letterSpacing: "-.01em",
          }}
        >
          No customer impact detected
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--gv-tx3)",
            lineHeight: 1.7,
            marginBottom: 18,
          }}
        >
          No feature toggles or maintenance banner required for this event.
        </p>
        <button
          onClick={() => dispatch({ type: "ACK_NO_IMPACT" })}
          style={{
            padding: "7px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            border: "1px solid var(--gv-acc)",
            background: "var(--gv-acc)",
            color: "var(--gv-card)",
            fontFamily: "inherit",
            letterSpacing: ".01em",
          }}
        >
          Acknowledge &amp; continue
        </button>
      </div>
    );
  }

  const paySignal = isPay(sig);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
        gap: 12,
        alignItems: "start",
      }}
    >
      {/* Left: feature toggles */}
      <div>
        <p
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "var(--gv-tx3)",
            textTransform: "uppercase",
            letterSpacing: ".1em",
            marginBottom: 8,
          }}
        >
          Feature toggles
        </p>

        <PanelBox header="Front-end — per feature">
          {sig.features.map((f, i) => {
            if (f.hideFromStep2) return null;
            return (
              <FeatureToggleRow
                key={i}
                label={f.n}
                description={f.i}
                isOn={state.featToggles[i] ?? true}
                onToggle={() =>
                  dispatch({ type: "TOGGLE_FEATURE", index: i })
                }
              />
            );
          })}
        </PanelBox>

        {paySignal && (
          <PanelBox header="Back-end payment toggle">
            <div
              onClick={() => dispatch({ type: "TOGGLE_BACKEND" })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 11px",
                background: state.toggleBackend
                  ? "var(--gv-acc-bg)"
                  : "var(--gv-bg)",
                borderRadius: 8,
                marginBottom: 6,
                cursor: "pointer",
                border: `1px solid ${state.toggleBackend ? "rgba(139,92,56,.35)" : "var(--gv-bdr)"}`,
                transition: "all .12s",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--gv-tx1)",
                  }}
                >
                  Pause recurring batch jobs
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--gv-tx3)",
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  Stops payment processing during window
                </div>
              </div>
              <TogglePill isOn={state.toggleBackend} />
            </div>
            {state.toggleBackend && (
              <p
                style={{
                  padding: "6px 2px",
                  fontSize: 11,
                  color: "var(--gv-tx3)",
                  marginTop: 4,
                  lineHeight: 1.5,
                }}
              >
                Batch jobs paused. Prevents false failure alerts to customers.
              </p>
            )}
          </PanelBox>
        )}
      </div>

      {/* Right: banner generator */}
      <BannerGenerator />
    </div>
  );
}

function PanelBox({
  header,
  children,
}: {
  header: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--gv-bdr)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 10,
        background: "var(--gv-card)",
      }}
    >
      <div
        style={{
          padding: "9px 13px",
          background: "var(--gv-sb)",
          borderBottom: "1px solid var(--gv-bdr)",
          fontSize: 11,
          fontWeight: 500,
          color: "var(--gv-tx2)",
          textTransform: "uppercase" as const,
          letterSpacing: ".07em",
        }}
      >
        {header}
      </div>
      <div style={{ padding: "11px 12px" }}>{children}</div>
    </div>
  );
}
