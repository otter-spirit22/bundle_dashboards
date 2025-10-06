import React from "react";
import Kpi from "../components/Kpi";
import Gauge from "../components/Gauge";
import Bullet from "../components/Bullet";
import Spark from "../components/Spark";
import InsightCard from "../components/InsightCard";

import { mockMetrics, mockInsights } from "../data/mock";
import { bands } from "../config/benchmarks";

type UploadedRow = Record<string, any>;
export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type HeatmapInsight = {
  id: number;
  title: string;
  household_id?: string;
  detection_date?: string;
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
};

// Data hooks (same logic as before)
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
function useInsights(): HeatmapInsight[] {
  if (Array.isArray(window.__BB_INSIGHTS__) && window.__BB_INSIGHTS__!.length) {
    return window.__BB_INSIGHTS__!;
  }
  const rows = useUploadedRows();
  const N = Math.max(rows.length || 60, 24);
  const titles = ["Bundling Gap", "Umbrella Opportunity", "Rate Shock Sensitivity", "Renewal No Review Window"];
  const cats: InsightCategory[] = ["Growth Opportunities", "Growth Opportunities", "Retention Radar", "Service Drain"];
  const sev: HeatmapInsight["severity"][] = ["opportunity", "opportunity", "warn", "urgent"];
  const out: HeatmapInsight[] = [];
  for (let i = 0; i < N; i++) {
    const d = new Date();
    d.setDate(d.getDate() + (i % 120));
    out.push({
      id: ((i % 50) + 1) as number,
      title: titles[i % titles.length],
      household_id: rows[i]?.household_id || `HH${String(i + 1).padStart(4, "0")}`,
      detection_date: d.toISOString(),
      category: cats[i % cats.length],
      severity: sev[i % sev.length],
    });
  }
  return out;
}

// Helpers
const SEV_ORDER: HeatmapInsight["severity"][] = ["good", "opportunity", "warn", "urgent"];
const sevRank = (s: HeatmapInsight["severity"]) => SEV_ORDER.indexOf(s);
const within = (start: Date, end: Date, iso?: string) =>
  iso ? new Date(iso) >= start && new Date(iso) < end : false;

function formatWindowLabel(start: Date, end: Date, prefix?: string) {
  const s = start.toLocaleDateString();
  const e = end.toLocaleDateString();
  return `${prefix ? prefix + " " : ""}${s} → ${e}`;
}

function countBySeverity(items: HeatmapInsight[]) {
  return items.reduce((acc, it) => {
    acc[it.severity] = (acc[it.severity] || 0) + 1;
    return acc;
  }, {} as Record<HeatmapInsight["severity"], number>);
}

const getSeverityColor = (sev: HeatmapInsight["severity"]) => {
  switch (sev) {
    case "urgent":
      return "bg-red-500";
    case "warn":
      return "bg-orange-400";
    case "opportunity":
      return "bg-yellow-400";
    case "good":
      return "bg-green-500";
    default:
      return "bg-gray-200";
  }
};

// --- Modular Components ---

interface InsightWindowProps {
  title: string;
  dateLabel: string;
  insights: HeatmapInsight[];
  counts: Record<string, number>;
  maxVisible?: number; // how many before scroll
}
function InsightWindow({
  title,
  dateLabel,
  insights,
  counts,
  maxVisible = 5,
}: InsightWindowProps) {
  const total = insights.length;
  const visible = insights.slice(0, maxVisible);

  return (
    <div className="rounded-lg bg-white/5 p-4 flex flex-col">
      <div className="mb-2 flex justify-between items-start">
        <div>
          <div className="text-xs opacity-70">{title}</div>
          <div className="font-semibold">{dateLabel}</div>
        </div>
        <div className="text-3xl font-extrabold tabular-nums">{total}</div>
      </div>

      <div className="flex-1 overflow-auto space-y-2 mb-3">
        {visible.map((it, idx) => (
          <a
            key={idx}
            href={`/household?hh=${encodeURIComponent(it.household_id || "")}&id=${it.id}`}
            className="block rounded bg-white/5 p-2 hover:bg-white/10"
          >
            <div className="text-sm font-medium">#{it.id} {it.title}</div>
            <div className="text-xs opacity-70">
              HH: {it.household_id || "—"} • {it.category} • {it.severity}
            </div>
          </a>
        ))}
        {total > maxVisible && (
          <div className="text-center text-xs text-slate-400">+ {total - maxVisible} more…</div>
        )}
        {total === 0 && <div className="text-sm text-slate-400">No insights in this window.</div>}
      </div>

      {/* Visual severity bar */}
      <div className="h-2 rounded overflow-hidden flex">
        {(["urgent", "warn", "opportunity", "good"] as HeatmapInsight["severity"][]).map((sev) => {
          const c = counts[sev] || 0;
          const pct = total > 0 ? (c / total) * 100 : 0;
          return (
            <div
              key={sev}
              className={`${getSeverityColor(sev)}`}
              style={{ width: `${pct}%` }}
              title={`${sev}: ${c}`}
            />
          );
        })}
      </div>
      {/* count badges */}
      <div className="mt-2 flex gap-2 text-[11px]">
        <span className="badge border-white/20">urgent {counts.urgent || 0}</span>
        <span className="badge border-white/20">warn {counts.warn || 0}</span>
        <span className="badge border-white/20">opp {counts.opportunity || 0}</span>
        <span className="badge border-white/20">good {counts.good || 0}</span>
      </div>
    </div>
  );
}

