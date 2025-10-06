import React from "react";

// --- Local types so this file is self-contained ---
export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type InsightSeverity = "good" | "opportunity" | "warn" | "urgent";

export type HeatmapInsight = {
  id: number;                // 1..50 (dictionary id)
  title: string;
  household_id?: string;
  detection_date?: string;   // ISO date string
  category: InsightCategory;
  severity: InsightSeverity;
};

export type HeatmapBin = {
  monthIndex: number;        // 0..months-1
  date: Date;
  items: HeatmapInsight[];
  countsBySeverity: Record<InsightSeverity, number>;
};

type Props = {
  data: HeatmapInsight[];
  months?: number; // default 12
  defaultCategories?: InsightCategory[]; // if empty, show all
  onMonthClick?: (bin: HeatmapBin) => void;
};

// --- Small helpers ---
const startOfMonth = (d: D
