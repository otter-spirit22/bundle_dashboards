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
  detection_date?: string; // ISO date
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
};

type Bin = {
  label: string;      // e.g., "Next 0–15d"
  start: Date;        // window start
  end: Date;          // window end (exclusive)
  items: HeatmapInsight[];
  counts: Record<HeatmapInsight["severity"], number>;
};

export type InsightsHeatmapCompactProps = {
  data: HeatmapInsight[];
  /** 15 | 30 | 60 | 90 */
  windowDays: 15 | 30 | 60 | 90;
  /** show exactly two cards (first half, second half of window) */
  twoCardsOnly?: boolean;
  /** optional category filter */
  categories?: InsightCategory[];
  /** click anywhere on a card (bin) */
  onWindowClick?: (bin: Bin) => void;
  /** click an individual insight; if omitted we render default <a> to /household/:id */
  onItemClick?: (insight: HeatmapInsight) => void;
};

function inRange(d: Date, start: Date, end: Date) {
  return d >= start && d < end;
}

export default function InsightsHeatmapCompact({
  data,
  windowDays,
  twoCardsOnly = true,
  categories,
  onWindowClick,
  onItemClick,
}: InsightsHeatmapCompactProps) {
  // filter by category
  const filtered = React.useMemo(
    () => (categories?.length ? data.filter((d) => categories.includes(d.category)) : data),
    [data, categories]
  );

  const now = React.useMemo(() => new Date(), []);
  const end = React.useMemo(() => {
    const e = new Date(now);
    e.setDate(e.getDate() + windowDays);
    return e;
  }, [now, windowDays]);

  // Build two bins: first half and second half of the window
  const half = Math.floor(windowDays / 2);
  const firstStart = now;
  const firstEnd = new Date(now); firstEnd.setDate(firstEnd.getDate() + half);
  const secondStart = firstEnd;
  const secondEnd = end;

  const mkBin = (label: string, s: Date, e: Date): Bin => {
    const items = filtered.filter((it) => {
      if (!it.detection_date) return false;
      const d = new Date(it.detection_date);
      return inRange(d, s, e);
    });
    const counts: Bin["counts"] = { good: 0, opportunity: 0, warn: 0, urgent: 0 };
    items.forEach((i) => (counts[i.severity] = (counts[i.severity] || 0) + 1));
    return { label, start: s, end: e, items, counts };
  };

  const bins: Bin[] = [
    mkBin(`Next 0–${half}d`, firstStart, firstEnd),
    mkBin(`Next ${half}–${windowDays}d`, secondStart, secondEnd),
  ];

  const Pill: React.FC<{ c: HeatmapInsight["severity"]; n: number }> = ({ c, n }) => (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
      <span
        className={`h-2 w-2 rounded-full ${
          c === "urgent" ? "bg-red-400"
          : c === "warn" ? "bg-yellow-400"
          : c === "opportunity" ? "bg-indigo-400"
          : "bg-emerald-400"
        }`}
      />
      {n}
    </span>
  );

  const openItem = (it: HeatmapInsight) => {
    if (onItemClick) return onItemClick(it);
    // default navigation
    const hh = encodeURIComponent(it.household_id || "");
    window.location.href = `/household/${hh}?insight=${it.id}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {bins.map((bin, idx) => (
        <div
          key={idx}
          role="button"
          tabIndex={0}
          onClick={() => onWindowClick?.(bin)}
          onKeyDown={(e) => e.key === "Enter" && onWindowClick?.(bin)}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 outline-none hover:bg-white/10 cursor-pointer"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">{bin.label}</div>
            <div className="flex gap-2">
              <Pill c="urgent" n={bin.counts.urgent} />
              <Pill c="warn" n={bin.counts.warn} />
              <Pill c="opportunity" n={bin.counts.opportunity} />
              <Pill c="good" n={bin.counts.good} />
            </div>
          </div>

          {/* Top 6 insights list inside the card, each row clickable */}
          <div className="space-y-1">
            {bin.items.slice(0, 6).map((it, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded bg-white/5 px-2 py-1 hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation(); // don't bubble to card click
                  openItem(it);
                }}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">{it.title}</div>
                  <div className="truncate text-xs text-slate-400">
                    HH: {it.household_id || "—"} • {it.category}
                  </div>
                </div>
                <span
                  className={`ml-2 h-2 w-2 flex-none rounded-full ${
                    it.severity === "urgent"
                      ? "bg-red-400"
                      : it.severity === "warn"
                      ? "bg-yellow-400"
                      : it.severity === "opportunity"
                      ? "bg-indigo-400"
                      : "bg-emerald-400"
                  }`}
                  title={it.severity}
                />
              </div>
            ))}

            {bin.items.length === 0 && (
              <div className="text-xs text-slate-400">No insights in this window.</div>
            )}

            {bin.items.length > 6 && (
              <div className="pt-1 text-right text-xs text-slate-400">
                +{bin.items.length - 6} more
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
