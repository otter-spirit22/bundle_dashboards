// src/data/insightsAggregator.ts
import { format, addMonths, startOfMonth, isBefore, isAfter } from "date-fns";
import { ComputedInsight, INSIGHT_CATEGORY_MAP, InsightCategory, SEVERITY_SCORE } from "./insightCategories";

// Helper: build YYYY-MM
export function toMonthKey(dateISO: string): string {
  const d = new Date(dateISO);
  return format(d, "yyyy-MM");
}

export interface MonthBin {
  monthKey: string;             // "2025-01"
  total: number;                // count of insights (after filter)
  intensity: number;            // sum of severity scores (for color)
  byCategory: Record<InsightCategory, number>;
  items: ComputedInsight[];
}

export function monthsForward(n: number = 12): string[] {
  const out: string[] = [];
  const start = startOfMonth(new Date());
  for (let i = 0; i < n; i++) {
    out.push(format(addMonths(start, i), "yyyy-MM"));
  }
  return out;
}

/**
 * prepareInsights:
 * - Normalize detection_date and monthKey
 * - Filter to window (today .. +N months)
 * - Filter by selected categories (if any)
 */
export function prepareInsights(
  raw: Omit<ComputedInsight, "monthKey">[],
  opts?: {
    months?: number;
    categories?: InsightCategory[];
  }
): MonthBin[] {
  const months = monthsForward(opts?.months ?? 12);
  const monthSet = new Set(months);
  const selected = new Set(opts?.categories ?? []);

  const bins: Record<string, MonthBin> = {};
  months.forEach(mk => {
    bins[mk] = {
      monthKey: mk,
      total: 0,
      intensity: 0,
      byCategory: {
        "Growth Opportunities": 0,
        "Retention Radar": 0,
        "Service Drain": 0,
        "Risk & Claims": 0,
        "Data Quality": 0,
      },
      items: []
    };
  });

  const now = new Date();
  const horizon = addMonths(startOfMonth(now), (opts?.months ?? 12));

  raw.forEach(r => {
    const detectionISO = r.detection_date ?? new Date().toISOString();
    const d = new Date(detectionISO);
    if (isBefore(d, now) || isAfter(d, horizon)) return;

    const monthKey = toMonthKey(detectionISO);
    if (!monthSet.has(monthKey)) return;

    // attach derived fields
    const cat = r.category ?? INSIGHT_CATEGORY_MAP[r.id];
    const item: ComputedInsight = { ...r, category: cat, monthKey };

    // category filter (if provided)
    if (selected.size && !selected.has(item.category)) return;

    const bin = bins[monthKey];
    bin.total += 1;
    bin.intensity += SEVERITY_SCORE[item.severity];
    bin.byCategory[item.category] = (bin.byCategory[item.category] ?? 0) + 1;
    bin.items.push(item);
  });

  return months.map(mk => bins[mk]);
}
