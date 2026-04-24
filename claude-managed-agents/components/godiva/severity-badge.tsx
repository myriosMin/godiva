interface SeverityBadgeProps {
  sev: "critical" | "major" | "minor";
  noImpact?: boolean;
}

const sevStyles: Record<
  "critical" | "major" | "minor" | "noImpact",
  React.CSSProperties
> = {
  critical: {
    background: "var(--gv-err-bg)",
    color: "var(--gv-err)",
  },
  major: {
    background: "var(--gv-warn-bg)",
    color: "var(--gv-warn)",
  },
  minor: {
    background: "var(--gv-minor-bg)",
    color: "var(--gv-minor)",
  },
  noImpact: {
    background: "var(--gv-minor-bg)",
    color: "var(--gv-minor)",
  },
};

const badgeBase: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  padding: "2px 7px",
  borderRadius: 20,
  letterSpacing: ".02em",
  display: "inline-block",
};

import type React from "react";

export function SeverityBadge({ sev, noImpact }: SeverityBadgeProps) {
  return (
    <>
      <span style={{ ...badgeBase, ...sevStyles[sev] }}>{sev}</span>
      {noImpact && (
        <span
          style={{ ...badgeBase, ...sevStyles.noImpact, marginLeft: 5 }}
        >
          no impact
        </span>
      )}
    </>
  );
}

export function SignalCountBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        ...badgeBase,
        background: "var(--gv-acc-bg)",
        color: "var(--gv-acc)",
        marginLeft: 2,
      }}
    >
      {count}
    </span>
  );
}
