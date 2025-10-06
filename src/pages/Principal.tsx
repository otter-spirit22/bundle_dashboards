import Kpi from "../components/Kpi";
import Gauge from "../components/Gauge";
import Bullet from "../components/Bullet";
import Spark from "../components/Spark";
import InsightCard from "../components/InsightCard";
import InsightsHeatmap from "../components/InsightsHeatmap";

import { mockMetrics, mockInsights } from "../data/mock";
import { bands } from "../config/benchmarks";

// If you already have a proper loader + builder, replace these two shims:
type UploadedRow = any;
declare global {
  interface Window {
    __BB_METRICS__?: any;
    __BB_ROWS__?: UploadedRow[];
    __BB_INSIGHTS__?: any[]; // optional precomputed insights
  }
}

function useMetrics() {
  const anyWin = (window as any).__BB_METRICS__;
  return anyWin || mockMetrics;
}

// OPTIONAL: if you have a real hook, e.g. useUploadedRows(), import and use that instead
function useUploadedRows(): UploadedRow[] {
  return (window as any).__BB_ROWS__ || [];
}

// Minimal “builder” shim to convert your rows OR mock to heatmap-friendly items.
// Replace with your real compute (1..50 insights) when ready.
import { InsightCategory } from "../data/insightCategories";
type HeatmapInsight = {
  id: number;                // 1..50
  title: string;
  household_id?: string;
  detection_date?: string;   // ISO date (use renewal_date or today)
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
};

function fallbackBuildInsightsFromRows(rows: UploadedRow[]): HeatmapInsight[] {
  // 1) Use any precomputed insights if provided
  const pre = (window as any).__BB_INSIGHTS__ as HeatmapInsight[] | undefined;
  if (pre && Array.isArray(pre) && pre.length) return pre;

  // 2) Otherwise synthesize a tiny demo set from rows or from mockInsights
  const todayISO = new Date().toISOString();
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

  const base: HeatmapInsight[] = [];
  const N = Math.max(rows.length || 50, 12);
  for (let i = 0; i < Math.min(N, 80); i++) {
    // Evenly distribute into next 12 months
    const d = new Date();
    d.setMonth(d.getMonth() + (i % 12));
    base.push({
      id: ((i % 4) + 1) as number,
      title: sampleTitles[i % sampleTitles.length],
      household_id: rows[i]?.household_id || `HH-${i + 1}`,
      detection_date: d.toISOString(),
      category: sampleCategories[i % sampleCategories.length],
      severity: sampleSev[i % sampleSev.length],
    });
  }
  return base;
}

export default function Principal() {
  const m = useMetrics();
  const rows = useUploadedRows();
  const heatmapInsights: HeatmapInsight[] = fallbackBuildInsightsFromRows(rows);

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

      {/* NEW: Upcoming Insights Heatmap */}
      <InsightsHeatmap
        data={heatmapInsights}
        months={12}
        defaultCategories={[]}
        onMonthClick={(bin) => {
          // hook this to your detail modal/drawer:
          // e.g., open a right-side drawer showing bin.items by category
          console.log("Clicked month bin:", bin);
          // TODO: setOpenMonth(bin)
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
