import React from "react";
import Kpi from "../components/Kpi";
import Gauge from "../components/Gauge";
import Bullet from "../components/Bullet";
import Spark from "../components/Spark";
import InsightCard from "../components/InsightCard";

// compact two-card calendar
import InsightsHeatmapCompact, {
  HeatmapInsight,
  InsightCategory,
} from "../components/InsightsHeatmapCompact";

import { mockMetrics, mockInsights } from "../data/mock";
import { bands } from "../config/benchmarks";

// ---- minimal shims for uploaded data ----
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
function useUploadedRows(): UploadedRow[] {
  return window.__BB_ROWS__ || [];
}

// If no insights are precomputed, synthesize a few so the calendar renders
function useHeatmapInsights(rows: UploadedRow[]): HeatmapInsight[] {
  if (Array.isArray(window.__BB_INSIGHTS__) && window.__BB_INSIGHTS__!.length) {
    return window.__BB_INSIGHTS__!;
  }
  const cats: InsightCategory[] = [
    "Growth Opportunities",
    "Retention Radar",
    "Service Drain",
    "Risk & Compliance",
  ];
  const sevs: HeatmapInsight["severity"][] = ["urgent", "warn", "opportunity", "good"];

  const out: HeatmapInsight[] = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() + (i % 90));
    out.push({
      id: ((i % 12) + 1) as number,
      title: ["Bundling Gap", "Umbrella Opportunity", "No Review Window", "High RL"][i % 4],
      household_id: rows[i]?.household_id || `HH-${i + 1}`,
      detection_date: d.toISOString(),
      category: cats[i % cats.length],
      severity: sevs[i % sevs.length],
    });
  }
  return out;
}

// ---- PAGE ----
export default function Principal() {
  const m = useMetrics();
  const rows = useUploadedRows();
  const insights = useHeatmapInsights(rows);

  const [winDays, setWinDays] = React.useState<15 | 30 | 60 | 90>(30);
  const [catFilter, setCatFilter] = React.useState<InsightCategory[]>([]);

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

      {/* Compact calendar (two cards). Toggle 15/30/60/90; show category filters for 60/90 */}
      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Upcoming Insights (Compact)</h2>
          <div className="flex items-center gap-2">
            {([15, 30, 60, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setWinDays(d)}
                className={`badge border-white/20 ${winDays === d ? "bg-white/10" : ""}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {(winDays === 60 || winDays === 90) && (
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
            {(
              [
                "Growth Opportunities",
                "Retention Radar",
                "Service Drain",
                "Risk & Compliance",
              ] as const
            ).map((c) => {
              const active = catFilter.includes(c);
              return (
                <label key={c} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) =>
                      setCatFilter((prev) =>
                        e.target.checked ? [...prev, c] : prev.filter((x) => x !== c)
                      )
                    }
                  />
                  <span className="rounded bg-white/5 px-2 py-1">{c}</span>
                </label>
              );
            })}
            <button className="badge border-white/20" onClick={() => setCatFilter([])}>
              Clear
            </button>
          </div>
        )}

        <InsightsHeatmapCompact
          data={insights}
          windowDays={winDays}
          twoCardsOnly
          categories={catFilter.length ? catFilter : undefined}
          onWindowClick={(bin) => {
            // wire to a modal/drawer if you like
            console.log("Window clicked:", bin);
          }}
        />
      </div>

      {/* Suggested Actions / Top Insights */}
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
