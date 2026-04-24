"use client";

import { useEffect, useState } from "react";
import type { FeatureStatus } from "@/lib/feature-status";

const POLL_MS = 5000;

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

  return (
    <div
      style={{
        height: 34,
        borderTop: "1px solid var(--gv-bdr)",
        background: "var(--gv-sb)",
        display: "flex",
        alignItems: "center",
        paddingLeft: 14,
        paddingRight: 14,
        gap: 0,
        overflowX: "auto",
        flexShrink: 0,
        scrollbarWidth: "none",
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: ".1em",
          color: "var(--gv-tx3)",
          textTransform: "uppercase",
          flexShrink: 0,
          marginRight: 12,
        }}
      >
        System Status
      </span>

      {/* Overall indicator */}
      {downCount > 0 && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: "#e05252",
            background: "rgba(224,82,82,.1)",
            borderRadius: 4,
            padding: "2px 6px",
            marginRight: 12,
            flexShrink: 0,
          }}
        >
          {downCount} degraded
        </span>
      )}
      {downCount === 0 && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: "#4caf72",
            background: "rgba(76,175,114,.1)",
            borderRadius: 4,
            padding: "2px 6px",
            marginRight: 12,
            flexShrink: 0,
          }}
        >
          All operational
        </span>
      )}

      {/* Divider */}
      <span
        style={{
          width: 1,
          height: 16,
          background: "var(--gv-bdr)",
          marginRight: 12,
          flexShrink: 0,
        }}
      />

      {/* Feature groups */}
      {Object.entries(groups).map(([channel, feats], gi) => (
        <div
          key={channel}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            marginRight: gi < Object.keys(groups).length - 1 ? 16 : 0,
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: "var(--gv-tx3)",
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {channel}
          </span>
          {feats.map((f) => (
            <div
              key={f.id}
              title={f.up ? `${f.name}: operational` : `${f.name}: degraded`}
              style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: f.up ? "#4caf72" : "#e05252",
                  display: "inline-block",
                  flexShrink: 0,
                  boxShadow: f.up
                    ? "0 0 5px rgba(76,175,114,.7)"
                    : "0 0 5px rgba(224,82,82,.7)",
                  transition: "all .3s",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: f.up ? "var(--gv-tx2)" : "#e05252",
                  fontWeight: f.up ? 400 : 500,
                  transition: "color .3s",
                }}
              >
                {f.name}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
