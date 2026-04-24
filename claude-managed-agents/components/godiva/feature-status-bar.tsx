"use client";

import { useEffect, useState } from "react";
import type { FeatureStatus } from "@/lib/feature-status";

const POLL_MS = 5000;

const COLOR = {
  up: {
    text: "#4caf72",
    bg: "rgba(76,175,114,.1)",
    glow: "0 0 5px rgba(76,175,114,.7)",
  },
  down: {
    text: "#e05252",
    bg: "rgba(224,82,82,.1)",
    glow: "0 0 5px rgba(224,82,82,.7)",
  },
} as const;

const S = {
  bar: {
    height: 34,
    borderTop: "1px solid var(--gv-bdr)",
    background: "var(--gv-sb)",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    overflowX: "auto",
    flexShrink: 0,
    scrollbarWidth: "none",
  },
  label: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: ".1em",
    color: "var(--gv-tx3)",
    textTransform: "uppercase",
    flexShrink: 0,
    marginRight: 12,
  },
  pill: {
    fontSize: 9,
    fontWeight: 600,
    borderRadius: 4,
    padding: "2px 6px",
    marginRight: 12,
    flexShrink: 0,
  },
  divider: {
    width: 1,
    height: 16,
    background: "var(--gv-bdr)",
    marginRight: 12,
    flexShrink: 0,
  },
  channelLabel: {
    fontSize: 9,
    fontWeight: 500,
    color: "var(--gv-tx3)",
    flexShrink: 0,
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
    transition: "all .3s",
  },
} satisfies Record<string, React.CSSProperties>;

function StatusPill({ downCount }: { downCount: number }) {
  const isDown = downCount > 0;
  const c = isDown ? COLOR.down : COLOR.up;
  return (
    <span style={{ ...S.pill, color: c.text, background: c.bg }}>
      {isDown ? `${downCount} degraded` : "All operational"}
    </span>
  );
}

function FeatureIndicator({ f }: { f: FeatureStatus }) {
  const c = f.up ? COLOR.up : COLOR.down;
  return (
    <div
      title={`${f.name}: ${f.up ? "operational" : "degraded"}`}
      style={S.feature}
    >
      <span style={{ ...S.dot, background: c.text, boxShadow: c.glow }} />
      <span
        style={{
          fontSize: 10,
          color: f.up ? "var(--gv-tx2)" : COLOR.down.text,
          fontWeight: f.up ? 400 : 500,
          transition: "color .3s",
        }}
      >
        {f.name}
      </span>
    </div>
  );
}

export function FeatureStatusBar() {
  const [features, setFeatures] = useState<FeatureStatus[]>([]);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const res = await fetch("/api/godiva/feature-status");
        if (res.ok && mounted) {
          const data = await res.json();
          setFeatures(data.features);
        }
      } catch {}
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (features.length === 0) return null;

  const groups = features.reduce<Record<string, FeatureStatus[]>>((acc, f) => {
    (acc[f.channel] ??= []).push(f);
    return acc;
  }, {});

  const downCount = features.filter((f) => !f.up).length;
  const channelCount = Object.keys(groups).length;

  return (
    <div style={S.bar}>
      <span style={S.label}>System Status</span>

      <StatusPill downCount={downCount} />

      <span style={S.divider} />

      {Object.entries(groups).map(([channel, feats], gi) => (
        <div
          key={channel}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            marginRight: gi < channelCount - 1 ? 16 : 0,
          }}
        >
          <span style={S.channelLabel}>{channel}</span>
          {feats.map((f) => (
            <FeatureIndicator key={f.id} f={f} />
          ))}
        </div>
      ))}
    </div>
  );
}
