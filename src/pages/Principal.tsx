// src/pages/Principal.tsx
import React from "react";
import Kpi from "../components/Kpi";
import Gauge from "../components/Gauge";
import Bullet from "../components/Bullet";
import Spark from "../components/Spark";
import InsightCard from "../components/InsightCard";

import InsightsHeatmapCompact, {
  HeatmapInsight,
  InsightCategory,
} from "../components/InsightsHeatmapCompact";

import { mockMetrics, mockInsights } from "../data/mock";
import { bands } from "../config/benchmarks";

// ---- data shims ----
type UploadedRow = Record<string, any>;
declare global {
  interface Window {
    __BB_METRICS__?: any;
    __BB_ROWS__?: UploadedRow[];
    __BB_INSIGHTS__?: HeatmapInsight[];
  }
}

function useMetrics() {
  return window.__BB_METRICS__ || mockMetrics;
}
function useRows(): UploadedRow[] {
  return window.__BB_ROWS__ || [];
}
function useInsights(rows: UploadedRow[]): HeatmapInsight[] {
  if (Array.isArray(window.__BB_INSIGHTS__) && window.__BB_INSIGHTS__!.length) {
    return window.__BB_INSIGHTS__!;
  }
  // very small fallback generator
  const titles = ["Bundling Gap", "Umbrella Opportunity", "Renewal No Review Window", "High RL Segment"];
  const cats: InsightCategory[] = ["Growth Opportunities", "Growth Opportunities", "Retention Radar", "Service Drain"];
  const sev: HeatmapInsight["severity"][] = ["opportunity", "opportunity", "urgent", "warn"];
  const out: HeatmapInsight[] = [];
  for (let i = 0; i < 40; i++) {
    const d = new Date();
    d.setDate(d.getDate() + ((i * 3) % 75)); // spread next ~75 days
    out.push({
      id: ((i % 4) + 1) as number,
      title: titles[i % titles.length],
      household_id: rows[i]?.household_id || `HH-${i + 1}`,
      detection_date: d.toISOString(),
      category: cats[i % cats.length],
      severity: sev[i % sev.length],
    });
  }
  return out;
}

const ALL_CATEGORIES: InsightCategory[] = [
  "Growth Opportunities",
  "Retention Radar",
  "Service Drain",
  "Risk & Compliance",
];

// ---- page ----
export default function Principal() {
  const m = useMetrics();
  const rows = useRows();
  const allInsights = useInsights(rows);

  // Filters
  const [rangeDays, setRangeDays] = React.useState<15 | 30 | 60 | 90>(30);
  const [selectedCats, setSelectedCats] = React.useState<InsightCategory[]>([]); // empty = all

  // Modal for tile click
  const [open, setOpen] = React.useState(false);
  const [selectedBin, setSelectedBin] = React.useState<any>(null);

  const toggleCat = (c: InsightCategory) =>
    setSelectedCats((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <h1 className="text-xl font-extrabold text-indigo-300">Principal Dashboard</h1>

      {/* KPIs */}
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

      {/* --- Compact “Upcoming” Calendar --- */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Upcoming (Compact)</h2>

          {/* Range buttons */}
          <div className="flex gap-1 text-xs">
            {[15, 30, 60, 90].map((r) => (
              <button
                key={r}
                className={`badge border-white/20 ${rangeDays === r ? "bg-white/10" : ""}`}
                onClick={() => setRangeDays(r as 15 | 30 | 60 | 90)}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 text-xs">
          {ALL_CATEGORIES.map((c) => {
            const active = selectedCats.length === 0 || selectedCats.includes(c);
            return (
              <button
                key={c}
                className={`badge border-white/20 ${active ? "bg-white/10" : "opacity-60"}`}
                onClick={() => toggleCat(c)}
                title={active ? "Included" : "Excluded"}
              >
                {c}
              </button>
            );
          })}
          {/* Quick “All/None” helpers */}
          <button
            className="badge border-white/20"
            onClick={() => setSelectedCats([])}
            title="Show all categories"
          >
            All
          </button>
          <button
            className="badge border-white/20"
            onClick={() => setSelectedCats([...ALL_CATEGORIES])}
            title="Start from all selected (click to toggle off individual)"
          >
            Select All
          </button>
          <button
            className="badge border-white/20"
            onClick={() => setSelectedCats([])}
            title="Clear filters"
          >
            Clear
          </button>
        </div>

        <InsightsHeatmapCompact
          data={allInsights}
          rangeDays={rangeDays}
          categories={selectedCats}
          onTileClick={(bin) => {
            setSelectedBin(bin);
            setOpen(true);
          }}
        />
      </div>

      {/* Modal with bin details (click from a tile) */}
      {open && (
        <>
          <div className="drawer-overlay" onClick={() => setOpen(false)} />
          <div className="card fixed left-1/2 top-20 z-50 w-[90vw] max-w-2xl -translate-x-1/2 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{selectedBin?.label || "Selected"}</h3>
              <button className="badge border-white/20" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto space-y-2">
              {(selectedBin?.items || []).map((it: HeatmapInsight, idx: number) => (
                <div key={idx} className="flex items-center justify-between rounded bg-white/5 p-2">
                  <div className="text-sm">
                    <div className="font-medium">{it.title}</div>
                    <div className="text-xs text-slate-400">
                      {it.category} • {it.severity} • HH {it.household_id || "—"}
                    </div>
                  </div>
                  <a
                    className="badge border-white/20"
                    href={`/household/${encodeURIComponent(it.household_id || "")}?insight=${it.id}`}
                  >
                    View
                  </a>
                </div>
              ))}
              {(!selectedBin?.items || selectedBin.items.length === 0) && (
                <div className="text-sm text-slate-400">No items in this window.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Suggested actions */}
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
