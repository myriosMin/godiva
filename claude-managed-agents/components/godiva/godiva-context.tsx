"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  SIGS,
  TMPLS,
  autoPickTmpl,
  fillTmpl,
  type Signal,
  type Feature,
  type BannerTemplate,
} from "@/lib/godiva-data";

export interface AgentClassification {
  sys: string;
  reason: string;
  sev: "critical" | "major" | "minor";
  domain: string;
  bundle: string;
  features: Feature[];
  noImpact: boolean;
  confidence: "high" | "medium" | "low";
  win: string;
  dur: string;
}

export interface AgentRecommendation {
  severity: "critical" | "major" | "minor";
  domain: string;
  bundle: string;
  affected_features: Array<{ name: string; impact: string }>;
  banner_title: string;
  banner_body: string;
  approvers_required: string[];
  blast_radius: "low" | "medium" | "high" | "extremely_high";
  confidence: "high" | "medium" | "low";
  sop_steps: string[];
  maintenance_start?: string;
  maintenance_end?: string;
  notes?: string;
}

export interface GodivaState {
  signals: Signal[];
  demoMode: boolean;
  selectedSignalId: number | null;
  step: 0 | 1 | 2 | 3;
  emailOpen: boolean;
  featToggles: boolean[];
  toggleBackend: boolean;
  ackNoImpact: boolean;
  bannerTemplateIndex: number;
  bannerTitle: string;
  bannerBody: string;
  bannerDone: boolean;
  bannerLoading: boolean;
  notes: string;
  approved: boolean;
  rejected: boolean;
  approvedAt: Date | null;
  startedAt: Date | null;
  agentClassification: AgentClassification | null;
  classifying: boolean;
  confirmed: boolean;
  confirmedAt: Date | null;
  // Agent session wiring
  agentSessionId: string | null;
  agentWorkflowRunId: string | null;
  analysisStatus: "idle" | "analyzing" | "ready" | "error";
  recommendation: AgentRecommendation | null;
}

