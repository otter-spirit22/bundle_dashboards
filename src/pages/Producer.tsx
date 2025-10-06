// src/pages/Producer.tsx
import React from "react";

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
  detection_date?: string; // ISO
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
  // optional extras if your aggregator provides them:
  impact?: number; // 0..100 (higher = bigger upside/risk)
  confidence?: number; // 0..1
};

declare global {
  interface Window {
    __BB_ROWS__?: UploadedRow[];
    __BB_INSIGHTS__?: HeatmapInsight[];
  }
}

/** --- lightweight hooks that work before data is uploaded --- */
function useRows(): UploadedRow[] {
  return window.__BB_ROWS__ || [];
}
function useInsights(): HeatmapInsight[] {
  if (Array.isArray(window.__BB_INSIGHTS__) && window.__BB_INSIGHTS__!.length) {
    return window.__BB_INSIGHTS__!;
  }
  // small fallback so page renders
  const demo: HeatmapInsight[] = Array.from({ length: 24 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i % 45));
    const cats: InsightCategory[] = [
      "Growth Opportunities",
      "Retention Radar",
      "Service Drain",
      "Risk & Compliance",
    ];
    const titles = [
      "Bundling Gap",
      "Umbrella Opportunity",
      "Rate Shock Sensitivity",
      "Review Freshness Gap",
    ];
    const sev: HeatmapInsight["severity"][] = ["opportunity", "urgent", "warn", "good"];
    return {
      id: ((i % 50) + 1) as number,
      title: titles[i % titles.length],
      household_id: `HH${String(i + 1).padStart(4, "0")}`,
      detection_date: d.toISOString(),
      category: cats[i % cats.length],
      severity: sev[i % sev.length],
      impact: Math.round(40 + Math.random() * 60), // random 40–100
      confidence: 0.6 + Math.random() * 0.35,
    };
  });
  return demo;
}

/** sort helpers: more urgent first, then higher impact, then nearest date */
const SEV_ORDER: HeatmapInsight["severity"][] = ["good", "opportunity", "warn", "urgent"];
const sevRank = (s: HeatmapInsight["severity"]) => SEV_ORDER.indexOf(s);
const toTime = (iso?: string) => (iso ? new Date(iso).getTime() : Number.MAX_SAFE_INTEGER);

