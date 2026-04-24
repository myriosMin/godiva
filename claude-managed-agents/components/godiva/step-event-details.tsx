"use client";

import { useGodiva, useCurrentSignal } from "@/components/godiva/godiva-context";
import { SeverityBadge } from "@/components/godiva/severity-badge";

export function StepEventDetails() {
  const { state, dispatch } = useGodiva();
  const sig = useCurrentSignal();
  if (!sig) return null;

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
        }}
      >
        Parsed maintenance event
      </p>

      {/* Parsed grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {[
          { label: "System", value: sig.sys },
          { label: "Date", value: formattedDate },
          { label: "Window", value: sig.win },
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
        ))}
      </div>

      {/* Reason */}
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
        {sig.reason}
      </div>

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
        {sig.features
          .filter((f) => !f.hideFromStep1)
          .map((f) => (
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
                <div
                  style={{ fontWeight: 500, color: "var(--gv-tx1)" }}
                >
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
                <SeverityBadge sev={sig.sev} />
              </div>
            </div>
          ))}
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
            Source email — {sig.from}
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
