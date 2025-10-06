// src/components/InsightsHeatmap.tsx
import * as React from "react";
import { prepareInsights, MonthBin } from "@/data/insightsAggregator";
import { InsightCategory, ComputedInsight } from "@/data/insightCategories";
import { format, parse } from "date-fns";

type Props = {
  data: Omit<ComputedInsight, "monthKey">[]; // computed insights you already generate
  months?: number;                            // default 12
  defaultCategories?: InsightCategory[];      // optional initial filters
  onMonthClick?: (bin: MonthBin) => void;     // hook to open side panel/modal
};

const CATEGORIES: InsightCategory[] = [
  "Growth Opportunities",
  "Retention Radar",
  "Service Drain",
  "Risk & Claims",
  "Data Quality",
];

// Simple color ramp based on intensity
function colorFor(intensity: number): string {
  if (intensity === 0) return "bg-gray-200";
  if (intensity <= 4)  return "bg-green-300";
  if (intensity <= 8)  return "bg-yellow-300";
  if (intensity <= 14) return "bg-orange-300";
  return "bg-red-400";
}

export default function InsightsHeatmap({
  data,
  months = 12,
  defaultCategories = [],
  onMonthClick,
}: Props) {
  const [selected, setSelected] = React.useState<Set<InsightCategory>>(new Set(defaultCategories));
  const bins = React.useMemo(
    () => prepareInsights(data, { months, categories: Array.from(selected) }),
    [data, months, selected]
  );

  function toggle(cat: InsightCategory) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat);
      else n.add(cat);
      return n;
    });
  }

  return (
    <section className="card p-4">
      <header className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">Upcoming Insights Heatmap</h3>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => {
            const active = selected.size === 0 || selected.has(cat);
            return (
              <button
                key={cat}
                className={`text-xs px-2 py-1 rounded border ${active ? "bg-indigo-600 text-white" : "bg-white/10"} `}
                onClick={() => toggle(cat)}
                title={active ? `Hide ${cat}` : `Show ${cat}`}
              >
                {cat}
              </button>
            );
          })}
          {selected.size > 0 && (
            <button
              className="text-xs px-2 py-1 rounded border"
              onClick={() => setSelected(new Set())}
              title="Clear category filter"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Grid of 12 months */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {bins.map((bin) => {
          // derive month label
          const d = parse(bin.monthKey + "-01", "yyyy-MM-dd", new Date());
          const label = format(d, "MMM yyyy");
          return (
            <button
              key={bin.monthKey}
              className={`rounded-lg p-3 text-left border hover:shadow transition ${colorFor(bin.intensity)} `}
              onClick={() => onMonthClick?.(bin)}
              title={`${label}\n${bin.total} insights`}
            >
              <div className="font-semibold">{label}</div>
              <div className="text-sm opacity-80">{bin.total} insights</div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                {Object.entries(bin.byCategory).map(([cat, n]) => (
                  <div key={cat} className="flex justify-between">
                    <span className="truncate">{cat.replace("&","& ")}</span>
                    <span className="font-semibold">{n || 0}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span>Legend:</span>
        <span className="inline-block w-4 h-4 bg-gray-200 rounded" title="0"> </span><span>0</span>
        <span className="inline-block w-4 h-4 bg-green-300 rounded" title="1–4"> </span><span>1–4</span>
        <span className="inline-block w-4 h-4 bg-yellow-300 rounded" title="5–8"> </span><span>5–8</span>
        <span className="inline-block w-4 h-4 bg-orange-300 rounded" title="9–14"> </span><span>9–14</span>
        <span className="inline-block w-4 h-4 bg-red-400 rounded" title="15+"> </span><span>15+</span>
      </div>
    </section>
  );
}
