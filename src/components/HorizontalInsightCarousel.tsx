import React from "react";
import InsightCard from "./InsightCard";

type Urgency = "urgent" | "warn" | "opportunity" | "good";
type Category = "Growth Opportunities" | "Retention Radar" | "Service Drain" | "Risk & Compliance";

export type Insight = {
  key: string | number;
  title: string;
  description?: string;
  impact?: number;          // higher = more impactful
  urgency?: Urgency;        // bucketed severity
  confidence?: number;      // 0..1
  category?: Category;
  household_id?: string;
};

type Mode = "impact" | "urgency";

type Props = {
  title: string;
  insights: Insight[];
  mode?: Mode;                 // default: "impact"
  maxItems?: number;           // default: 10
  categoryFilter?: Category[]; // optional - only include these categories
  className?: string;
};

const urgencyRank: Record<Urgency, number> = {
  urgent: 3,
  warn: 2,
  opportunity: 1,
  good: 0,
};

export default function HorizontalInsightCarousel({
  title,
  insights,
  mode = "impact",
  maxItems = 10,
  categoryFilter,
  className = "",
}: Props) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  // filter
  let items = Array.isArray(insights) ? [...insights] : [];
  if (categoryFilter?.length) {
    const set = new Set(categoryFilter);
    items = items.filter((i) => (i.category ? set.has(i.category) : true));
  }

  // sort
  items.sort((a, b) => {
    if (mode === "impact") {
      // null-safe, highest first
      const ai = a.impact ?? -Infinity;
      const bi = b.impact ?? -Infinity;
      if (bi !== ai) return bi - ai;
      // tie-break by urgency rank
      return (urgencyRank[b.urgency || "good"] - urgencyRank[a.urgency || "good"]);
    } else {
      // urgency-first, then impact
      const au = urgencyRank[a.urgency || "good"];
      const bu = urgencyRank[b.urgency || "good"];
      if (bu !== au) return bu - au;
      return (b.impact ?? -Infinity) - (a.impact ?? -Infinity);
    }
  });

  items = items.slice(0, maxItems);

  const scrollByCards = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLDivElement>("[data-card]"); // first card
    const step = card ? card.clientWidth + 16 : 320; // include gap
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section className={`card p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Mode: <b className="text-slate-200 capitalize">{mode}</b> • Showing {items.length}
          </span>
          <div className="flex gap-1">
            <button
              className="badge border-white/20"
              onClick={() => scrollByCards("left")}
              aria-label="Scroll left"
            >
              ◀
            </button>
            <button
              className="badge border-white/20"
              onClick={() => scrollByCards("right")}
              aria-label="Scroll right"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* horizontal track */}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {items.map((ins) => (
          <div
            key={ins.key}
            data-card
            className="min-w-[320px] max-w-[320px] snap-start"
          >
            <InsightCard
              key={ins.key}
              title={ins.title}
              description={ins.description}
              impact={ins.impact}
              urgency={ins.urgency}
              confidence={ins.confidence}
              onAdd={() =>
                alert(`Open ${ins.title}${ins.household_id ? ` (HH ${ins.household_id})` : ""}`)
              }
            />
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-slate-400">No insights match the current filters.</div>
        )}
      </div>
    </section>
  );
}
