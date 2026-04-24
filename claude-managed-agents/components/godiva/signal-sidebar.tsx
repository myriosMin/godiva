"use client";

import { useGodiva } from "@/components/godiva/godiva-context";
import { SeverityBadge, SignalCountBadge } from "@/components/godiva/severity-badge";

export function SignalSidebar() {
  const { state, dispatch, signals } = useGodiva();

  return (
    <div
      style={{
        width: 255,
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
              onClick={() =>
                dispatch({ type: "SELECT_SIGNAL", signalId: s.id })
              }
              style={{
                padding: "10px 11px",
                borderRadius: 10,
                cursor: "pointer",
                marginBottom: 3,
                border: `1px solid ${isActive ? "var(--gv-acc-bg)" : "transparent"}`,
                background: isActive ? "var(--gv-card)" : "transparent",
                boxShadow: isActive
                  ? "0 1px 4px rgba(139,92,56,.08)"
                  : "none",
                transition: "all .12s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "var(--gv-card)";
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--gv-bdr)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "transparent";
                }
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--gv-tx1)",
                  marginBottom: 2,
                }}
              >
                {s.domain}
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
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                <SeverityBadge sev={s.sev} noImpact={s.noImpact} />
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--gv-tx3)",
                    marginLeft: "auto",
                  }}
                >
                  {s.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
