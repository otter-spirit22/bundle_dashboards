import React from "react";

import Kpi from "../components/Kpi";
import Gauge from "../components/Gauge";
import Bullet from "../components/Bullet";
import Spark from "../components/Spark";
import InsightCard from "../components/InsightCard";
import InsightsHeatmapCompact, {
  HeatmapInsight,
  InsightCategory,
  CalendarBin,
} from "../components/InsightsHeatmapCompact";

import { mockMetrics, mockInsights } from "../data/mock";
import { bands } from "../config/benchmarks";

// ---------- Types ----------
type UploadedRow = Record<string, any>;

// ---------- Demo fallback data ----------
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
  // Fallback generator to keep the page working with no upload
  const rows = useUploadedRows();
  const N = Math.max(rows.length || 60, 24);
  const titles = ["Bundling Gap", "Umbrella Opportunity", "Rate Shock Sensitivity", "Renewal No Review Window"];
  const cats: InsightCategory[] = ["Growth Opportunities", "Growth Opportunities", "Retention Radar", "Service Drain"];
  const sev: HeatmapInsight["severity"][] = ["opportunity", "opportunity", "warn", "urgent"];

  const out: HeatmapInsight[] = [];
  for (let i = 0; i < N; i++) {
    const d = new Date();
    // scatter next 120 days
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

// ---------- Helpers ----------
const SEV_ORDER: HeatmapInsight["severity"][] = ["good", "opportunity", "warn", "urgent"];
const sevRank = (s: HeatmapInsight["severity"]) => SEV_ORDER.indexOf(s); // higher = more severe

function within(start: Date, end: Date, iso?: string) {
  if (!iso) return false;
  const d = new Date(iso);
  return d >= start && d < end;
}

// ---------- Page ----------
export default function Principal() {
  const m = useMetrics();
  const allInsights = useInsights();

  // UI state
  const [range, setRange] = React.useState<15 | 30 | 60 | 90>(15);
  const [cats, setCats] = React.useState<InsightCategory[]>([]); // empty = all
  const [open, setOpen] = React.useState(false);
  const [bin, setBin] = React.useState<CalendarBin | null>(null);

  // Build the same two bins the compact calendar uses, so lists match it exactly
  const now = React.useMemo(() => new Date(), []);
  const start1 = React.useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), [now]);
  const end1 = React.useMemo(() => new Date(start1.getTime() + range * 24 * 60 * 60 * 1000), [start1, range]);
  const start2 = end1;
  const end2 = React.useMemo(() => new Date(start2.getTime() + range * 24 * 60 * 60 * 1000), [start2, range]);

  const catsOn = cats.length > 0;
  const byCats = (it: HeatmapInsight) => (catsOn ? cats.includes(it.category) : true);

  const bin1Items = allInsights.filter(
    (it) => within(start1, end1, it.detection_date) && byCats(it)
  );
  const bin2Items = allInsights.filter(
    (it) => within(start2, end2, it.detection_date) && byCats(it)
  );

  const upcomingPool = React.useMemo(
    () => [...bin1Items, ...bin2Items],
    [bin1Items, bin2Items]
  );

  // Top 10 lists built from the SAME upcoming pool
  function top10ByCategory(cat: InsightCategory): HeatmapInsight[] {
    return upcomingPool
      .filter((i) => i.category === cat)
      .sort((a, b) => {
        // more severe first
        const sv = sevRank(b.severity) - sevRank(a.severity);
        if (sv !== 0) return sv;
        // then sooner date first
        const ad = a.detection_date ? new Date(a.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bd = b.detection_date ? new Date(b.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      })
      .slice(0, 10);
  }

  const top10Growth = top10ByCategory("Growth Opportunities");
  const top10Retention = top10ByCategory("Retention Radar");

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

      {/* Ops row */}
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

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="opacity-70 mr-2">Range:</span>
        {[15, 30, 60, 90].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r as 15 | 30 | 60 | 90)}
            className={`badge border-white/20 ${range === r ? "bg-white/20" : ""}`}
          >
            {r}d
          </button>
        ))}
        <span className="opacity-70 mx-3">Categories:</span>
        {(
          ["Growth Opportunities", "Retention Radar", "Service Drain", "Risk & Compliance"] as InsightCategory[]
        ).map((c) => {
          const on = cats.includes(c);
          return (
            <button
              key={c}
              onClick={() =>
                setCats((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))
              }
              className={`badge border-white/20 ${on ? "bg-white/20" : ""}`}
            >
              {c}
            </button>
          );
        })}
        <button className="badge border-white/20" onClick={() => setCats([])}>
          Clear
        </button>
      </div>

      {/* Upcoming (Compact 2-tile calendar) */}
      <InsightsHeatmapCompact
        data={allInsights}
        rangeDays={range}
        categories={cats}
        onTileClick={(clickedBin) => {
          setBin(clickedBin);
          setOpen(true);
        }}
      />

      {/* Clicked window modal */}
      {open && bin && (
        <>
          <div className="drawer-overlay" onClick={() => setOpen(false)} />
          <div className="card fixed left-1/2 top-20 z-50 w-[90vw] max-w-2xl -translate-x-1/2 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{bin.label}</h3>
              <button className="badge border-white/20" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto space-y-2">
              {bin.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between rounded bg-white/5 p-2">
                  <div className="text-sm">
                    <div className="font-medium">
                      #{it.id} {it.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      HH: {it.household_id || "—"} • {it.category} • {it.severity}
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
              {bin.items.length === 0 && (
                <div className="text-sm text-slate-400">No insights in this window.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Top 10 sections – built from SAME upcoming pool so they match the calendar */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Top 10 Growth (Upcoming)</h2>
          {top10Growth.length === 0 ? (
            <div className="text-sm text-slate-400">No upcoming growth items.</div>
          ) : (
            <ul className="space-y-2">
              {top10Growth.map((it, idx) => (
                <li
                  key={`g-${idx}`}
                  className="flex items-center justify-between rounded bg-white/5 p-2"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      #{it.id} {it.title}
                    </div>
                    <div className="text-xs opacity-70">
                      HH: {it.household_id || "—"} • {it.severity} •{" "}
                      {it.detection_date
                        ? new Date(it.detection_date).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                  <a
                    className="badge border-white/20"
                    href={`/household?hh=${encodeURIComponent(it.household_id || "")}&id=${it.id}`}
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Top 10 Retention Radar (Upcoming)</h2>
          {top10Retention.length === 0 ? (
            <div className="text-sm text-slate-400">No upcoming retention items.</div>
          ) : (
            <ul className="space-y-2">
              {top10Retention.map((it, idx) => (
                <li
                  key={`r-${idx}`}
                  className="flex items-center justify-between rounded bg-white/5 p-2"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      #{it.id} {it.title}
                    </div>
                    <div className="text-xs opacity-70">
                      HH: {it.household_id || "—"} • {it.severity} •{" "}
                      {it.detection_date
                        ? new Date(it.detection_date).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                  <a
                    className="badge border-white/20"
                    href={`/household?hh=${encodeURIComponent(it.household_id || "")}&id=${it.id}`}
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Suggested cards (unchanged demo) */}
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
