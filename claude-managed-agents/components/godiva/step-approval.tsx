"use client";

import { useGodiva, useCurrentSignal } from "@/components/godiva/godiva-context";

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

function ErrIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15">
      <circle cx="7.5" cy="7.5" r="6.5" fill="#A84038" />
      <path
        d="M5 5l5 5M10 5l-5 5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function fmtTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function StepApproval() {
  const { state, dispatch } = useGodiva();
  const sig = useCurrentSignal();
  if (!sig) return null;

  if (state.approved) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "11px 13px",
          background: "var(--gv-ok-bg)",
          borderRadius: 10,
          border: "1px solid rgba(74,107,80,.2)",
          fontSize: 12,
          color: "var(--gv-ok)",
          fontWeight: 500,
          marginBottom: 12,
        }}
      >
        <OkIcon />
        Approved by Product Lead at {fmtTime(state.approvedAt)}. Click View
        summary.
      </div>
    );
  }

  if (state.rejected) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "11px 13px",
          background: "var(--gv-err-bg)",
          borderRadius: 10,
          border: "1px solid rgba(168,64,56,.2)",
          fontSize: 12,
          color: "var(--gv-err)",
          fontWeight: 500,
          marginBottom: 12,
        }}
      >
        <ErrIcon />
        Rejected — returned to queue.
      </div>
    );
  }

  const sla =
    sig.sev === "critical"
      ? "Critical — Product Lead must act within 1 hour"
      : "Major — Product Lead approval required";

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
        Checker-maker sign-off
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
          {sla}
        </div>

        <div style={{ padding: 13 }}>
          {/* Maker / Checker cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <RoleCard
              roleLabel="Maker"
              roleName="Ops Manager"
              status={{ type: "approved", text: "✓ Submitted" }}
            />
            <RoleCard
              roleLabel="Checker — Product Lead"
              roleName="Product Lead"
              status={{ type: "pending", text: "⏳ Awaiting approval" }}
            />
          </div>

          {/* Notes */}
          <textarea
            rows={2}
            placeholder="Add a note (optional)…"
            value={state.notes}
            onChange={(e) =>
              dispatch({ type: "SET_NOTES", notes: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px 11px",
              border: "1px solid var(--gv-bdr)",
              borderRadius: 8,
              fontSize: 12,
              background: "var(--gv-card)",
              color: "var(--gv-tx1)",
              fontFamily: "inherit",
              resize: "none",
              marginBottom: 10,
            }}
          />

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => dispatch({ type: "REJECT" })}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                border: "1px solid rgba(168,64,56,.25)",
                background: "var(--gv-err-bg)",
                color: "var(--gv-err)",
                fontFamily: "inherit",
                letterSpacing: ".01em",
              }}
            >
              Reject
            </button>
            <button
              onClick={() => dispatch({ type: "APPROVE" })}
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
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  roleLabel,
  roleName,
  status,
}: {
  roleLabel: string;
  roleName: string;
  status: { type: "approved" | "pending"; text: string };
}) {
  return (
    <div
      style={{
        background: "var(--gv-bg)",
        borderRadius: 8,
        padding: "10px 11px",
        border: "1px solid var(--gv-bdr)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--gv-tx3)",
          textTransform: "uppercase" as const,
          letterSpacing: ".07em",
          marginBottom: 2,
        }}
      >
        {roleLabel}
      </div>
      <div
        style={{ fontSize: 12, fontWeight: 500, color: "var(--gv-tx1)", marginBottom: 4 }}
      >
        {roleName}
      </div>
      <div
        style={{
          fontSize: 11,
          color:
            status.type === "approved" ? "var(--gv-ok)" : "var(--gv-warn)",
        }}
      >
        {status.text}
      </div>
    </div>
  );
}
