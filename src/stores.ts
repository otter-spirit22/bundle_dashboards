// src/stores.ts
export type UploadedRow = Record<string, any>;

export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type HeatmapInsight = {
  id: number;                // 1..50
  title: string;
  household_id?: string;
  detection_date?: string;   // ISO date
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
  impact?: number;           // optional score (0-100)
  urgency?: number;          // optional score (0-100)
};

// ---- Lightweight in-memory store via window shims (no duplicate globals) ----
const w = window as any;

export function setRows(rows: UploadedRow[]) {
  w.__BB_ROWS__ = rows;
}
export function getRows(): UploadedRow[] {
  return Array.isArray(w.__BB_ROWS__) ? w.__BB_ROWS__ : [];
}

export function setInsights(ins: HeatmapInsight[]) {
  w.__BB_INSIGHTS__ = ins;
}
export function getInsights(): HeatmapInsight[] {
  return Array.isArray(w.__BB_INSIGHTS__) ? w.__BB_INSIGHTS__ : [];
}

export function setMetrics(m: any) {
  w.__BB_METRICS__ = m;
}
export function getMetrics(): any {
  return w.__BB_METRICS__;
}
