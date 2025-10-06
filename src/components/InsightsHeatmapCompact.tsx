// src/components/InsightsHeatmapCompact.tsx
import React from "react";

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

type Bin = {
  label: string;
  startDay: number; // inclusive, offset from now
  endDay: number;   // inclusive, offset from now
  items: HeatmapInsight[];
};

export type InsightsHeatmapCompactProps = {
  data: HeatmapInsight[];
  /** 15 | 30 | 60 | 90 */
  rangeDays: 15 | 30 | 60 | 90;
  /** empty = all */
  categories: InsightCategory[];
  onTileClick?: (bin: Bin) => void;
};

function daysFromNow(iso?: string): number {
  if (!iso) return 99999;
  const d = new Date(iso);
  const now = new Date();
  // normalize to midnight to make ranges stable
  const ms = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) -
             Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default function InsightsHeatmapCompact({
  data,
  rangeDays,
  categories,
  onTileClick,
}: InsightsHeatmapCompactProps) {
  // Filter by range and category
  const half = Math.ceil(rangeDays / 2);
  const catSet = new Set(categories);

  const inRange = data.filter((it) => {
    const df = daysFromNow(it.detection_date);
    const catOK = categories.length === 0 || catSet.has(it.category);
    return df >= 0 && df <= rangeDays && catOK;
  });

  // Two bins max: first half & second half
  const binA: Bin = {
    label: rangeDays === 15
      ? "Next 1–8 days"
      : `Next 1–${half} days`,
    startDay: 0,
    endDay: half - 1,
    items: [],
  };
  const binB: Bin = {
    label: rangeDays === 15
      ? "Days 9–15"
      : `Days ${half + 1}–${rangeDays}`,
    startDay: half,
    endDay: rangeDays,
    items: [],
  };

  inRange.forEach((it) => {
    const df = daysFromNow(it.detection_date);
    if (df <= binA.endDay) binA.items.push(it);
    else binB.items.push(it);
  });

  const bins = [binA, binB];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {bins.map((bin, idx) => (
        <div key={idx} className="rounded-xl bg-white/5 p-3 border border-white/10">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">{bin.label}</div>
            <button
              className="badge border-white/20"
              onClick={() => onTileClick?.(bin)}
            >
              View {bin.items.length}
            </button>
          </div>

          {/* Tiny list preview */}
          <div className="space-y-2 max-h-40 overflow-auto pr-1">
            {bin.items.slice(0, 6).map((it, i) => (
              <a
                key={i}
                className="block rounded bg-white/5 px-2 py-1 text-sm hover:bg-white/10"
                href={`/household/${encodeURIComponent(it.household_id || "")}?insight=${it.id}`}
                title={`HH ${it.household_id || "—"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{it.title}</span>
                  <span className={`text-xs ml-2 ${badgeClass(it.severity)}`}>
                    {it.severity}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {it.category} • HH {it.household_id || "—"}
                </div>
              </a>
            ))}
            {bin.items.length === 0 && (
              <div className="text-xs text-slate-400">No upcoming items.</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function badgeClass(sev: HeatmapInsight["severity"]) {
  if (sev === "urgent") return "text-red-400";
  if (sev === "warn") return "text-amber-300";
  if (sev === "opportunity") return "text-indigo-300";
  return "text-emerald-300";
}
