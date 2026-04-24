"use client";

import { useGodiva, useCurrentSignal } from "@/components/godiva/godiva-context";
import { TMPLS, fillTmpl, autoPickTmpl, parseDateWin } from "@/lib/godiva-data";

export function BannerGenerator() {
  const { state, dispatch } = useGodiva();
  const sig = useCurrentSignal();
  if (!sig) return null;

  async function generateBanner() {
    if (!sig) return;
    const tidx = autoPickTmpl(sig);
    dispatch({ type: "BANNER_LOADING_START" });

    const { dateStr, timeStr } = parseDateWin(sig);

    try {
      const res = await fetch("/api/godiva/generate-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sys: sig.sys,
          reason: sig.reason,
          dateStr,
          timeStr,
          features: sig.features.map((f) => f.n),
          templates: TMPLS,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = (await res.json()) as {
        templateIndex: number;
        title: string;
        body: string;
        error?: string;
      };
      if (data.error) throw new Error(data.error);

      dispatch({
        type: "BANNER_LOADING_DONE",
        title: data.title || TMPLS[tidx].title,
        body: data.body || fillTmpl(TMPLS[tidx], sig).body,
        templateIndex:
          typeof data.templateIndex === "number" ? data.templateIndex : tidx,
      });
    } catch {
      const fallback = fillTmpl(TMPLS[tidx], sig);
      dispatch({
        type: "BANNER_LOADING_ERROR",
        title: fallback.title,
        body: fallback.body,
        templateIndex: tidx,
      });
    }
  }

  const templateSelector = (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "var(--gv-tx3)",
          marginBottom: 4,
          letterSpacing: ".02em",
        }}
      >
        Template
      </div>
      <select
        value={state.bannerTemplateIndex}
        onChange={(e) =>
          dispatch({
            type: "SET_BANNER_TEMPLATE",
            index: parseInt(e.target.value),
          })
        }
        style={{
          width: "100%",
          padding: "7px 10px",
          border: "1px solid var(--gv-bdr)",
          borderRadius: 8,
          fontSize: 12,
          background: "var(--gv-card)",
          color: "var(--gv-tx1)",
          marginBottom: 8,
          fontFamily: "inherit",
        }}
      >
        {TMPLS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.scenario}
          </option>
        ))}
      </select>
    </div>
  );

  const panelHeader = (
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
      {state.bannerDone ? "Banner copy — edit as needed" : "Generate banner message"}
    </div>
  );

  if (state.bannerLoading) {
    return (
      <div>
        <LabelText>Maintenance banner</LabelText>
        <div
          style={{
            border: "1px solid var(--gv-bdr)",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 10,
            background: "var(--gv-card)",
          }}
        >
          {panelHeader}
          <div
            style={{
              padding: 24,
              textAlign: "center",
              fontSize: 12,
              color: "var(--gv-tx3)",
            }}
          >
            Generating with AI…
          </div>
        </div>
      </div>
    );
  }

  if (!state.bannerDone) {
    return (
      <div>
        <LabelText>Maintenance banner</LabelText>
        <div
          style={{
            border: "1px solid var(--gv-bdr)",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 10,
            background: "var(--gv-card)",
          }}
        >
          {panelHeader}
          <div style={{ padding: "11px 12px" }}>
            {templateSelector}
            <button
              onClick={generateBanner}
              style={{
                width: "100%",
                marginTop: 2,
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
              Generate banner
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <LabelText>Maintenance banner</LabelText>
      <div
        style={{
          border: "1px solid var(--gv-bdr)",
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 10,
          background: "var(--gv-card)",
        }}
      >
        {panelHeader}
        <div style={{ padding: "11px 12px" }}>
          {templateSelector}
          <div
            style={{
              fontSize: 11,
              color: "var(--gv-tx3)",
              marginBottom: 4,
              letterSpacing: ".02em",
            }}
          >
            Title
          </div>
          <input
            value={state.bannerTitle}
            onChange={(e) =>
              dispatch({ type: "SET_BANNER_TITLE", title: e.target.value })
            }
            style={{
              width: "100%",
              padding: "7px 10px",
              border: "1px solid var(--gv-bdr)",
              borderRadius: 8,
              fontSize: 12,
              background: "var(--gv-card)",
              color: "var(--gv-tx1)",
              marginBottom: 8,
              fontFamily: "inherit",
            }}
          />
          <div
            style={{
              fontSize: 11,
              color: "var(--gv-tx3)",
              marginBottom: 4,
              letterSpacing: ".02em",
            }}
          >
            Body copy
          </div>
          <textarea
            rows={7}
            value={state.bannerBody}
            onChange={(e) =>
              dispatch({ type: "SET_BANNER_BODY", body: e.target.value })
            }
            style={{
              width: "100%",
              padding: "9px 11px",
              border: "1px solid var(--gv-bdr)",
              borderRadius: 8,
              fontSize: 12,
              background: "var(--gv-card)",
              color: "var(--gv-tx1)",
              fontFamily: "inherit",
              resize: "none",
              lineHeight: 1.7,
              marginBottom: 8,
              maxHeight: "30vh",
              overflowY: "auto",
            }}
          />
          <button
            onClick={generateBanner}
            style={{
              padding: "5px 11px",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              border: "1px solid var(--gv-bdr)",
              borderRadius: 8,
              background: "var(--gv-card)",
              color: "var(--gv-tx2)",
              fontFamily: "inherit",
              letterSpacing: ".01em",
            }}
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}

function LabelText({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </p>
  );
}
