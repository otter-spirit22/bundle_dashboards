// src/components/InsightsHeatmapCompact.tsx
import React from "react";

// Keep these in sync with your app-wide types
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

export type CalendarBin = {
  label: string;            // e.g., "Next 15 days"
  start: Date;
  end: Date;
  items: HeatmapInsight[];  // insights that fall in [start, end]
};

type Props = {
  /** All insights (already computed elsewhere) */
  data: HeatmapInsight[];

  /** Primary window size. The component will show TWO tiles:
   *  [0, rangeDays) and [rangeDays, 2*rangeDays).
   */
  rangeDays: 15 | 30 | 60 | 90;

  /** Category filter to apply (empty array = no filter) */
  categories: InsightCategory[];

  /** Click handler for a tile (bin) */
  onTileClick: (bin: CalendarBin) => void;
};

function inRange(dt: Date, start: Date, end: Date) {
  return dt >= start && dt <= end;
}

function parseISOorNull(iso?: string) {
  if (!iso) return null;
  const t = Date.parse(iso);
  return isNaN(t) ? null : new Date(t);
}

const sevRank: Record<HeatmapInsight["severity"], number> = {
  urgent: 3,
  warn: 2,
  opportunity: 1,
  good: 0,
};

export default function InsightsHeatmapCompact({
  data,
  rangeDays,
  categories,
  onTileClick,
}: Props) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Build two contiguous windows: [0, rangeDays) and [rangeDays, 2*rangeDays)
  const start1 = new Date(now);
  const end1 = new Date(now);
  end1.setDate(end1.getDate() + rangeDays - 1);

  const start2 = new Date(end1);
  start2.setDate(start2.getDate() + 1);
  const end2 = new Date(start2);
  end2.setDate(end2.getDate() + rangeDays - 1);

  const activeCats = new Set(categories);

  const filtered = data.filter((i) => {
    if (activeCats.size > 0 && !activeCats.has(i.category)) return false;
    const d = parseISOorNull(i.detection_date);
    return !!d && d >= now; // only upcoming/now
  });

  const bucket = (start: Date, end: Date, label: string): CalendarBin => {
    const items = filtered
      .filter((i) => {
        const d = parseISOorNull(i.detection_date);
        return !!d && inRange(d!, start, end);
      })
      .sort((a, b) => {
        // sort inside bin: severity desc, then soonest date
        const r = sevRank[b.severity] - sevRank[a.severity];
        if (r !== 0) return r;
        const ad = a.detection_date ? Date.parse(a.detection_date) : Number.POSITIVE_INFINITY;
        const bd = b.detection_date ? Date.parse(b.detection_date) : Number.POSITIVE_INFINITY;
        return ad - bd;
      });

    return { label, start, end, items };
  };

  const bin1 = bucket(start1, end1, `Next ${rangeDays} days`);
  const bin2 = bucket(start2, end2, `Days ${rangeDays + 1}-${rangeDays * 2}`);

  const bins = [bin1, bin2];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {bins.map((bin, idx) => {
        const urgent = bin.items.filter((i) => i.severity === "urgent").length;
        const warn = bin.items.filter((i) => i.severity === "warn").length;
        const opp = bin.items.filter((i) => i.severity === "opportunity").length;

        return (
          <button
            key={idx}
            onClick={() => onTileClick(bin)}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition"
          >
            <div className="mb-1 text-sm text-slate-300">{bin.label}</div>
            <div className="text-2xl font-bold">{bin.items.length}</div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="badge border-white/20">urgent: {urgent}</span>
              <span className="badge border-white/20">warn: {warn}</span>
              <span className="badge border-white/20">opp: {opp}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
