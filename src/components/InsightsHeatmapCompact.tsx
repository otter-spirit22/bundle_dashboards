// src/components/InsightsHeatmapCompact.tsx
import React from "react";

export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type HeatmapInsight = {
  id: number;               // 1..50
  title: string;
  household_id?: string;
  detection_date?: string;  // ISO date
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
};

type Bin = {
  label: string;
  start: Date;
  end: Date;
  items: HeatmapInsight[];
  counts: Record<HeatmapInsight["severity"], number>;
  total: number;
};

type Props = {
  data: HeatmapInsight[];
  /** One of 15 | 30 | 60 | 90 (days). Default 30. */
  windowDays?: 15 | 30 | 60 | 90;
  /** Only show two cards (current & next). Default true. */
  twoCardsOnly?: boolean;
  /** Optional category filter; if empty or undefined, show all. */
  categories?: InsightCategory[];
  /** Called when a card is clicked. */
  onWindowClick?: (bin: Bin) => void;
  /** Show a small legend strip. Default true. */
  showLegend?: boolean;
};

const sevList: HeatmapInsight["severity"][] = [
  "urgent",
  "warn",
  "opportunity",
  "good",
];

function inRange(d: Date, start: Date, end: Date) {
  return d >= start && d < end;
}

function labelFor(start: Date, end: Date) {
  const f = (dt: Date) =>
    dt.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  return `${f(start)} → ${f(end)}`;
}

function makeBins(
  src: HeatmapInsight[],
  windowDays: 15 | 30 | 60 | 90,
  categories?: InsightCategory[]
): Bin[] {
  const now = new Date();
  const start0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // today @ 00:00

  const windows = [
    [0, windowDays],
    [windowDays, windowDays * 2],
  ] as const;

  const filtered = categories?.length
    ? src.filter((i) => categories.includes(i.category))
    : src;

  const bins: Bin[] = windows.map(([offStart, offEnd]) => {
    const start = new Date(start0);
    start.setDate(start.getDate() + offStart);
    const end = new Date(start0);
    end.setDate(end.getDate() + offEnd);

    const items = filtered.filter((i) => {
      if (!i.detection_date) return false;
      const d = new Date(i.detection_date);
      return inRange(d, start, end);
    });

    const counts = {
      urgent: 0,
      warn: 0,
      opportunity: 0,
      good: 0,
    } as Record<HeatmapInsight["severity"], number>;

    for (const it of items) counts[it.severity]++;

    return {
      label: labelFor(start, end),
      start,
      end,
      items,
      counts,
      total: items.length,
    };
  });

  return bins;
}

export default function InsightsHeatmapCompact({
  data,
  windowDays = 30,
  twoCardsOnly = true,
  categories,
  onWindowClick,
  showLegend = true,
}: Props) {
  const bins = makeBins(data, windowDays, categories);
  const shown = twoCardsOnly ? bins.slice(0, 2) : bins;

  return (
    <div className="card p-4">
      <h3 className="mb-3 font-semibold">Upcoming Insights (Compact)</h3>

      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((bin, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onWindowClick?.(bin)}
            className="rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
          >
            <div className="mb-1 text-sm text-slate-300">{bin.label}</div>
            <div className="text-lg font-bold">
              {bin.total} insight{bin.total === 1 ? "" : "s"}
            </div>

            <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
              {sevList.map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      s === "urgent"
                        ? "bg-red-400"
                        : s === "warn"
                        ? "bg-amber-400"
                        : s === "opportunity"
                        ? "bg-indigo-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  <span className="text-slate-300">{bin.counts[s]}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {showLegend && (
        <div className="mt-3 text-xs text-slate-400">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-400" /> urgent
          <span className="ml-3 mr-2 inline-block h-2 w-2 rounded-full bg-amber-400" /> warn
          <span className="ml-3 mr-2 inline-block h-2 w-2 rounded-full bg-indigo-400" /> opportunity
          <span className="ml-3 mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" /> good
        </div>
      )}
    </div>
  );
}
