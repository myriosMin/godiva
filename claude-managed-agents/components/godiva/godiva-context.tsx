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
  type BannerTemplate,
} from "@/lib/godiva-data";

export interface GodivaState {
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
}

export type GodivaAction =
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
  | { type: "REJECT" };

const initialState: GodivaState = {
  selectedSignalId: null,
  step: 0,
  emailOpen: false,
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
};

function getSignal(id: number | null): Signal | null {
  if (id === null) return null;
  return SIGS.find((s) => s.id === id) ?? null;
}

function reducer(state: GodivaState, action: GodivaAction): GodivaState {
  switch (action.type) {
    case "SELECT_SIGNAL": {
      const sig = getSignal(action.signalId);
      if (!sig) return state;
      const tmplIdx = autoPickTmpl(sig);
      return {
        ...initialState,
        selectedSignalId: action.signalId,
        featToggles: sig.features.map(() => true),
        bannerTemplateIndex: tmplIdx,
        startedAt: new Date(),
      };
    }

    case "NEXT_STEP": {
      const sig = getSignal(state.selectedSignalId);
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
        const sig = getSignal(state.selectedSignalId);
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
    <GodivaContext value={{ state, dispatch, signals: SIGS, templates: TMPLS }}>
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
  return getSignal(state.selectedSignalId);
}
