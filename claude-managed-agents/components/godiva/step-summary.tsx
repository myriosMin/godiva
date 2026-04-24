"use client";

import { useGodiva, useCurrentSignal } from "@/components/godiva/godiva-context";
import { SeverityBadge } from "@/components/godiva/severity-badge";
import { isPay, deriveBundleFromDomain } from "@/lib/godiva-data";

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

function fmtTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function StepSummary() {
  const { state, dispatch } = useGodiva();
  const sig = useCurrentSignal();
  if (!sig) return null;

  const dd = sig.date.substring(0, 2);
  const mm = sig.date.substring(2, 4);
  const yyyy = sig.date.substring(4, 8);
  const formattedDate = `${dd}/${mm}/${yyyy}`;

  const acts: string[] = [];
  if (sig.noImpact) {
    acts.push("No customer impact — acknowledged");
  } else {
    const onF: string[] = [];
    const offF: string[] = [];
    sig.features.forEach((f, i) => {
      if (f.hideFromStep2) return;
      if (state.featToggles[i]) onF.push(f.n);
      else offF.push(f.n);
    });
    if (onF.length > 0) acts.push("Front-end toggled: " + onF.join(", "));
    if (offF.length > 0) acts.push("No change: " + offF.join(", "));
    if (state.toggleBackend && isPay(sig))
      acts.push("Back-end: batch payment jobs paused");
    if (state.bannerDone)
      acts.push("Maintenance banner generated and approved");
  }

  return (
    <div>
      {state.approved && (
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
          Incident recorded — {fmtTime(state.approvedAt)}
        </div>
      )}

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
        Incident summary
      </p>

      <ABox header="Event">
        <SummaryRow label="System" value={sig.sys} />
        <SummaryRow label="Date" value={formattedDate} />
        <SummaryRow label="Window" value={`${sig.win} (${sig.dur})`} />
        <SummaryRow
          label="Severity"
          value={<SeverityBadge sev={sig.sev} />}
        />
        <SummaryRow
          label="Signal received"
          value={fmtTime(state.startedAt)}
          last
        />
      </ABox>

      <ABox header="Actions taken" style={{ marginTop: 10 }}>
        {acts.map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "7px 0",
              borderBottom:
                i < acts.length - 1 ? "1px solid var(--gv-bdr)" : "none",
              fontSize: 12,
              gap: 12,
            }}
          >
            <span style={{ color: "var(--gv-ok)", fontWeight: 500 }}>
              ✓ {a}
            </span>
          </div>
        ))}
      </ABox>

      {state.bannerDone && (
        <ABox header="Approved banner copy" style={{ marginTop: 10 }}>
          <SummaryRow label="Title" value={state.bannerTitle} last />
          <div
            style={{
              padding: "0 0 6px",
              fontSize: 12,
              color: "var(--gv-tx2)",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              marginTop: 8,
            }}
          >
            {state.bannerBody}
          </div>
        </ABox>
      )}

      <ABox header="Approval" style={{ marginTop: 10 }}>
        <SummaryRow label="Approved by" value="Product Lead" />
        <SummaryRow
          label="Status"
          value={
            <span
              style={{
                color: state.approved ? "var(--gv-ok)" : "var(--gv-err)",
                fontWeight: 500,
              }}
            >
              {state.approved ? "Approved" : "Rejected"}
            </span>
          }
        />
        <SummaryRow label="Timestamp" value={fmtTime(state.approvedAt)} />
        {state.notes && (
          <SummaryRow label="Notes" value={state.notes} last />
        )}
      </ABox>

      {/* Track 1 execution */}
      {state.approved && !state.confirmed && (
        <button
          onClick={() => dispatch({ type: "CONFIRM" })}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "10px 0",
            borderRadius: 10,
            border: "none",
            background: "var(--gv-ok)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: ".02em",
          }}
        >
          Confirm &amp; Apply Bundle
        </button>
      )}

      {state.confirmed && (() => {
        const bundle =
          state.agentClassification?.bundle ??
          deriveBundleFromDomain(sig.domain);
        const flagCount = state.featToggles.filter(Boolean).length;
        const d = state.confirmedAt ?? new Date();
        const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
        const rand = String(d.getMilliseconds() + d.getSeconds() * 1000).padStart(4, "0").slice(0, 4);
        const eventId = `EVT-${ymd}-${rand}`;

        return (
          <ABox header="Bundle Applied" style={{ marginTop: 10, borderColor: "rgba(74,107,80,.35)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 0 12px",
                borderBottom: "1px solid var(--gv-bdr)",
              }}
            >
              <OkIcon />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gv-ok)" }}>
                Changes applied successfully
              </span>
            </div>
            <SummaryRow label="Bundle" value={
              <span className="font-mono" style={{ color: "#9b72cf", fontSize: 11 }}>{bundle}</span>
            } />
            <SummaryRow label="Features toggled" value={`${flagCount} flag${flagCount !== 1 ? "s" : ""}`} />
            <SummaryRow label="Service Event ID" value={
              <span className="font-mono" style={{ fontSize: 11 }}>{eventId}</span>
            } />
            <SummaryRow label="Applied at" value={fmtTime(state.confirmedAt)} last />
          </ABox>
        );
      })()}
    </div>
  );
}

function ABox({
  header,
  children,
  style,
}: {
  header: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--gv-bdr)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 10,
        background: "var(--gv-card)",
        ...style,
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
      <div style={{ padding: "10px 13px" }}>{children}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  last,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "7px 0",
        borderBottom: last ? "none" : "1px solid var(--gv-bdr)",
        fontSize: 12,
        gap: 12,
      }}
    >
      <span style={{ color: "var(--gv-tx3)", flexShrink: 0 }}>{label}</span>
      <span
        style={{
          color: "var(--gv-tx1)",
          fontWeight: 500,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
