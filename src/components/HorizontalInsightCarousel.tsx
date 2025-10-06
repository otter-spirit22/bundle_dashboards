import React from "react";
import type { HeatmapInsight } from "../types/insights";

type Props = {
  title: string;
  items: HeatmapInsight[];
  emptyText?: string;
  heightPx?: number; // inner scroll area height
};

function sevClasses(sev: HeatmapInsight["severity"]) {
  switch (sev) {
    case "urgent":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "warn":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "opportunity":
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    default:
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  }
}

export default function HorizontalInsightCarousel({
  title,
  items,
  emptyText = "Nothing to show.",
  heightPx = 180,
}: Props) {
  const total = items.length;

  return (
    <section className="card p-4">
      {/* Header */}
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-bold">{title}</h2>
        <div className="text-3xl font-extrabold tabular-nums leading-none">{total}</div>
      </div>

      {/* Horizontal scroller */}
      <div
        className="overflow-x-auto overflow-y-hidden"
        style={{ height: heightPx }}
      >
        <div className="flex gap-3 pr-2">
          {items.map((it, idx) => {
            const hh = it.household_id ?? "";
            const dateLabel = it.detection_date
              ? new Date(it.detection_date).toLocaleDateString()
              : "—";

            return (
              <a
                key={`${hh}-${it.id}-${idx}`}
                href={`/household?hh=${encodeURIComponent(hh)}&id=${it.id}`}
                className="min-w-[240px] max-w-[260px] rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full border whitespace-nowrap">
                    {it.category}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${sevClasses(
                      it.severity
                    )}`}
                  >
                    {it.severity}
                  </span>
                </div>

                <div className="font-semibold text-sm mb-1 line-clamp-2">
                  #{it.id} {it.title}
                </div>

                <div className="text-xs opacity-70">
                  HH: {hh || "—"}
                  <br />
                  Due: {dateLabel}
                </div>
              </a>
            );
          })}

          {total === 0 && (
            <div className="text-sm text-slate-400 self-center">{emptyText}</div>
          )}
        </div>
      </div>
    </section>
  );
}
