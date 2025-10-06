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
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

function monthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "short", year: "2-digit" });
}

function withinRange(target: Date, start: Date, end: Date) {
  return target >= start && target < end;
}

// Build month bins starting at current month, going forward N months
function aggregateByMonth(
  raw: HeatmapInsight[],
  months: number,
  categories: InsightCategory[] | undefined
): HeatmapBin[] {
  const now = startOfMonth(new Date());
  const bins: HeatmapBin[] = [];

  for (let i = 0; i < months; i++) {
    const monthStart = addMonths(now, i);
    const monthEnd = addMonths(now, i + 1);
    const items = raw.filter((r) => {
      if (!r.detection_date) return false;
      const when = new Date(r.detection_date);
      if (categories && categories.length && !categories.includes(r.category)) return false;
      return withinRange(when, monthStart, monthEnd);
    });

    const counts: Record<InsightSeverity, number> = {
      good: 0,
      opportunity: 0,
      warn: 0,
      urgent: 0,
    };
    items.forEach((it) => (counts[it.severity] = (counts[it.severity] || 0) + 1));

    bins.push({
      monthIndex: i,
      date: monthStart,
      items,
      countsBySeverity: counts,
    });
  }

  return bins;
}

// Compute a single intensity 0..1 from counts (weighted by severity)
function intensity(bin: HeatmapBin) {
  const w = { good: 0.2, opportunity: 0.6, warn: 0.8, urgent: 1.0 };
  const total =
    bin.countsBySeverity.good * w.good +
    bin.countsBySeverity.opportunity * w.opportunity +
    bin.countsBySeverity.warn * w.warn +
    bin.countsBySeverity.urgent * w.urgent;

  // Basic normalization: assume 10 weighted items ≈ max
  const norm = Math.min(total / 10, 1);
  return norm;
}

// Map intensity to a background color in your indigo brand
function bgFromIntensity(x: number) {
  // 0 => very light; 1 => deep indigo
  const base = 240; // indigo-ish hue
  const sat = Math.round(30 + 50 * x); // 30%..80%
  const light = Math.round(92 - 50 * x); // 92%..42%
  return `hsl(${base} ${sat}% ${light}%)`;
}

const severityDot = (count: number, title: string, color: string) => (
  <div className="flex items-center gap-1" title={title}>
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: color }}
    />
    <span className="text-xs opacity-80">{count}</span>
  </div>
);

// --- Component ---
export default function InsightsHeatmap({
  data,
  months = 12,
  defaultCategories = [],
  onMonthClick,
}: Props) {
  const bins = React.useMemo(
    () => aggregateByMonth(data || [], months, defaultCategories),
    [data, months, defaultCategories]
  );

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold">Upcoming Insights (Calendar Heatmap)</h2>
        <div className="text-xs opacity-70">
          Click a month to see the accounts and insights.
        </div>
      </div>

      {/* Grid: 12 columns on md+; wrap on small screens */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {bins.map((bin) => {
          const x = intensity(bin);
          const bg = bgFromIntensity(x);
          const border = x > 0 ? "border-indigo-300/50" : "border-white/10";

          return (
            <button
              key={bin.monthIndex}
              className={`rounded-xl border p-3 text-left transition hover:scale-[1.01] hover:shadow ${border}`}
              style={{ backgroundColor: bg }}
              onClick={() => onMonthClick && onMonthClick(bin)}
            >
              <div className="mb-1 text-sm font-semibold">{monthLabel(bin.date)}</div>
              <div className="text-xs opacity-80 mb-2">
                {bin.items.length} insight{bin.items.length === 1 ? "" : "s"}
              </div>

              {/* Severity mini-legend */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {severityDot(bin.countsBySeverity.urgent, "Urgent", "#ef4444")}
                {severityDot(bin.countsBySeverity.warn, "Warn", "#f59e0b")}
                {severityDot(bin.countsBySeverity.opportunity, "Opportunity", "#6366f1")}
                {severityDot(bin.countsBySeverity.good, "Good", "#10b981")}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-3 text-xs opacity-70">
        <span>Intensity:</span>
        <div className="flex h-2 w-28 overflow-hidden rounded">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <div key={t} className="h-2 flex-1" style={{ background: bgFromIntensity(t) }} />
          ))}
        </div>
        <span className="ml-2">more = busier month</span>
      </div>
    </div>
  );
}
