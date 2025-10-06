// src/pages/Principal.tsx
import React from "react";
import Kpi from "../components/Kpi";
import Gauge from "../components/Gauge";
import Bullet from "../components/Bullet";
import Spark from "../components/Spark";
import InsightCard from "../components/InsightCard";

import InsightsHeatmapCompact, {
  CalendarBin,
  InsightCategory,
  HeatmapInsight,
} from "../components/InsightsHeatmapCompact";

import { bands } from "../config/benchmarks";
import { mockMetrics, mockInsights } from "../data/mock";
import { getMetrics, getInsights } from "../stores";

// ---------------- Helpers & hooks ----------------

function useMetrics() {
  return getMetrics?.() || mockMetrics;
}
function useInsights(): HeatmapInsight[] {
  const fromStore = (getInsights?.() || []) as HeatmapInsight[];
  return Array.isArray(fromStore) ? fromStore : [];
}

const ALL_CATEGORIES: InsightCategory[] = [
  "Growth Opportunities",
  "Retention Radar",
  "Service Drain",
  "Risk & Compliance",
];

const SEV_RANK: Record<HeatmapInsight["severity"], number> = {
  urgent: 3,
  warn: 2,
  opportunity: 1,
  good: 0,
};

// ---------------- Component ----------------

export default function Principal() {
  const m = useMetrics();
  const insights = useInsights();

  // 15/30/60/90 toggle
  const [rangeDays, setRangeDays] = React.useState<15 | 30 | 60 | 90>(30);

  // Category filter (empty = all)
  const [catFilter, setCatFilter] = React.useState<InsightCategory[]>([]);

  // Modal on tile click
  const [open, setOpen] = React.useState(false);
  const [selectedBin, setSelectedBin] = React.useState<CalendarBin | null>(null);

  const toggleCategory = (cat: InsightCategory) =>
    setCatFilter((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  // Top 10 lists (upcoming only, highest urgency first, then soonest)
  const now = Date.now();
  const upcoming = insights.filter((i) => {
    const t = i.detection_date ? Date.parse(i.detection_date) : NaN;
    return !isNaN(t) && t >= now;
  });

  const growthTop = upcoming
    .filter((i) => i.category === "Growth Opportunities")
    .sort((a, b) => {
      const sev = SEV_RANK[b.severity] - SEV_RANK[a.severity];
      if (sev) return sev;
      const ad = a.detection_date ? Date.parse(a.detection_date) : Infinity;
      const bd = b.detection_date ? Date.parse(b.detection_date) : Infinity;
      return ad - bd;
    })
    .slice(0, 10);

  const retentionTop = upcoming
    .filter((i) => i.category === "Retention Radar")
    .sort((a, b) => {
      const sev = SEV_RANK[b.severity] - SEV_RANK[a.severity];
      if (sev) return sev;
      const ad = a.detection_date ? Date.parse(a.detection_date) : Infinity;
      const bd = b.detection_date ? Date.parse(b.detection_date) : Infinity;
      return ad - bd;
    })
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <h1 className="text-xl font-extrabold text-indigo-300">Principal Dashboard</h1>

      {/* Top KPI Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Gauge value={m.benchScore} max={100} label="BenchScore™" />
        <Kpi
          label="Time-Back Number™"
          value={`${Math.round(m.timeBackHoursMoTopN)} hrs/mo`}
          metric="benchScore"
          numeric={m.benchScore}
          tooltip="Monthly hours reclaimable from Top-N split accounts"
        />
        <Kpi
          label="Coverage Depth"
          value={`${m.coverageDepthPct.toFixed(0)}%`}
          metric="coverageDepth"
          numeric={m.coverageDepthPct / 100}
        />
      </div>

      {/* Ops Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi
          label="Remarketing Load"
          value={`${m.remarketingLoadPer100.toFixed(1)} / 100`}
          metric="remarketingLoad"
          numeric={m.remarketingLoadPer100}
        />
        <Bullet
          label="Service Touch Index"
          value={m.serviceTouchIndexMinPerHHYr}
          target={bands.serviceTouchIndex.healthy}
          goodIsLow
        />
        <Spark label="Tenure Momentum (sim)" points={[6.4, 6.5, 6.6, 6.7, 6.8]} />
      </div>

      {/* Upcoming (compact) */}
      <div className="card p-4">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-bold">Upcoming Insights</h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Range */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">Range:</span>
              {[15, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  className={`badge border-white/20 ${rangeDays === d ? "bg-white/20" : ""}`}
                  onClick={() => setRangeDays(d as 15 | 30 | 60 | 90)}
                >
                  {d}d
                </button>
              ))}
            </div>

            {/* Categories */}
            <div className="ml-2 flex items-center gap-1">
              <span className="text-xs text-slate-400">Categories:</span>
              {ALL_CATEGORIES.map((c) => {
                const on = catFilter.includes(c);
                return (
                  <button
                    key={c}
                    className={`badge border-white/20 ${on ? "bg-white/20" : ""}`}
                    onClick={() => toggleCategory(c)}
                  >
                    {c}
                  </button>
                );
              })}
              <button className="badge border-white/20" onClick={() => setCatFilter([])}>
                Clear
              </button>
            </div>
          </div>
        </div>

        <InsightsHeatmapCompact
          data={insights}
          rangeDays={rangeDays}
          categories={catFilter}
          onTileClick={(bin: CalendarBin) => {
            setSelectedBin(bin);
            setOpen(true);
          }}
        />
      </div>

      {/* Clicked bin modal */}
      {open && (
        <>
          <div className="drawer-overlay" onClick={() => setOpen(false)} />
          <div className="card fixed left-1/2 top-20 z-50 w-[92vw] max-w-2xl -translate-x-1/2 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{selectedBin?.label || "Selected Window"}</h3>
              <button className="badge border-white/20" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto space-y-2">
              {(selectedBin?.items || []).map((it, idx) => (
                <div
                  key={`${it.household_id || "HH"}-${it.id}-${idx}`}
                  className="flex items-center justify-between rounded bg-white/5 p-2"
                >
                  <div className="text-sm">
                    <div className="font-medium">#{it.id} {it.title}</div>
                    <div className="text-xs text-slate-400">
                      HH: {it.household_id || "—"} • {it.category} • {it.severity}
                      {it.detection_date ? ` • ${new Date(it.detection_date).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <a
                    className="badge border-white/20"
                    href={`/household?hh=${encodeURIComponent(it.household_id || "")}&id=${it.id}`}
                  >
                    View
                  </a>
                </div>
              ))}

              {(!selectedBin?.items || selectedBin.items.length === 0) && (
                <div className="text-sm text-slate-400">No insights in this window.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Top 10 lists */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-2 font-semibold">Top 10 Growth (Upcoming)</h3>
          <ul className="space-y-2 text-sm">
            {growthTop.map((i, idx) => (
              <li
                key={`growth-${i.id}-${i.household_id}-${idx}`}
                className="flex items-center justify-between rounded bg-white/5 p-2"
              >
                <div>
                  <div className="font-medium">#{i.id} {i.title}</div>
                  <div className="text-xs text-slate-400">
                    HH: {i.household_id || "—"} • {i.severity}
                    {i.detection_date ? ` • ${new Date(i.detection_date).toLocaleDateString()}` : ""}
                  </div>
                </div>
                <a
                  className="badge border-white/20"
                  href={`/household?hh=${encodeURIComponent(i.household_id || "")}&id=${i.id}`}
                >
                  View
                </a>
              </li>
            ))}
            {growthTop.length === 0 && <li className="text-xs text-slate-400">No upcoming growth items.</li>}
          </ul>
        </div>

        <div className="card p-4">
          <h3 className="mb-2 font-semibold">Top 10 Retention Radar (Upcoming)</h3>
          <ul className="space-y-2 text-sm">
            {retentionTop.map((i, idx) => (
              <li
                key={`ret-${i.id}-${i.household_id}-${idx}`}
                className="flex items-center justify-between rounded bg-white/5 p-2"
              >
                <div>
                  <div className="font-medium">#{i.id} {i.title}</div>
                  <div className="text-xs text-slate-400">
                    HH: {i.household_id || "—"} • {i.severity}
                    {i.detection_date ? ` • ${new Date(i.detection_date).toLocaleDateString()}` : ""}
                  </div>
                </div>
                <a
                  className="badge border-white/20"
                  href={`/household?hh=${encodeURIComponent(i.household_id || "")}&id=${i.id}`}
                >
                  View
                </a>
              </li>
            ))}
            {retentionTop.length === 0 && <li className="text-xs text-slate-400">No upcoming retention items.</li>}
          </ul>
        </div>
      </div>

      {/* Your existing suggestion cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {mockInsights.slice(0, 3).map((ins) => (
          <InsightCard
            key={ins.key}
            title={ins.title}
            description={ins.description}
            impact={ins.impact}
            urgency={ins.urgency}
            confidence={ins.confidence}
            onAdd={() => alert(`Added ${ins.title} to plan`)}
          />
        ))}
      </div>
    </div>
  );
}
