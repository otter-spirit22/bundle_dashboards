// src/stores.ts
import type { HeatmapInsight } from "./data/insightsAggregator";

type Row = Record<string, any>;

let _rows: Row[] = [];
let _metrics: any = null;
let _insights: HeatmapInsight[] = [];

export function setRows(rows: Row[]) {
  _rows = Array.isArray(rows) ? rows : [];
}
export function setMetrics(m: any) {
  _metrics = m ?? null;
}
export function setInsights(i: HeatmapInsight[]) {
  _insights = Array.isArray(i) ? i : [];
}
export function getRows(): Row[] {
  return _rows;
}
export function getMetrics(): any {
  return _metrics;
}
export function getInsights(): HeatmapInsight[] {
  return _insights;
}

export function setData(payload: { rows?: Row[]; metrics?: any; insights?: HeatmapInsight[] }) {
  if (payload.rows) setRows(payload.rows);
  if (payload.metrics) setMetrics(payload.metrics);
  if (payload.insights) setInsights(payload.insights);
}
