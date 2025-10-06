// src/components/HorizontalInsightCarousel.tsx
import React from "react";

export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type CarouselInsight = {
  id: number;
  title: string;
  household_id?: string;
  detection_date?: string;
  category?: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
  impact?: number; // optional; defaults handled below
};

type Props = {
  title: string;
  items: CarouselInsight[];
  total?: number;
};

const sevClass = (s: CarouselInsight["severity"]) =>
  s === "urgent"
    ? "bg-red-500/80"
    : s === "warn"
    ? "bg-yellow-500/80"
    : s === "opportunity"
    ? "bg-indigo-500/80"
    : "bg-emerald-600/80";

export default function HorizontalInsightCarousel({ title, items, total }: Props) {
  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="font-semibold">{title}</h2>
        <div className="text-3xl font-extrabold tabular-nums">{total ?? items.length}</div>
      </div>

      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <div className="inline-flex gap-3 pr-2">
          {items.map((i) => {
            const hh = i.household_id ?? "—";
            const impact = i.impact ?? 0;
            const when = i.detection_date
              ? new Date(i.detection_date).toLocaleDateString()
              : "—";
            const cat = i.category ?? "Growth Opportunities";
            return (
              <a
                key={`${i.id}-${hh}`}
                href={`/household?hh=${encodeURIComponent(hh)}&id=${i.id}`}
                className="min-w-[220px] rounded bg-white/5 p-3 hover:bg-white/10"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-xs opacity-70">#{i.id}</div>
                  <span className={`badge ${sevClass(i.severity)}`}>{i.severity}</span>
                </div>
                <div className="text-sm font-medium line-clamp-2">{i.title || "Untitled"}</div>
                <div className="mt-1 text-xs opacity-70">
                  HH: {hh} • Impact: <span className="tabular-nums">{impact}</span>
                </div>
                <div className="text-[11px] opacity-60">{cat} • {when}</div>
              </a>
            );
          })}
          {items.length === 0 && (
            <div className="text-sm text-slate-400 p-2">No items for current filters.</div>
          )}
        </div>
      </div>
    </section>
  );
}