export default function Producer() {
  const rows = useRows();
  const insights = useInsights();

  // ---- Service Manager list (placeholder) ----
  const derivedManagers = React.useMemo(() => {
    const keys = ["service_manager", "Service Manager", "manager", "csr", "CSR"];
    const foundKey = rows.length
      ? (keys.find((k) => Object.prototype.hasOwnProperty.call(rows[0], k)) as
          | string
          | undefined)
      : undefined;

    if (foundKey) {
      const uniq = Array.from(
        new Set(
          rows
            .map((r) => String(r[foundKey] ?? "").trim())
            .filter((v) => v.length > 0)
        )
      );
      return uniq.length ? uniq : ["Unassigned"];
    }
    // Fallback demo names
    return ["Unassigned", "Alex Carter", "Jamie Lee", "Taylor Morgan"];
  }, [rows]);

  const [manager, setManager] = React.useState<string>(derivedManagers[0] || "Unassigned");

  // ---- Category filters ----
  const [cats, setCats] = React.useState<InsightCategory[]>([]);
  const catsActive = cats.length > 0;
  const passesCat = (i: HeatmapInsight) => (catsActive ? cats.includes(i.category) : true);

  // ---- Household -> Manager index ----
  const hhToManager = React.useMemo(() => {
    const keys = ["service_manager", "Service Manager", "manager", "csr", "CSR"];
    const foundKey = rows.length
      ? (keys.find((k) => Object.prototype.hasOwnProperty.call(rows[0], k)) as
          | string
          | undefined)
      : undefined;

    const map = new Map<string, string>();
    if (foundKey) {
      rows.forEach((r) => {
        const hh = String(r.household_id ?? "");
        const mgr = String(r[foundKey] ?? "Unassigned");
        if (hh) map.set(hh, mgr);
      });
    } else {
      // Fallback spread so the filter works in demo mode
      insights.forEach((i, idx) => {
        const hh = String(i.household_id ?? "");
        if (!hh) return;
        const mgr = derivedManagers[idx % derivedManagers.length];
        map.set(hh, mgr);
      });
    }
    return map;
  }, [rows, insights, derivedManagers]);

  // ---- Upcoming (next 60 days) ----
  const upcoming = React.useMemo(() => {
    const today = new Date();
    const end = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    return insights
      .filter(
        (i) =>
          i.detection_date &&
          new Date(i.detection_date) >= today &&
          new Date(i.detection_date) < end &&
          passesCat(i) &&
          (hhToManager.get(String(i.household_id ?? "")) ?? "Unassigned") === manager
      )
      .sort((a, b) => {
        const sv = sevRank(b.severity) - sevRank(a.severity);
        if (sv !== 0) return sv;
        const imp = (b.impact ?? -Infinity) - (a.impact ?? -Infinity);
        if (imp !== 0) return imp;
        return toTime(a.detection_date) - toTime(b.detection_date);
      });
  }, [insights, hhToManager, manager, cats]);

  // ---- Top 10 lists (most urgent, then highest impact) ----
  function topByCategory(cat: InsightCategory): HeatmapInsight[] {
    const list = insights.filter(
      (i) =>
        i.category === cat &&
        passesCat(i) &&
        (hhToManager.get(String(i.household_id ?? "")) ?? "Unassigned") === manager
    );
    list.sort((a, b) => {
      const sv = sevRank(b.severity) - sevRank(a.severity);
      if (sv !== 0) return sv;
      return (b.impact ?? -Infinity) - (a.impact ?? -Infinity);
    });
    return list.slice(0, 10);
  }

  const topGrowth = React.useMemo(
    () => topByCategory("Growth Opportunities"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insights, hhToManager, manager, cats]
  );

  const topRetention = React.useMemo(
    () => topByCategory("Retention Radar"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insights, hhToManager, manager, cats]
  );

  // ---- small render helpers ----
  const sevPill = (s: HeatmapInsight["severity"]) => {
    const tone =
      s === "urgent" ? "bg-red-500/80" : s === "warn" ? "bg-yellow-500/80" : s === "opportunity" ? "bg-indigo-500/80" : "bg-emerald-600/80";
    return <span className={`badge ${tone}`}>{s}</span>;
  };

  const CardRow: React.FC<{ it: HeatmapInsight }> = ({ it }) => (
    <a
      href={`/household?hh=${encodeURIComponent(it.household_id || "")}&id=${it.id}`}
      className="block rounded bg-white/5 p-2 hover:bg-white/10"
    >
      <div className="text-sm font-medium">#{it.id} {it.title}</div>
      <div className="text-xs opacity-70">
        HH: {it.household_id || "—"} • {it.category} • {it.severity} •{" "}
        {it.detection_date ? new Date(it.detection_date).toLocaleDateString() : "—"}
      </div>
    </a>
  );

  const HorizontalCards: React.FC<{ title: string; items: HeatmapInsight[]; total?: number }> = ({
    title,
    items,
    total,
  }) => (
    <section className="card p-4 space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="font-semibold">{title}</h2>
        <div className="text-3xl font-extrabold tabular-nums">{total ?? items.length}</div>
      </div>
      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <div className="inline-flex gap-3 pr-2">
          {items.map((i) => (
            <a
              key={`${i.id}-${i.household_id}`}
              href={`/household?hh=${encodeURIComponent(i.household_id || "")}&id=${i.id}`}
              className="min-w-[220px] rounded bg-white/5 p-3 hover:bg-white/10"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="text-xs opacity-70">#{i.id}</div>
                {sevPill(i.severity)}
              </div>
              <div className="text-sm font-medium line-clamp-2">{i.title}</div>
              <div className="mt-1 text-xs opacity-70">
                HH: {i.household_id || "—"}
                {typeof i.impact === "number" && (
                  <> • Impact: <span className="tabular-nums">{i.impact}</span></>
                )}
              </div>
            </a>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-slate-400 p-2">No items for current filters.</div>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-indigo-300">Producer Dashboard</h1>

        {/* Placeholder Service Manager filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="svcMgr" className="text-sm text-slate-300">
            Service Manager:
          </label>
          <select
            id="svcMgr"
            className="rounded border border-white/10 bg-white/5 p-2 text-sm"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
          >
            {derivedManagers.map((sm) => (
              <option key={sm} value={sm}>
                {sm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs opacity-70 mr-1">Categories:</span>
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
                className={`badge border-white/20 text-xs ${on ? "bg-white/20" : ""}`}
              >
                {c}
              </button>
            );
          })}
          <button className="badge border-white/20 text-xs" onClick={() => setCats([])}>
            Clear
          </button>
        </div>
      </div>

      {/* Upcoming block (wrapped, big count, scrollable list) */}
      <section className="card p-4 space-y-3">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="font-semibold">Upcoming (next 60 days){manager ? ` • ${manager}` : ""}</h2>
          <div className="text-4xl font-extrabold tabular-nums">{upcoming.length}</div>
        </div>

        <div className="max-h-80 overflow-auto space-y-2">
          {upcoming.map((it) => (
            <CardRow key={`${it.id}-${it.household_id}`} it={it} />
          ))}
          {upcoming.length === 0 && (
            <div className="text-sm text-slate-400">No upcoming items for current filters.</div>
          )}
        </div>
      </section>

      {/* Top 10 Growth – horizontal scroll */}
      <HorizontalCards
        title={`Top 10 Growth Opportunities${manager ? ` • ${manager}` : ""}`}
        items={topGrowth}
        total={topGrowth.length}
      />

      {/* Top 10 Retention – horizontal scroll */}
      <HorizontalCards
        title={`Top 10 Retention Radar${manager ? ` • ${manager}` : ""}`}
        items={topRetention}
        total={topRetention.length}
      />
    </div>
  );
}
