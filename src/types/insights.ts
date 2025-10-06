// Shared types used across pages/components

export type UploadedRow = Record<string, any>;

export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type HeatmapInsight = {
  id: number;                 // 1..50
  title: string;
  household_id?: string;
  detection_date?: string;    // ISO date
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
};
