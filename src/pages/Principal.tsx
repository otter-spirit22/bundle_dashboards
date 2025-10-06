// src/pages/Principal.tsx
import React from "react";
import Kpi from "../components/Kpi";
import Gauge from "../components/Gauge";
import Bullet from "../components/Bullet";
import Spark from "../components/Spark";
import InsightCard from "../components/InsightCard";
import InsightsHeatmap from "../components/InsightsHeatmap";

import { mockMetrics, mockInsights } from "../data/mock";
import { bands } from "../config/benchmarks";

// ---------- Types ----------
type UploadedRow = Record<string, any>;

type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

type HeatmapInsight = {
  id: number;                // 1..50 (dictionary id)
  title: string;
  household_id?: string;
  detection_date?: string;   // ISO date
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
};

declare global {
  interface Window {
    __BB_METRICS__?: any;
    __BB_ROWS__?: UploadedRow[];
    __BB_INSIGHTS__?: HeatmapInsight[];
  }
}

// ---------- Helpers ----------
function useMetrics() {
  return window.__BB_METRICS__ || mockMetrics;
}
function useRows(): UploadedRow[] {
  return Array.isArray(window.__BB_ROWS__) ? window.__BB_ROWS__! : [];
}

// Fallback insight generator so the page renders before Upload
function fallbackBuildInsightsFromRows(rows: UploadedRow[]): HeatmapInsight[] {
  if (Array.isArray(window.__BB_INSIGHTS__) && window.__BB_INSIGHTS__!.length) {
    return window.__BB_INSIGHTS__!;
  }
  const sampleTitles = [
    "Bundling Gap",
    "Umbrella Opportunity",
    "Renewal No Review Window",
    "High RL Segment",
  ];
  const sampleCategories: InsightCategory[] = [
    "Growth Opportunities",
    "Growth Opportunities",
    "Retention Radar",
    "Service Drain",
  ];
  const sampleSev: HeatmapInsight["severity"][] = [
    "opportunity",
    "opportunity",
    "urgent",
    "warn",
  ];
  const items: HeatmapInsight[] = [];
  const N = Math.max(rows.length || 48, 12);
  for (let i = 0; i < Math.min(N, 96); i++) {
    const d = new Date();
    d.setDate(1); // align to month
    d.setMonth(d.getMonth() + (i % 12));
    items.push({
      id: ((i % 4) + 1) as number,
      title: sampleTitles[i % sampleTitles.length],
      household_id: rows[i]?.household_id || `HH-${i + 1}`,
      detection_date: d.toISOString(),
      category: sampleCategories[i % sampleCategories.length],
      severity: sampleSev[i % sampleSev.length],
    });
  }
  return items;
}

const severityRank: Record<HeatmapInsight["severity"], number> = {
  urgent: 3,
  warn: 2,
  opportunity: 1,
  good: 0,
};

// Sort: most urgent first, then nearest upcoming date
function sortByUrgencyThenDate(a: HeatmapInsight, b: HeatmapInsight) {
  const r = severityRank[b.severity] - severityRank[a.severity];
  if (r !== 0) return r;
  const ad = a.detection_date ? Date.parse(a.detection_date) : Number.POSITIVE_INFINITY;
  const bd = b.detection_date ? Date.parse(b.detection_date) : Number.POSITIVE_INFINITY;
  return ad - bd;
}

// ---------- Page ----------
export default function Principal() {
  const m = useMetrics();
  const rows = useRows();
  const insights = fallbackBuildInsightsFromRows(rows);

  // Calendar modal state
  const [open, setOpen] = React.useState(false);
  const [selectedBin, setSelectedBin] = React.useState<any>(null);

  // Build Top-10 lists
  const top10Growth = insights
    .filter((i) => i.category === "Growth Opportunities")
    .sort(sortByUrgencyThenDate)
    .slice(0, 10);

  const top10Retention = insights
    .filter((i) => i.category === "Retention Radar")
    .sort(sortByUrgencyThenDate)
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

      {/* Upcoming Insights Calendar */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Upcoming Insights (12-month view)</h2>
          <div className="flex gap-2 text-xs">
            <span className="badge border-white/20">Monthly</span>
          </div>
        </div>

        <InsightsHeatmap
          data={insights}
          months={12}
          defaultCategories={[]}
          onMonthClick={(bin) => {
            setSelectedBin(bin);
            setOpen(true);
          }}
        />
      </div>

      {/* Month click modal */}
      {open && (
        <>
          <div className="drawer-overlay" onClick={() => setOpen(false)} />
          <div className="card fixed left-1/2 top-20 z-50 w-[90vw] max-w-2xl -translate-x-1/2 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{selectedBin?.label || "Selected Period"}</h3>
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
                      HH: {it.household_id || "—"} • Category: {it.category} • Severity:{" "}
                      {it.severity}
                    </div>
                  </div>
                  <a
                    className="badge border-white/20"
                    href={`/household/${encodeURIComponent(String(it.household_id || ""))}?id=${
                      it.id
                    }`}
                  >
                    View
                  </a>
                </div>
              ))}
              {(!selectedBin?.items || selectedBin.items.length === 0) && (
                <div className="text-sm text-slate-400">No insights in this period.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Top 10 Growth Opportunities */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Top 10 Growth Opportunities</h2>
          <a className="badge border-white/20" href="/insights?cat=Growth%20Opportunities">
            View all
          </a>
        </div>
        <ul className="space-y-2">
          {top10Growth.map((i, idx) => (
            <li
              key={`growth-${idx}`}
              className="flex items-center justify-between rounded bg-white/5 p-2"
            >
              <div className="text-sm">
                <div className="font-medium">{i.title}</div>
                <div className="text-xs text-slate-400">
                  HH: {i.household_id || "—"} • Severity: {i.severity}
                  {i.detection_date ? ` • Due: ${new Date(i.detection_date).toLocaleDateString()}` : ""}
                </div>
              </div>
              <a
                className="badge border-white/20"
                href={`/household/${encodeURIComponent(String(i.household_id || ""))}?id=${i.id}`}
              >
                Open
              </a>
            </li>
          ))}
          {top10Growth.length === 0 && (
            <li className="text-sm text-slate-400">No growth opportunities found.</li>
          )}
        </ul>
      </div>

      {/* Top 10 Retention Radar */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Top 10 Retention Radar</h2>
          <a className="badge border-white/20" href="/insights?cat=Retention%20Radar">
            View all
          </a>
        </div>
        <ul className="space-y-2">
          {top10Retention.map((i, idx) => (
            <li
              key={`ret-${idx}`}
              className="flex items-center justify-between rounded bg-white/5 p-2"
            >
              <div className="text-sm">
                <div className="font-medium">{i.title}</div>
                <div className="text-xs text-slate-400">
                  HH: {i.household_id || "—"} • Severity: {i.severity}
                  {i.detection_date ? ` • Due: ${new Date(i.detection_date).toLocaleDateString()}` : ""}
                </div>
              </div>
              <a
                className="badge border-white/20"
                href={`/household/${encodeURIComponent(String(i.household_id || ""))}?id=${i.id}`}
              >
                Open
              </a>
            </li>
          ))}
          {top10Retention.length === 0 && (
            <li className="text-sm text-slate-400">No retention items found.</li>
          )}
        </ul>
      </div>

      {/* (Optional) Suggested Insight Cards row you already had */}
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
