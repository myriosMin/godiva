"use client";

interface FeatureToggleRowProps {
  label: string;
  description: string;
  isOn: boolean;
  onToggle: () => void;
}

export function FeatureToggleRow({
  label,
  description,
  isOn,
  onToggle,
}: FeatureToggleRowProps) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 11px",
        background: isOn ? "var(--gv-acc-bg)" : "var(--gv-bg)",
        borderRadius: 8,
        marginBottom: 6,
        cursor: "pointer",
        border: `1px solid ${isOn ? "rgba(139,92,56,.35)" : "var(--gv-bdr)"}`,
        transition: "all .12s",
      }}
    >
      <div>
        <div
          style={{ fontSize: 12, fontWeight: 500, color: "var(--gv-tx1)" }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--gv-tx3)",
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      </div>
      <TogglePill isOn={isOn} />
    </div>
  );
}

export function TogglePill({ isOn }: { isOn: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
      <div
        style={{
          width: 34,
          height: 20,
          borderRadius: 10,
          position: "relative",
          flexShrink: 0,
          transition: "background .15s",
          background: isOn ? "var(--gv-acc)" : "var(--gv-sb2)",
          border: `1.5px solid ${isOn ? "var(--gv-acc)" : "var(--gv-bdr2)"}`,
        }}
      >
        <div
          style={{
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: "var(--gv-card)",
            position: "absolute",
            top: 2,
            left: isOn ? 17 : 2,
            transition: "left .15s",
            boxShadow: "0 1px 3px rgba(0,0,0,.18)",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          marginLeft: 6,
          minWidth: 22,
          letterSpacing: ".04em",
          color: isOn ? "var(--gv-acc)" : "var(--gv-tx3)",
        }}
      >
        {isOn ? "ON" : "OFF"}
      </span>
    </div>
  );
}