interface TopItemProps {
  insight: HeatmapInsight;
  maxSeverityCount: number;
}
function TopItem({ insight, maxSeverityCount }: TopItemProps) {
  // we can show a mini horizontal bar proportional to severity rank or something
  // e.g. measure severity weight vs max in list
  const severityScore = SEV_ORDER.indexOf(insight.severity);
  const pct = maxSeverityCount > 0 ? (severityScore / (SEV_ORDER.length - 1)) * 100 : 0;

  return (
    <a
      href={`/household?hh=${encodeURIComponent(insight.household_id || "")}&id=${insight.id}`}
      className="block rounded bg-white/5 p-2 hover:bg-white/10 flex items-center space-x-2"
    >
      <div className="flex-1">
        <div className="text-sm font-medium">#{insight.id} {insight.title}</div>
        <div className="text-xs opacity-70">
          {insight.severity} •{" "}
          {insight.detection_date
            ? new Date(insight.detection_date).toLocaleDateString()
            : "—"}
        </div>
      </div>
      {/* mini severity indicator bar */}
      <div className="h-2 w-20 bg-white/10 rounded overflow-hidden">
        <div
          className={getSeverityColor(insight.severity)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </a>
  );
}

interface TopListProps {
  title: string;
  items: HeatmapInsight[];
}
function TopList({ title, items }: TopListProps) {
  // Determine a “max severity count” for scaling visuals
  // Could use count of urgent items or just number of possible severity levels
  const maxSeverityCount = SEV_ORDER.length - 1;

  return (
    <div className="rounded-lg bg-white/5 p-4 flex flex-col">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <div className="overflow-auto space-y-2 flex-1">
        {items.length === 0 ? (
          <div className="text-sm text-slate-400">No upcoming items.</div>
        ) : (
          items.map((it, idx) => <TopItem key={idx} insight={it} maxSeverityCount={maxSeverityCount} />)
        )}
      </div>
    </div>
  );
}

// Main Page
export default function Principal() {
  const m = useMetrics();
  const allInsights = useInsights();

  // Toggle between 30-day or 60-day windows
  const [range, setRange] = React.useState<30 | 60>(30);
  const [cats, setCats] = React.useState<InsightCategory[]>([]);

  const today = React.useMemo(() => new Date(), []);
  const start1 = React.useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    [today]
  );
  const end1 = React.useMemo(() => new Date(start1.getTime() + range * 86400000), [start1, range]);
  const start2 = end1;
  const end2 = React.useMemo(() => new Date(start2.getTime() + range * 86400000), [start2, range]);

  const catsOn = cats.length > 0;
  const categoryPass = (it: HeatmapInsight) => (catsOn ? cats.includes(it.category) : true);

  const sortFn = (a: HeatmapInsight, b: HeatmapInsight) => {
    const sv = sevRank(b.severity) - sevRank(a.severity);
    if (sv !== 0) return sv;
    const ad = a.detection_date ? new Date(a.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
    const bd = b.detection_date ? new Date(b.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
    return ad - bd;
  };

  const bin1 = allInsights
    .filter((it) => within(start1, end1, it.detection_date) && categoryPass(it))
    .sort(sortFn);
  const bin2 = allInsights
    .filter((it) => within(start2, end2, it.detection_date) && categoryPass(it))
    .sort(sortFn);

  const bin1Counts = countBySeverity(bin1);
  const bin2Counts = countBySeverity(bin2);

  const upcomingPool = React.useMemo(() => [...bin1, ...bin2], [bin1, bin2]);
  const top10 = (cat: InsightCategory) =>
    upcomingPool
      .filter((i) => i.category === cat)
      .sort(sortFn)
      .slice(0, 10);

  const top10Growth = top10("Growth Opportunities");
  const top10Retention = top10("Retention Radar");

  // List of category options for filter popover
  const allCats: InsightCategory[] = [
    "Growth Opportunities",
    "Retention Radar",
    "Service Drain",
    "Risk & Compliance",
  ];

  // Toggle helper
  const toggleRange = () => {
    setRange((r) => (r === 30 ? 60 : 30));
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <h1 className="text-2xl font-extrabold text-indigo-300">Principal Dashboard</h1>

      {/* Core Metrics + Enhanced Visualization */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white/90">Key Metrics</h2>

        {/* option: put small sparklines or trend indicators under or next to each KPI */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Gauge value={m.benchScore} max={100} label="BenchScore™" />
            {/* Example: small sparkline below gauge */}
            <div className="absolute bottom-2 left-0 right-0 px-2">
              <Spark
                label=""
                points={[m.benchScore - 5, m.benchScore - 3, m.benchScore, m.benchScore + 2]}
              />
            </div>
          </div>
          <div className="relative">
            <Kpi
              label="Time-Back Number™"
              value={`${Math.round(m.timeBackHoursMoTopN)} hrs/mo`}
              metric="benchScore"
              numeric={m.benchScore}
              tooltip="Monthly hours reclaimable from Top‑N split accounts"
            />
            <div className="mt-1">
              <Spark
                label=""
                points={[m.timeBackHoursMoTopN - 2, m.timeBackHoursMoTopN - 1, m.timeBackHoursMoTopN]}
              />
            </div>
          </div>
          <div className="relative">
            <Kpi
              label="Coverage Depth"
              value={`${m.coverageDepthPct.toFixed(0)}%`}
              metric="coverageDepth"
              numeric={m.coverageDepthPct / 100}
            />
            <div className="mt-1">
              <Spark
                label=""
                points={[m.coverageDepthPct - 2, m.coverageDepthPct, m.coverageDepthPct + 1]}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Kpi
              label="Remarketing Load"
              value={`${m.remarketingLoadPer100.toFixed(1)} / 100`}
              metric="remarketingLoad"
              numeric={m.remarketingLoadPer100}
            />
            {/* optionally spark */}
          </div>
          <div className="relative">
            <Bullet
              label="Service Touch Index"
              value={m.serviceTouchIndexMinPerHHYr}
              target={bands.serviceTouchIndex.healthy}
              goodIsLow
            />
          </div>
          <div>
            <Spark label="Tenure Momentum (sim)" points={[6.4, 6.5, 6.6, 6.7, 6.8]} />
          </div>
        </div>
      </section>

      {/* Upcoming Windows + Filters */}
      <section className="card p-4 space-y-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white/90">Upcoming Windows</h2>
          <div className="flex items-center space-x-3">
            <button onClick={toggleRange} className="badge border-white/20 bg-white/10">
              {range === 30 ? "30d" : "60d"}
            </button>
            {/* Popover-style category filter toggler */}
            <div className="relative">
              <button className="badge border-white/20">Categories ▾</button>
              <div className="absolute right-0 mt-1 w-48 bg-white/5 rounded shadow-lg z-10 p-2">
                {allCats.map((c) => {
                  const on = cats.includes(c);
                  return (
                    <label key={c} className="block text-sm">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => {
                          setCats((prev) =>
                            on ? prev.filter((x) => x !== c) : [...prev, c]
                          );
                        }}
                        className="mr-2"
                      />
                      {c}
                    </label>
                  );
                })}
                <button
                  onClick={() => setCats([])}
                  className="mt-2 text-xs underline text-slate-200"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InsightWindow
            title={`Next ${range} days`}
            dateLabel={formatWindowLabel(start1, end1)}
            insights={bin1}
            counts={bin1Counts}
            maxVisible={5}
          />
          <InsightWindow
            title={`Days ${range + 1}–${range * 2}`}
            dateLabel={formatWindowLabel(start2, end2)}
            insights={bin2}
            counts={bin2Counts}
            maxVisible={5}
          />
        </div>
      </section>

      {/* Top 10 with visuals */}
      <section className="card p-4 space-y-4 border-t border-white/10">
        <h2 className="text-lg font-bold text-white/90">Top 10 (Upcoming)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TopList title="Top 10 Growth Opportunities" items={top10Growth} />
          <TopList title="Top 10 Retention Radar" items={top10Retention} />
        </div>
      </section>

      {/* Suggested Insight Cards */}
      <section>
        <h2 className="text-lg font-bold text-white/90">Suggested Insights</h2>
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
      </section>
    </div>
  );
}
