// src/stores.ts

// ---- Types ----
export type UploadedRow = Record<string, any>;

export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type Severity = "good" | "opportunity" | "warn" | "urgent";

export interface HeatmapInsight {
  id: number;                 // 1..50
  title: string;
  household_id?: string;
  detection_date?: string;    // ISO date
  category: InsightCategory;
  severity: Severity;
}

export interface Metrics {
  benchScore: number;
  timeBackHoursMoTopN: number;
  coverageDepthPct: number;
  remarketingLoadPer100: number;
  serviceTouchIndexMinPerHHYr: number;
  // add other metrics fields here if you compute them
}

// ---- Simple pub-sub state (no external deps) ----
type Listener = () => void;

const state: {
  rows: UploadedRow[];
  metrics: Metrics | null;
  insights: HeatmapInsight[];
} = {
  rows: [],
  metrics: null,
  insights: [],
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  });
}

// ---- Getters ----
export function getRows(): UploadedRow[] {
  return state.rows;
}
export function getMetrics(): Metrics | null {
  return state.metrics;
}
export function getInsights(): HeatmapInsight[] {
  return state.insights;
}
export function getState() {
  return state;
}

// ---- Setters (also mirror to window for legacy access) ----
export function setRows(rows: UploadedRow[]) {
  state.rows = Array.isArray(rows) ? rows : [];
  (window as any).__BB_ROWS__ = state.rows;
  emit();
}

export function setMetrics(metrics: Metrics) {
  state.metrics = metrics;
  (window as any).__BB_METRICS__ = state.metrics;
  emit();
}

export function setInsights(items: HeatmapInsight[]) {
  state.insights = Array.isArray(items) ? items : [];
  (window as any).__BB_INSIGHTS__ = state.insights;
  emit();
}

// ---- Subscribe / Unsubscribe ----
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
