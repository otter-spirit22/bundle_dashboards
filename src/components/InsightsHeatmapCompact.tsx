// src/components/InsightsHeatmapCompact.tsx
import React from "react";

/** ----- Shared types (exported so pages can import) ----- */
export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type HeatmapInsight = {
  id: number;                      // 1..50 (which insight)
  title: string;
  household_id?: string;
  detection_date?: string;         // ISO date (used for placement)
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
};

export type CalendarBin = {
  label: string;                   // e.g., "Next 30 days"
  start: Date;
  end: Date;
  items: HeatmapInsight[];
};

/** ----- Props for the compact, two-tile heatmap ----- */
type Props = {
  /** All insights (we’ll filter by date range + category) */
  data: HeatmapInsight[];
  /** One of 15 | 30 | 60 | 90; shows *two* adjacent windows */
  rangeDays: 15 | 30 | 60 | 90;
  /** Optional multi-select categories; empty/undefined => include all */
  categories?: InsightCategory[];
  /** Click handler returns the bin (with items) */
  onTileClick?: (bin: CalendarBin) => void;
};

/** ----- Helpers ----- */
const SEV_ORDER: HeatmapInsight["severity"][] = ["good", "opportunity", "warn", "urgent"];

function inRange(d: Date, start: Date, end: Date) {
  return d >= start && d < end;
}

function formatRangeLabel(start: Date, end: Date, fallback: string) {
  try {
    const s = start.toLocaleDateString();
    const e = end.toLocaleDateString();
    return `${s} → ${e}`;
  } catch {
    return fallback;
  }
}

function badgeClass(sev: HeatmapInsight["severity"]) {
  switch (sev) {
    case "urgent":
      return "bg-red-500/80 text-white";
    case "warn":
      return "bg-amber-500/80 text-white";
    case "opportunity":
      return "bg-indigo-500/80 text-white";
    default:
      return "bg-emerald-500/80 text-white";
  }
}

/** Summarize a bin’s items with tiny severity dots + count */
function BinSummary({ items }: { items: HeatmapInsight[] }) {
  const counts: Record<HeatmapInsight["severity"], number> = {
    good: 0,
    opportunity: 0,
    warn: 0,
    urgent: 0,
  };
  for (const it of items) counts[it.severity]++;

  const total = items.length;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="opacity-70">{total} item{total === 1 ? "" : "s"}</span>
      <div className="ml-2 flex items-center gap-1">
        {SEV_ORDER.map((s) =>
          counts[s] ? (
            <span
              key={s}
              title={`${s}: ${counts[s]}`}
              className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 ${badgeClass(
                s
              )}`}
            >
              {counts[s]}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}

/** ----- Component ----- */
export default function InsightsHeatmapCompact({
  data,
  rangeDays,
  categories = [],
  onTileClick,
}: Props) {
  const now = React.useMemo(() => new Date(), []);
  const start1 = React.useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), [now]);
  const end1 = React.useMemo(() => new Date(start1.getTime() + rangeDays * 24 * 60 * 60 * 1000), [start1, rangeDays]);

  const start2 = end1;
  const end2 = React.useMemo(() => new Date(start2.getTime() + rangeDays * 24 * 60 * 60 * 1000), [start2, rangeDays]);

  const catsOn = categories && categories.length > 0;

  function filterBy(binStart: Date, binEnd: Date) {
    return (data || []).filter((it) => {
      if (!it.detection_date) return false;
      const dt = new Date(it.detection_date);
      if (!inRange(dt, binStart, binEnd)) return false;
      if (catsOn && !categories.includes(it.category)) return false;
      return true;
    });
  }

  const bin1: CalendarBin = {
    label:
      rangeDays === 15
        ? "Next 15 days"
        : rangeDays === 30
        ? "Next 30 days"
        : rangeDays === 60
        ? "Next 60 days"
        : "Next 90 days",
    start: start1,
    end: end1,
    items: filterBy(start1, end1),
  };

  const bin2: CalendarBin = {
    label:
      rangeDays === 15
        ? "Days 16–30"
        : rangeDays === 30
        ? "Days 31–60"
        : rangeDays === 60
        ? "Days 61–120"
        : "Days 91–180",
    start: start2,
    end: end2,
    items: filterBy(start2, end2),
  };

  // Optional: show exact dates under labels
  const label1 = `${bin1.label} · ${formatRangeLabel(bin1.start, bin1.end, bin1.label)}`;
  const label2 = `${bin2.label} · ${formatRangeLabel(bin2.start, bin2.end, bin2.label)}`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[bin1, bin2].map((bin, i) => (
        <button
          key={i}
          onClick={() => onTileClick?.(bin)}
          className="rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
        >
          <div className="mb-2 text-sm font-semibold">{i === 0 ? label1 : label2}</div>

          {/* A simple stacked list of top 5 items in the bin */}
          <div className="space-y-1">
            {bin.items
              .slice(0, 5)
              .sort((a, b) => {
                // Show most severe first (urgent > warn > opportunity > good)
                return (
                  SEV_ORDER.indexOf(b.severity) - SEV_ORDER.indexOf(a.severity)
                );
              })
              .map((it, idx) => (
                <div
                  key={`${it.household_id || "HH"}-${it.id}-${idx}`}
                  className="flex items-center justify-between rounded bg-white/5 p-2"
                >
                  <div className="text-xs">
                    <div className="font-medium">#{it.id} {it.title}</div>
                    <div className="opacity-70">
                      HH: {it.household_id || "—"} • {it.category}
                    </div>
                  </div>
                  <span className={`badge ${badgeClass(it.severity)}`}>{it.severity}</span>
                </div>
              ))}

            {bin.items.length === 0 && (
              <div className="text-xs text-slate-400">No insights in this window.</div>
            )}
          </div>

          <div className="mt-3">
            <BinSummary items={bin.items} />
          </div>
        </button>
      ))}
    </div>
  );
}
