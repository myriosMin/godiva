"use client";

import { useEffect, useState } from "react";
import type { FeatureStatus } from "@/lib/feature-status";

const POLL_MS = 5000;

const FS = { xs: 10, sm: 11, md: 12 } as const;

const TRANSITION =
  "color .3s ease, box-shadow .3s ease, background-color .3s ease";

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
    borderTop: "1px solid var(--gv-bdr)",
    background: "var(--gv-sb)",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    padding: "8px 14px",
    flexShrink: 0,
  },
  barCompact: {
    padding: "6px 10px",
    gap: 6,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
    marginRight: 4,
  },
  label: {
    fontSize: FS.xs,
    fontWeight: 600,
    letterSpacing: ".1em",
    color: "var(--gv-tx3)",
    textTransform: "uppercase",
    flexShrink: 0,
  },
  pill: {
    fontSize: FS.xs,
    fontWeight: 600,
    borderRadius: 4,
    padding: "2px 8px",
    flexShrink: 0,
  },
  group: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 10px",
    border: "1px solid var(--gv-bdr)",
    borderRadius: 6,
    flexShrink: 0,
  },
  channelLabel: {
    fontSize: FS.xs,
    fontWeight: 600,
    letterSpacing: ".08em",
    textTransform: "uppercase",
    color: "var(--gv-tx3)",
    paddingRight: 10,
    borderRight: "1px solid var(--gv-bdr)",
    flexShrink: 0,
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
    transition: TRANSITION,
  },
  featureName: {
    fontSize: FS.sm,
    transition: TRANSITION,
  },
  errorPill: {
    fontSize: FS.xs,
    fontWeight: 600,
    color: "var(--gv-err)",
    background: "var(--gv-err-bg)",
    borderRadius: 4,
    padding: "2px 6px",
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
          ...S.featureName,
          color: f.up ? "var(--gv-tx2)" : COLOR.down.text,
          fontWeight: f.up ? 400 : 500,
        }}
      >
        {f.name}
      </span>
    </div>
  );
}

function ChannelGroup({
  channel,
  feats,
}: {
  channel: string;
  feats: FeatureStatus[];
}) {
  return (
    <div style={S.group}>
      <span style={S.channelLabel}>{channel}</span>
      {feats.map((f) => (
        <FeatureIndicator key={f.id} f={f} />
      ))}
    </div>
  );
}

export function FeatureStatusBar() {
  const [features, setFeatures] = useState<FeatureStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  // <768px: hide per-channel groups, show only the pill summary.
  // <640px: also tighten padding/gap.
  const hideChannelGroups = useMediaQuery("(max-width: 767px)");
  const isCompact = useMediaQuery("(max-width: 639px)");

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const res = await fetch("/api/godiva/feature-status");
        if (!mounted) return;
        if (!res.ok) {
          setError(`Status unavailable (HTTP ${res.status})`);
          return;
        }
        const data = await res.json();
        setFeatures(data.features);
        setError(null);
      } catch {
        if (mounted) setError("Status unavailable — check backend");
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const barStyle = isCompact ? { ...S.bar, ...S.barCompact } : S.bar;

  if (error) {
    return (
      <div style={barStyle}>
        <span style={S.label}>System Status</span>
        <span style={S.errorPill}>{error}</span>
      </div>
    );
  }

  if (features.length === 0) return null;

  const groups = features.reduce<Record<string, FeatureStatus[]>>((acc, f) => {
    (acc[f.channel] ??= []).push(f);
    return acc;
  }, {});

  const downCount = features.filter((f) => !f.up).length;

  return (
    <div style={barStyle}>
      <div style={S.header}>
        {!isCompact && <span style={S.label}>System Status</span>}
        <StatusPill downCount={downCount} />
      </div>

      {!hideChannelGroups &&
        Object.entries(groups).map(([channel, feats]) => (
          <ChannelGroup key={channel} channel={channel} feats={feats} />
        ))}
    </div>
  );
}
