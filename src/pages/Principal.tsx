import React from "react";

import Kpi from "../components/Kpi";
import Gauge from "../components/Gauge";
import Bullet from "../components/Bullet";
import Spark from "../components/Spark";
import InsightCard from "../components/InsightCard";

import { mockMetrics, mockInsights } from "../data/mock";
import { bands } from "../config/benchmarks";

// ---------- Types ----------
type UploadedRow = Record<string, any>;
export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type HeatmapInsight = {
  id: number; // 1..50
  title: string;
  household_id?: string;
  detection_date?: string; // ISO date
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
};

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
  // Fallback generator so the page works before data is uploaded
  const rows = useUploadedRows();
  const N = Math.max(rows.length || 60, 24);
  const titles = ["Bundling Gap", "Umbrella Opportunity", "Rate Shock Sensitivity", "Renewal No Review Window"];
  const cats: InsightCategory[] = ["Growth Opportunities", "Growth Opportunities", "Retention Radar", "Service Drain"];
  const sev: HeatmapInsight["severity"][] = ["opportunity", "opportunity", "warn", "urgent"];

  const out: HeatmapInsight[] = [];
  for (let i = 0; i < N; i++) {
    const d = new Date();
    d.setDate(d.getDate() + (i % 120)); // scatter over next ~4 months
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
const sevRank = (s: HeatmapInsight["severity"]) => SEV_ORDER.indexOf(s);
const within = (start: Date, end: Date, iso?: string) => (iso ? new Date(iso) >= start && new Date(iso) < end : false);

function formatWindowLabel(start: Date, end: Date, prefix?: string) {
  const s = start.toLocaleDateString();
  const e = end.toLocaleDateString();
  return `${prefix ? prefix + " " : ""}${s} → ${e}`;
}

function countBySeverity(items: HeatmapInsight[]) {
  return items.reduce(
    (acc, it) => {
      acc[it.severity] = (acc[it.severity] || 0) + 1;
      return acc;
    },
    {} as Record<HeatmapInsight["severity"], number>
  );
}

// ---------- Page ----------
export default function Principal() {
  const m = useMetrics();
  const allInsights = useInsights();

  // Filters above "Upcoming" section
  const [range, setRange] = React.useState<15 | 30 | 60 | 90>(30);
  const [cats, setCats] = React.useState<InsightCategory[]>([]); // empty = all cats

  // Build the two windows based on range
  const today = React.useMemo(() => new Date(), []);
  const start1 = React.useMemo(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()), [today]);
  const end1 = React.useMemo(() => new Date(start1.getTime() + range * 24 * 60 * 60 * 1000), [start1, range]);
  const start2 = end1;
  const end2 = React.useMemo(() => new Date(start2.getTime() + range * 24 * 60 * 60 * 1000), [start2, range]);

  const catsOn = cats.length > 0;
  const categoryPass = (it: HeatmapInsight) => (catsOn ? cats.includes(it.category) : true);

  const bin1 = allInsights
    .filter((it) => within(start1, end1, it.detection_date) && categoryPass(it))
    .sort((a, b) => {
      const sv = sevRank(b.severity) - sevRank(a.severity);
      if (sv !== 0) return sv;
      const ad = a.detection_date ? new Date(a.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.detection_date ? new Date(b.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });

  const bin2 = allInsights
    .filter((it) => within(start2, end2, it.detection_date) && categoryPass(it))
    .sort((a, b) => {
      const sv = sevRank(b.severity) - sevRank(a.severity);
      if (sv !== 0) return sv;
      const ad = a.detection_date ? new Date(a.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.detection_date ? new Date(b.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });

  const bin1Counts = countBySeverity(bin1);
  const bin2Counts = countBySeverity(bin2);

  // Top 10 sections use the same upcoming pool (bin1 + bin2) so they always align
  const upcomingPool = React.useMemo(() => [...bin1, ...bin2], [bin1, bin2]);
  const top10 = (cat: InsightCategory) =>
    upcomingPool
      .filter((i) => i.category === cat)
      .sort((a, b) => {
        const sv = sevRank(b.severity) - sevRank(a.severity);
        if (sv !== 0) return sv;
        const ad = a.detection_date ? new Date(a.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bd = b.detection_date ? new Date(b.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      })
      .slice(0, 10);

  const top10Growth = top10("Growth Opportunities");
  const top10Retention = top10("Retention Radar");

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
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

      {/* ============================ */}
      {/*    UPCOMING WINDOWS SECTION  */}
      {/* ============================ */}
      <section className="card p-4 space-y-3">
        {/* Filters for this section */}
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

        {/* Two wrapped cards side-by-side */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Window 1 */}
          <div className="rounded-lg bg-white/5 p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-xs opacity-70">Next {range} days</div>
                <div className="font-semibold">
                  {formatWindowLabel(start1, end1)}
                </div>
              </div>
              <div className="text-3xl font-extrabold tabular-nums">{bin1.length}</div>
            </div>

            {/* Scrollable household list */}
            <div className="max-h-72 overflow-auto space-y-2">
              {bin1.map((it, idx) => (
                <a
                  key={`w1-${idx}`}
                  href={`/household?hh=${encodeURIComponent(it.household_id || "")}&id=${it.id}`}
                  className="block rounded bg-white/5 p-2 hover:bg-white/10"
                >
                  <div className="text-sm font-medium">
                    #{it.id} {it.title}
                  </div>
                  <div className="text-xs opacity-70">
                    HH: {it.household_id || "—"} • {it.category} • {it.severity}
                  </div>
                </a>
              ))}
              {bin1.length === 0 && (
                <div className="text-sm text-slate-400">No insights in this window.</div>
              )}
            </div>

            {/* Severity chips */}
            <div className="mt-3 flex gap-2 text-[11px]">
              <span className="badge border-white/20">urgent {bin1Counts.urgent || 0}</span>
              <span className="badge border-white/20">warn {bin1Counts.warn || 0}</span>
              <span className="badge border-white/20">opp {bin1Counts.opportunity || 0}</span>
              <span className="badge border-white/20">good {bin1Counts.good || 0}</span>
            </div>
          </div>

          {/* Window 2 */}
          <div className="rounded-lg bg-white/5 p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-xs opacity-70">Days {range + 1}–{range * 2}</div>
                <div className="font-semibold">
                  {formatWindowLabel(start2, end2)}
                </div>
              </div>
              <div className="text-3xl font-extrabold tabular-nums">{bin2.length}</div>
            </div>

            {/* Scrollable household list */}
            <div className="max-h-72 overflow-auto space-y-2">
              {bin2.map((it, idx) => (
                <a
                  key={`w2-${idx}`}
                  href={`/household?hh=${encodeURIComponent(it.household_id || "")}&id=${it.id}`}
                  className="block rounded bg-white/5 p-2 hover:bg-white/10"
                >
                  <div className="text-sm font-medium">
                    #{it.id} {it.title}
                  </div>
                  <div className="text-xs opacity-70">
                    HH: {it.household_id || "—"} • {it.category} • {it.severity}
                  </div>
                </a>
              ))}
              {bin2.length === 0 && (
                <div className="text-sm text-slate-400">No insights in this window.</div>
              )}
            </div>

            {/* Severity chips */}
            <div className="mt-3 flex gap-2 text-[11px]">
              <span className="badge border-white/20">urgent {bin2Counts.urgent || 0}</span>
              <span className="badge border-white/20">warn {bin2Counts.warn || 0}</span>
              <span className="badge border-white/20">opp {bin2Counts.opportunity || 0}</span>
              <span className="badge border-white/20">good {bin2Counts.good || 0}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================== */}
      {/*  TOP 10 SECTION (separate + scroll)   */}
      {/* ===================================== */}
      <section className="card p-4">
        <h2 className="mb-3 font-bold">Top 10 (Upcoming)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-white/5 p-4">
            <h3 className="mb-2 font-semibold">Top 10 Growth Opportunities</h3>
            <div className="max-h-72 overflow-auto space-y-2">
              {top10Growth.length === 0 ? (
                <div className="text-sm text-slate-400">No upcoming growth items.</div>
              ) : (
                top10Growth.map((it, idx) => (
                  <a
                    key={`g-${idx}`}
                    href={`/household?hh=${encodeURIComponent(it.household_id || "")}&id=${it.id}`}
                    className="block rounded bg-white/5 p-2 hover:bg-white/10"
                  >
                    <div className="text-sm font-medium">#{it.id} {it.title}</div>
                    <div className="text-xs opacity-70">
                      HH: {it.household_id || "—"} • {it.severity} • {it.detection_date ? new Date(it.detection_date).toLocaleDateString() : "—"}
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white/5 p-4">
            <h3 className="mb-2 font-semibold">Top 10 Retention Radar</h3>
            <div className="max-h-72 overflow-auto space-y-2">
              {top10Retention.length === 0 ? (
                <div className="text-sm text-slate-400">No upcoming retention items.</div>
              ) : (
                top10Retention.map((it, idx) => (
                  <a
                    key={`r-${idx}`}
                    href={`/household?hh=${encodeURIComponent(it.household_id || "")}&id=${it.id}`}
                    className="block rounded bg-white/5 p-2 hover:bg-white/10"
                  >
                    <div className="text-sm font-medium">#{it.id} {it.title}</div>
                    <div className="text-xs opacity-70">
                      HH: {it.household_id || "—"} • {it.severity} • {it.detection_date ? new Date(it.detection_date).toLocaleDateString() : "—"}
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Suggested cards (unchanged demo content) */}
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
