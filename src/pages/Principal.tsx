// src/pages/Principal.tsx
import React from "react";

import Kpi from "../components/Kpi";
import Gauge from "../components/Gauge";
import Bullet from "../components/Bullet";
import Spark from "../components/Spark";
import InsightCard from "../components/InsightCard";
import InsightsHeatmap from "../components/InsightsHeatmap";

import { mockMetrics, mockInsights } from "../data/mock";
import { bands } from "../config/benchmarks";

// ✅ use the central store
import { getMetrics, getRows, getInsights } from "../stores";

// ---- Local types (UI only) ----
type UploadedRow = Record<string, any>;

type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

type HeatmapInsight = {
  id: number; // 1..50
  title: string;
  household_id?: string;
  detection_date?: string; // ISO date
  category: InsightCategory;
  severity: "good" | "
