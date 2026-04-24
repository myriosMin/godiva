"use client";

import { useState } from "react";
import { useGodiva } from "@/components/godiva/godiva-context";
import type { AgentClassification } from "@/components/godiva/godiva-context";
import type { Signal } from "@/lib/godiva-data";

type SigType = "maintenance_email" | "monitoring_alert" | "manual_trigger";

const TYPE_LABELS: Record<SigType, string> = {
  maintenance_email: "Email",
  monitoring_alert: "Alert",
  manual_trigger: "Manual",
};

function nowSGT() {
  const sgt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const h = String(sgt.getUTCHours()).padStart(2, "0");
  const m = String(sgt.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function todayDDMMYYYY() {
  const sgt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const d = String(sgt.getUTCDate()).padStart(2, "0");
  const mo = String(sgt.getUTCMonth() + 1).padStart(2, "0");
  const y = sgt.getUTCFullYear();
  return `${d}${mo}${y}`;
}

interface Props {
  onClose: () => void;
}

export function ManualInjectPanel({ onClose }: Props) {
  const { dispatch } = useGodiva();
  const [text, setText] = useState("");
  const [sigType, setSigType] = useState<SigType>("maintenance_email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/godiva/classify-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();

      if (!data.classification) {
        setError("Classification failed — check the signal text and try again.");
        setLoading(false);
        return;
      }

      const cls: AgentClassification = data.classification;
      const id = Date.now();

      const signal: Signal = {
        id,
        domain: cls.domain || "Unknown",
        from: sigType === "monitoring_alert" ? "pagerduty@sp.com.sg" : sigType === "manual_trigger" ? "ops-team@spgroup.com.sg" : "vendor@external.com",
        sev: cls.sev,
        time: nowSGT(),
        date: todayDDMMYYYY(),
        win: cls.win || "Ongoing",
        dur: cls.dur || "TBD",
        sys: cls.sys,
        reason: cls.reason,
        noImpact: cls.noImpact ?? false,
        features: (cls.features ?? []).map((f) => ({
          ...f,
          hideFromStep1: false,
          hideFromStep2: false,
        })),
        email: text.trim(),
        signalType: sigType,
        isNew: true,
      };

      dispatch({ type: "ADD_SIGNAL", signal });
      dispatch({ type: "SELECT_SIGNAL", signalId: id });
      onClose();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--gv-bdr)",
        padding: "12px 10px",
        background: "var(--gv-card)",
      }}
    >
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
        Inject signal
      </p>

      {/* Signal type selector */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 8,
        }}
      >
        {(Object.keys(TYPE_LABELS) as SigType[]).map((t) => (
          <button
            key={t}
            onClick={() => setSigType(t)}
            style={{
              flex: 1,
              fontSize: 10,
              fontWeight: 500,
              padding: "4px 0",
              borderRadius: 6,
              border: `1px solid ${sigType === t ? "var(--gv-acc-bg)" : "var(--gv-bdr)"}`,
              background: sigType === t ? "var(--gv-acc-light)" : "transparent",
              color: sigType === t ? "var(--gv-tx1)" : "var(--gv-tx3)",
              cursor: "pointer",
              transition: "all .1s",
            }}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste email, alert payload, or describe the incident…"
        rows={5}
        style={{
          width: "100%",
          fontSize: 11,
          lineHeight: 1.6,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid var(--gv-bdr)",
          background: "var(--gv-sb)",
          color: "var(--gv-tx1)",
          resize: "none",
          fontFamily: "inherit",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {error && (
        <p style={{ fontSize: 11, color: "var(--gv-err)", marginTop: 4 }}>
          {error}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            fontSize: 11,
            fontWeight: 500,
            padding: "6px 0",
            borderRadius: 7,
            border: "1px solid var(--gv-bdr)",
            background: "transparent",
            color: "var(--gv-tx3)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          style={{
            flex: 2,
            fontSize: 11,
            fontWeight: 600,
            padding: "6px 0",
            borderRadius: 7,
            border: "none",
            background: loading || !text.trim() ? "var(--gv-bdr)" : "#9b72cf",
            color: loading || !text.trim() ? "var(--gv-tx3)" : "#fff",
            cursor: loading || !text.trim() ? "default" : "pointer",
            transition: "background .15s",
          }}
        >
          {loading ? "Classifying…" : "Classify & Inject"}
        </button>
      </div>
    </div>
  );
}