export type GodivaAction =
  | { type: "ADD_SIGNAL"; signal: Signal }
  | { type: "MARK_SIGNAL_SEEN"; signalId: number }
  | { type: "SET_DEMO_MODE"; on: boolean }
  | { type: "SELECT_SIGNAL"; signalId: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_STEP"; step: 0 | 1 | 2 | 3 }
  | { type: "TOGGLE_EMAIL" }
  | { type: "TOGGLE_FEATURE"; index: number }
  | { type: "TOGGLE_BACKEND" }
  | { type: "ACK_NO_IMPACT" }
  | { type: "SET_BANNER_TEMPLATE"; index: number }
  | { type: "BANNER_LOADING_START" }
  | {
      type: "BANNER_LOADING_DONE";
      title: string;
      body: string;
      templateIndex: number;
    }
  | {
      type: "BANNER_LOADING_ERROR";
      title: string;
      body: string;
      templateIndex: number;
    }
  | { type: "SET_BANNER_TITLE"; title: string }
  | { type: "SET_BANNER_BODY"; body: string }
  | { type: "SET_NOTES"; notes: string }
  | { type: "APPROVE" }
  | { type: "REJECT" }
  | { type: "SET_CLASSIFYING" }
  | { type: "SET_CLASSIFICATION"; classification: AgentClassification }
  | { type: "CLEAR_CLASSIFICATION" }
  | { type: "CONFIRM" }
  | { type: "ANALYSIS_START"; sessionId: string; workflowRunId: string }
  | { type: "ANALYSIS_DONE"; recommendation: AgentRecommendation }
  | { type: "ANALYSIS_ERROR" };

const workflowDefaults = {
  step: 0 as const,
  emailOpen: true,
  featToggles: [],
  toggleBackend: true,
  ackNoImpact: false,
  bannerTemplateIndex: 0,
  bannerTitle: "",
  bannerBody: "",
  bannerDone: false,
  bannerLoading: false,
  notes: "",
  approved: false,
  rejected: false,
  approvedAt: null,
  startedAt: null,
  agentClassification: null,
  classifying: false,
  confirmed: false,
  confirmedAt: null,
  agentSessionId: null,
  agentWorkflowRunId: null,
  analysisStatus: "idle" as const,
  recommendation: null,
};

const initialState: GodivaState = {
  signals: SIGS,
  demoMode: false,
  selectedSignalId: null,
  ...workflowDefaults,
};

function reducer(state: GodivaState, action: GodivaAction): GodivaState {
  switch (action.type) {
    case "ADD_SIGNAL":
      return { ...state, signals: [action.signal, ...state.signals] };

    case "MARK_SIGNAL_SEEN":
      return {
        ...state,
        signals: state.signals.map((s) =>
          s.id === action.signalId ? { ...s, isNew: false } : s,
        ),
      };

    case "SET_DEMO_MODE":
      return { ...state, demoMode: action.on };

    case "SELECT_SIGNAL": {
      const sig = state.signals.find((s) => s.id === action.signalId);
      if (!sig) return state;
      const tmplIdx = autoPickTmpl(sig);
      return {
        ...state,
        ...workflowDefaults,
        selectedSignalId: action.signalId,
        featToggles: sig.features.map(() => true),
        bannerTemplateIndex: tmplIdx,
        startedAt: new Date(),
        agentSessionId: null,
        agentWorkflowRunId: null,
        analysisStatus: "idle",
        recommendation: null,
      };
    }

    case "NEXT_STEP": {
      const sig = state.signals.find((s) => s.id === state.selectedSignalId);
      if (state.step === 1 && sig?.noImpact && !state.ackNoImpact) return state;
      if (state.step >= 3) return state;
      return { ...state, step: (state.step + 1) as 0 | 1 | 2 | 3 };
    }

    case "PREV_STEP": {
      if (state.step <= 0) return state;
      return { ...state, step: (state.step - 1) as 0 | 1 | 2 | 3 };
    }

    case "SET_STEP": {
      if (action.step >= state.step) return state;
      return { ...state, step: action.step };
    }

    case "TOGGLE_EMAIL":
      return { ...state, emailOpen: !state.emailOpen };

    case "TOGGLE_FEATURE": {
      const newToggles = [...state.featToggles];
      newToggles[action.index] = !newToggles[action.index];
      return { ...state, featToggles: newToggles };
    }

    case "TOGGLE_BACKEND":
      return { ...state, toggleBackend: !state.toggleBackend };

    case "ACK_NO_IMPACT":
      return { ...state, ackNoImpact: true };

    case "SET_BANNER_TEMPLATE": {
      const newState = { ...state, bannerTemplateIndex: action.index };
      if (state.bannerDone) {
        const sig = state.signals.find((s) => s.id === state.selectedSignalId);
        const tmpl = TMPLS[action.index];
        if (sig && tmpl) {
          const filled = fillTmpl(tmpl, sig);
          newState.bannerTitle = filled.title;
          newState.bannerBody = filled.body;
        }
      }
      return newState;
    }

    case "BANNER_LOADING_START":
      return { ...state, bannerLoading: true, bannerDone: false };

    case "BANNER_LOADING_DONE":
      return {
        ...state,
        bannerLoading: false,
        bannerDone: true,
        bannerTitle: action.title,
        bannerBody: action.body,
        bannerTemplateIndex: action.templateIndex,
      };

    case "BANNER_LOADING_ERROR":
      return {
        ...state,
        bannerLoading: false,
        bannerDone: true,
        bannerTitle: action.title,
        bannerBody: action.body,
        bannerTemplateIndex: action.templateIndex,
      };

    case "SET_BANNER_TITLE":
      return { ...state, bannerTitle: action.title };

    case "SET_BANNER_BODY":
      return { ...state, bannerBody: action.body };

    case "SET_NOTES":
      return { ...state, notes: action.notes };

    case "APPROVE":
      return { ...state, approved: true, approvedAt: new Date() };

    case "REJECT":
      return { ...state, rejected: true };

    case "SET_CLASSIFYING":
      return { ...state, classifying: true, agentClassification: null };

    case "SET_CLASSIFICATION":
      return {
        ...state,
        classifying: false,
        agentClassification: action.classification,
      };

    case "CLEAR_CLASSIFICATION":
      return { ...state, classifying: false, agentClassification: null };

    case "CONFIRM":
      return { ...state, confirmed: true, confirmedAt: new Date() };

    case "ANALYSIS_START":
      return {
        ...state,
        analysisStatus: "analyzing",
        agentSessionId: action.sessionId,
        agentWorkflowRunId: action.workflowRunId,
        recommendation: null,
      };

    case "ANALYSIS_DONE": {
      const rec = action.recommendation;
      // Map agent's affected_features back to featToggles (all on by default)
      const currentSig = state.signals.find(
        (s) => s.id === state.selectedSignalId,
      );
      const featToggles = currentSig
        ? currentSig.features.map(() => true)
        : rec.affected_features.map(() => true);
      return {
        ...state,
        analysisStatus: "ready",
        recommendation: rec,
        bannerTitle: rec.banner_title,
        bannerBody: rec.banner_body,
        bannerDone: true,
        featToggles,
      };
    }

    case "ANALYSIS_ERROR":
      return { ...state, analysisStatus: "error" };

    default:
      return state;
  }
}

interface GodivaContextValue {
  state: GodivaState;
  dispatch: Dispatch<GodivaAction>;
  signals: Signal[];
  templates: BannerTemplate[];
}

const GodivaContext = createContext<GodivaContextValue | null>(null);

export function GodivaProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GodivaContext
      value={{ state, dispatch, signals: state.signals, templates: TMPLS }}
    >
      {children}
    </GodivaContext>
  );
}

export function useGodiva(): GodivaContextValue {
  const ctx = useContext(GodivaContext);
  if (!ctx) throw new Error("useGodiva must be used within GodivaProvider");
  return ctx;
}

export function useCurrentSignal(): Signal | null {
  const { state } = useGodiva();
  return state.signals.find((s) => s.id === state.selectedSignalId) ?? null;
}
