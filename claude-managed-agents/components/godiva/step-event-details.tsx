"use client";

import { useGodiva, useCurrentSignal, type AgentRecommendation } from "@/components/godiva/godiva-context";
import { SeverityBadge } from "@/components/godiva/severity-badge";

const BLAST_COLORS: Record<AgentRecommendation["blast_radius"], string> = {
  low: "#4caf72",
  medium: "#e0a83a",
  high: "#e07b3a",
  extremely_high: "#c0392b",
};

const CONFIDENCE_COLORS: Record<AgentRecommendation["confidence"], string> = {
  high: "#4caf72",
  medium: "#e0a83a",
  low: "#e07b3a",
};

function AgentRecommendationBadge({ rec }: { rec: AgentRecommendation }) {
  return (
    <div
      style={{
        border: "1px solid rgba(155,114,207,.25)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 14,
        background: "rgba(155,114,207,.05)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid rgba(155,114,207,.15)",
          background: "rgba(155,114,207,.08)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#9b72cf",
            textTransform: "uppercase",
            letterSpacing: ".1em",
          }}
        >
          AI Recommendation
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: CONFIDENCE_COLORS[rec.confidence],
            background: `${CONFIDENCE_COLORS[rec.confidence]}1a`,
            borderRadius: 4,
            padding: "1px 6px",
            letterSpacing: ".04em",
            textTransform: "uppercase",
            marginLeft: "auto",
          }}
        >
          {rec.confidence} confidence
        </span>
      </div>

      {/* Metrics row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderBottom: "1px solid rgba(155,114,207,.12)",
        }}
      >
        {[
          { label: "Severity", value: rec.severity.toUpperCase() },
          { label: "Bundle", value: rec.bundle },
          { label: "Blast radius", value: rec.blast_radius.replace(/_/g, " ").toUpperCase() },
        ].map(({ label, value }, i) => (
          <div
            key={label}
            style={{
              padding: "8px 12px",
              borderRight: i < 2 ? "1px solid rgba(155,114,207,.12)" : undefined,
            }}
          >
            <div style={{ fontSize: 9, color: "var(--gv-tx3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>
              {label}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: i === 2 ? BLAST_COLORS[rec.blast_radius] : "#9b72cf",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Approvers */}
      {rec.approvers_required.length > 0 && (
        <div style={{ padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 10, color: "var(--gv-tx3)", textTransform: "uppercase", letterSpacing: ".06em", flexShrink: 0, paddingTop: 1 }}>
            Approvers
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {rec.approvers_required.map((a) => (
              <span
                key={a}
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--gv-tx2)",
                  background: "var(--gv-bdr)",
                  borderRadius: 5,
                  padding: "2px 7px",
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  return (
    <div
      className="skeleton-pulse"
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: "var(--gv-bdr)",
      }}
    />
  );
}

export function StepEventDetails() {
  const { state, dispatch } = useGodiva();
  const sig = useCurrentSignal();
  if (!sig) return null;

  const cls = state.agentClassification;
  const loading = state.classifying;
  const rec = state.recommendation;

  const displaySys = cls?.sys ?? sig.sys;
  const displayWin = cls?.win ?? sig.win;
  const displayDur = cls?.dur ?? sig.dur;
  const displayReason = cls?.reason ?? sig.reason;
  const displayFeatures = cls?.features ?? sig.features.filter((f) => !f.hideFromStep1);
  const displaySev = cls?.sev ?? sig.sev;

  const dd = sig.date.substring(0, 2);
  const mm = sig.date.substring(2, 4);
  const yyyy = sig.date.substring(4, 8);
  const formattedDate = `${dd}/${mm}/${yyyy}`;

  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: "var(--gv-tx3)",
          textTransform: "uppercase",
          letterSpacing: ".1em",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Parsed maintenance event
        {loading && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "#9b72cf",
              background: "rgba(155,114,207,.12)",
              borderRadius: 4,
              padding: "1px 6px",
              letterSpacing: ".04em",
            }}
          >
            AI analysing…
          </span>
        )}
        {!loading && cls && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "#9b72cf",
              background: "rgba(155,114,207,.12)",
              borderRadius: 4,
              padding: "1px 6px",
              letterSpacing: ".04em",
            }}
          >
            AI · {cls.confidence}
          </span>
        )}
      </p>

      {/* Agent recommendation badge — shown when analysis is complete */}
      {rec && <AgentRecommendationBadge rec={rec} />}

      {/* Parsed grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {loading ? (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--gv-card)",
                  border: "1px solid var(--gv-bdr)",
                  borderRadius: 10,
                  padding: "9px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <Skeleton w="50%" h={9} />
                <Skeleton w="80%" h={12} />
              </div>
            ))}
          </>
        ) : (
          [
            { label: "System", value: displaySys },
            { label: "Date", value: formattedDate },
            { label: "Window", value: `${displayWin} (${displayDur})` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "var(--gv-card)",
                border: "1px solid var(--gv-bdr)",
                borderRadius: 10,
                padding: "9px 12px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--gv-tx3)",
                  marginBottom: 3,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                }}
              >
                {label}
              </div>
              <div
                style={{ fontSize: 12, fontWeight: 500, color: "var(--gv-tx1)" }}
              >
                {value}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bundle chip (only when AI-classified) */}
      {!loading && cls?.bundle && (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            background: "var(--gv-card)",
            border: "1px solid var(--gv-bdr)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 10, color: "var(--gv-tx3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Recommended bundle
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9b72cf",
              background: "rgba(155,114,207,.1)",
              borderRadius: 5,
              padding: "2px 8px",
            }}
          >
            {cls.bundle}
          </span>
        </div>
      )}

      {/* Reason */}
      {loading ? (
        <div
          style={{
            background: "var(--gv-card)",
            border: "1px solid var(--gv-bdr)",
            borderRadius: 10,
            padding: "10px 13px",
            marginBottom: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <Skeleton w="95%" h={12} />
          <Skeleton w="70%" h={12} />
        </div>
      ) : (
        <div
          style={{
            background: "var(--gv-card)",
            border: "1px solid var(--gv-bdr)",
            borderRadius: 10,
            padding: "10px 13px",
            marginBottom: 10,
            fontSize: 12,
            color: "var(--gv-tx2)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "var(--gv-tx1)", fontWeight: 500 }}>
            Reason —
          </strong>{" "}
          {displayReason}
        </div>
      )}

      {/* Affected features */}
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
        Affected features
      </p>
      <div
        style={{
          border: "1px solid var(--gv-bdr)",
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 10,
          background: "var(--gv-card)",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px",
            alignItems: "center",
            padding: "8px 12px",
            borderBottom: "1px solid var(--gv-bdr)",
            fontSize: 10,
            background: "var(--gv-sb)",
            color: "var(--gv-tx3)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: ".06em",
          }}
        >
          <div>Feature &amp; impact</div>
          <div>Severity</div>
        </div>
        {loading ? (
          [0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid var(--gv-bdr)",
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
            >
              <Skeleton w="60%" h={11} />
              <Skeleton w="85%" h={9} />
            </div>
          ))
        ) : (
          displayFeatures.map((f) => (
            <div
              key={f.n}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px",
                alignItems: "center",
                padding: "8px 12px",
                borderBottom: "1px solid var(--gv-bdr)",
                fontSize: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: "var(--gv-tx1)" }}>
                  {f.n}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--gv-tx3)",
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  {f.i}
                </div>
              </div>
              <div>
                <SeverityBadge sev={displaySev} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Email evidence */}
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
        Email evidence
      </p>
      <div
        style={{
          border: "1px solid var(--gv-bdr)",
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 4,
          background: "var(--gv-card)",
        }}
      >
        <div
          onClick={() => dispatch({ type: "TOGGLE_EMAIL" })}
          style={{
            padding: "9px 13px",
            background: "var(--gv-sb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 500, color: "var(--gv-tx1)" }}
          >
            Source signal — {sig.from}
          </span>
          <span style={{ fontSize: 11, color: "var(--gv-tx3)" }}>
            {state.emailOpen ? "hide" : "view source"}
          </span>
        </div>
        {state.emailOpen && (
          <div
            className="font-mono"
            style={{
              padding: 13,
              fontSize: 11,
              color: "var(--gv-tx2)",
              lineHeight: 1.9,
              whiteSpace: "pre-wrap",
              borderTop: "1px solid var(--gv-bdr)",
              background: "var(--gv-acc-light)",
            }}
          >
            {sig.email}
          </div>
        )}
      </div>
    </div>
  );
}
