// src/data/insightsAggregator.ts
import type { UploadedRow, HeatmapInsight, InsightCategory } from "../stores";

export function computeInsights50(rows: UploadedRow[]): HeatmapInsight[] {
  const cats: InsightCategory[] = [
    "Growth Opportunities",
    "Retention Radar",
    "Service Drain",
    "Risk & Compliance",
  ];
  const titles = [
    "Bundling Gap",
    "Umbrella Opportunity",
    "Renewal No Review Window",
    "High RL Segment",
    "Rate Shock Sensitivity",
    "Review Freshness Gap",
  ];
  const sev: HeatmapInsight["severity"][] = ["opportunity", "urgent", "warn", "good"];

  const N = Math.max(rows.length, 40);
  const out: HeatmapInsight[] = [];

  for (let i = 0; i < N; i++) {
    const base = rows[i] || {};
    const hh = String(base.household_id ?? `HH${String(i + 1).padStart(4, "0")}`);
    const when = new Date();
    when.setDate(when.getDate() + (i % 75)); // spread over ~2.5 months

    out.push({
      id: ((i % 50) + 1) as number,
      title: titles[i % titles.length],
      household_id: hh,
      detection_date: when.toISOString(),
      category: cats[i % cats.length],
      severity: sev[i % sev.length],
      impact: Math.round(60 + (i % 40)),  // fake
      urgency: Math.round(50 + ((75 - (i % 75)) / 75) * 50), // nearer date = higher urgency
    });
  }
  return out;
}
