// src/data/insightsAggregator.ts
// Minimal, safe implementation that produces heatmap-friendly insights.
// You can swap the rules later with your full 1..50 logic.

export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type HeatmapInsight = {
  id: number; // 1..50
  title: string;
  household_id?: string;
  detection_date?: string; // ISO
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
};

type Row = Record<string, any>;

function monthOffsetISO(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString();
}

// very small demo rule set (map to real rules later)
export function computeInsights50(rows: Row[]): HeatmapInsight[] {
  if (!rows || rows.length === 0) return [];

  const out: HeatmapInsight[] = [];

  // 1. Bundling Gap
  for (const r of rows) {
    const home = Number(r.home_flag || 0);
    const auto = Number(r.auto_flag || 0);
    const carriersDiff =
      r.primary_carrier && r.secondary_carrier_optional
        ? r.primary_carrier !== r.secondary_carrier_optional
        : false;

    if ((home && auto && carriersDiff) || home + auto === 1) {
      out.push({
        id: 1,
        title: "Bundling Gap",
        household_id: String(r.household_id ?? ""),
        detection_date: monthOffsetISO(0),
        category: "Growth Opportunities",
        severity: "opportunity",
      });
    }
  }

  // 15. Renewal No Review Window (simplified)
  for (const r of rows) {
    const renewal = r.renewal_date ? new Date(r.renewal_date) : null;
    const reviewed = r.last_reviewed_date ? new Date(r.last_reviewed_date) : null;
    if (renewal) {
      const daysToRenewal = Math.floor(
        (renewal.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const daysSinceReview = reviewed
        ? Math.floor((Date.now() - reviewed.getTime()) / (1000 * 60 * 60 * 24))
        : 9999;
      if (daysToRenewal < 30 && daysSinceReview > 60) {
        out.push({
          id: 15,
          title: "Renewal No Review Window",
          household_id: String(r.household_id ?? ""),
          detection_date: monthOffsetISO(0),
          category: "Retention Radar",
          severity: "urgent",
        });
      }
    }
  }

  // 21. High Minutes HH (top decile by touches * minutes)
  const mins = rows.map(
    (r) => Number(r.service_touches_12m || 0) * Number(r.avg_minutes_per_touch || 0)
  );
  const sorted = [...mins].filter((x) => !isNaN(x)).sort((a, b) => a - b);
  const p90 = sorted.length ? sorted[Math.floor(sorted.length * 0.9)] : Infinity;

  rows.forEach((r) => {
    const m = Number(r.service_touches_12m || 0) * Number(r.avg_minutes_per_touch || 0);
    if (m >= p90 && isFinite(m)) {
      out.push({
        id: 21,
        title: "High Minutes HH",
        household_id: String(r.household_id ?? ""),
        detection_date: monthOffsetISO(1),
        category: "Service Drain",
        severity: "warn",
      });
    }
  });

  // 44. Rate Shock Sensitivity (simplified)
  rows.forEach((r) => {
    const churn = Number(r.churn_risk_score_0_1 || 0);
    const remarkets = Number(r.remarkets_12m || 0);
    if (churn >= 0.6 || remarkets >= 1) {
      out.push({
        id: 44,
        title: "Rate Shock Sensitivity",
        household_id: String(r.household_id ?? ""),
        detection_date: monthOffsetISO(2),
        category: "Retention Radar",
        severity: churn >= 0.6 ? "urgent" : "opportunity",
      });
    }
  });

  return out;
}
