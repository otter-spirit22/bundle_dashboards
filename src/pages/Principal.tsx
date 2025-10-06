import Kpi from "../components/Kpi";
import Gauge from "../components/Gauge";
import Bullet from "../components/Bullet";
import Spark from "../components/Spark";
import InsightCard from "../components/InsightCard";
import InsightsHeatmap from "../components/InsightsHeatmap";

import { mockMetrics, mockInsights } from "../data/mock";
import { bands } from "../config/benchmarks";

// ---- Types & window shims ----
type UploadedRow = Record<string, any>;

declare global {
  interface Window {
    __BB_METRICS__?: any;
    __BB_ROWS__?: UploadedRow[];
    __BB_INSIGHTS__?: HeatmapInsight[];
  }
}

type InsightCategory = "Growth Opportunities" | "Retention Radar" | "Service Drain" | "Risk & Compliance";

type HeatmapInsight = {
  id: number;                // 1..50
  title: string;
  household_id?: string;
  detection_date?: string;   // ISO date
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
};

// ---- Data hooks ----
function useMetrics() {
  return window.__BB_METRICS__ || mockMetrics;
}

function useUploadedRows(): UploadedRow[] {
  return window.__BB_ROWS__ || [];
}

// ---- Lightweight fallback builder for heatmap demo ----
function fallbackBuildInsightsFromRows(rows: UploadedRow[]): HeatmapInsight[] {
  // Prefer precomputed insights if present
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
  const N = Math.max(rows.length || 50, 12);

  for (let i = 0; i < Math.min(N, 80); i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + (i % 12)); // spread across 12 months
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

// ---- Page ----
export default function Principal() {
  const m = useMetrics();
  const rows = useUploadedRows();
  const heatmapData = fallbackBuildInsightsFromRows(rows);

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

      {/* Upcoming Insights Heatmap */}
      <InsightsHeatmap
        data={heatmapData}
        months={12}
        defaultCategories={[]}
        onMonthClick={(bin) => {
          // Wire this to open a modal/drawer listing bin.items
          console.log("Heatmap month clicked:", bin);
        }}
      />

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
