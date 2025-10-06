// src/pages/Producer.tsx
import React from "react";
import type { UploadedRow, HeatmapInsight, InsightCategory } from "../types/insights";
import HorizontalInsightCarousel from "../components/HorizontalInsightCarousel";

/** ---- lightweight hooks that work before data is uploaded ---- */
function useRows(): UploadedRow[] {
  return (window as any).__BB_ROWS__ || [];
}
function useInsights(): HeatmapInsight[] {
  const w = window as any;
  if (Array.isArray(w.__BB_INSIGHTS__) && w.__BB_INSIGHTS__!.length) {
    return w.__BB_INSIGHTS__!;
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
    const titles = ["Bundling Gap", "Umbrella Opportunity", "Rate Shock Sensitivity", "Review Freshness Gap"];
    const sev: HeatmapInsight["severity"][] = ["opportunity", "urgent", "warn", "good"];
    return {
      id: ((i % 50) + 1) as number,
      title: titles[i % titles.length],
      household_id: `HH${String(i + 1).padStart(4, "0")}`,
      detection_date: d.toISOString(),
      category: cats[i % cats.length],
      severity: sev[i % sev.length],
    };
  });
  return demo;
}

/** sort: most urgent first, then nearest date */
const SEV_ORDER: HeatmapInsight["severity"][] = ["urgent", "warn", "opportunity", "good"];
const sevRank = (s: HeatmapInsight["severity"]) => SEV_ORDER.indexOf(s);

export default function Producer() {
  const rows = useRows();
  const insights = useInsights();

  // ---- Service Manager list (placeholder) ----
  const derivedManagers = React.useMemo(() => {
    const keys = ["service_manager", "Service Manager", "manager", "csr", "CSR"];
    const foundKey = rows.length
      ? (keys.find((k) => Object.prototype.hasOwnProperty.call(rows[0], k)) as string | undefined)
      : undefined;

    if (foundKey) {
      const uniq = Array.from(
        new Set(
          rows
            .map((r) => String((r as any)[foundKey] ?? "").trim())
            .filter((v) => v.length > 0)
        )
      );
      return uniq.length ? uniq : ["Unassigned"];
    }
    // Fallback
    return ["Unassigned", "Alex Carter", "Jamie Lee", "Taylor Morgan"];
  }, [rows]);

  const [manager, setManager] = React.useState<string>(derivedManagers[0] || "Unassigned");

  // ---- Category filters ----
  const [cats, setCats] = React.useState<InsightCategory[]>([]);
  const catsActive = cats.length > 0;
  const passesCat = (i: HeatmapInsight) => (catsActive ? cats.includes(i.category) : true);

  // ---- Map household -> manager (placeholder / real when column exists) ----
  const hhToManager = React.useMemo(() => {
    const keys = ["service_manager", "Service Manager", "manager", "csr", "CSR"];
    const foundKey = rows.length
      ? (keys.find((k) => Object.prototype.hasOwnProperty.call(rows[0], k)) as string | undefined)
      : undefined;

    const map = new Map<string, string>();
    if (foundKey) {
      rows.forEach((r) => {
        const hh = String((r as any).household_id ?? "");
        const mgr = String((r as any)[foundKey] ?? "Unassigned");
        if (hh) map.set(hh, mgr);
      });
    } else {
      const demoManagers = derivedManagers;
      insights.forEach((i, idx) => {
        const hh = String(i.household_id ?? "");
        if (!hh) return;
        const mgr = demoManagers[idx % demoManagers.length];
        map.set(hh, mgr);
      });
    }
    return map;
  }, [rows, insights, derivedManagers]);

  // ---- Upcoming (next 60 days) list for the manager & category chips ----
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
        // urgent->warn->opportunity->good
        const sv = sevRank(a.severity) - sevRank(b.severity);
        if (sv !== 0) return sv;
        const ad = a.detection_date ? new Date(a.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bd = b.detection_date ? new Date(b.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        return ad - bd; // sooner first
      });
  }, [insights, hhToManager, manager, cats]);

  // ---- Top 10 Growth & Retention for this manager (most urgent upcoming first) ----
  const top10Growth = React.useMemo(() => {
    const today = new Date();
    return insights
      .filter((i) => {
        const owned = (hhToManager.get(String(i.household_id ?? "")) ?? "Unassigned") === manager;
        const isFuture = i.detection_date ? new Date(i.detection_date) >= today : false;
        return owned && i.category === "Growth Opportunities" && isFuture;
      })
      .sort((a, b) => {
        const sv = sevRank(a.severity) - sevRank(b.severity);
        if (sv !== 0) return sv;
        const ad = a.detection_date ? new Date(a.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bd = b.detection_date ? new Date(b.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      })
      .slice(0, 10);
  }, [insights, hhToManager, manager]);

  const top10Retention = React.useMemo(() => {
    const today = new Date();
    return insights
      .filter((i) => {
        const owned = (hhToManager.get(String(i.household_id ?? "")) ?? "Unassigned") === manager;
        const isFuture = i.detection_date ? new Date(i.detection_date) >= today : false;
        return owned && i.category === "Retention Radar" && isFuture;
      })
      .sort((a, b) => {
        const sv = sevRank(a.severity) - sevRank(b.severity);
        if (sv !== 0) return sv;
        const ad = a.detection_date ? new Date(a.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bd = b.detection_date ? new Date(b.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      })
      .slice(0, 10);
  }, [insights, hhToManager, manager]);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <h1 className="text-xl font-extrabold text-indigo-300">Producer Dashboard</h1>

      {/* Controls */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Service Manager filter (placeholder) */}
          <label className="text-xs opacity-70">Service Manager</label>
          <select
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            className="rounded bg-white/5 border border-white/10 p-1 text-sm"
          >
            {derivedManagers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Category chips */}
          <span className="ml-4 text-xs opacity-70">Categories</span>
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

        {/* Count + list (Upcoming) */}
        <div className="rounded-lg bg-white/5 p-4">
          <div className="mb-2 flex items-start justify-between">
            <div className="font-semibold">Upcoming (next 60 days)</div>
            <div className="text-3xl font-extrabold tabular-nums">{upcoming.length}</div>
          </div>

          <div className="max-h-80 overflow-auto space-y-2">
            {upcoming.map((it, idx) => (
              <a
                key={`${it.household_id ?? ""}-${it.id}-${idx}`}
                href={`/household?hh=${encodeURIComponent(it.household_id ?? "")}&id=${it.id}`}
                className="block rounded bg-white/5 p-2 hover:bg-white/10"
              >
                <div className="text-sm font-medium">
                  #{it.id} {it.title}
                </div>
                <div className="text-xs opacity-70">
                  HH: {it.household_id || "—"} • {it.category} • {it.severity} •{" "}
                  {it.detection_date ? new Date(it.detection_date).toLocaleDateString() : "—"}
                </div>
              </a>
            ))}
            {upcoming.length === 0 && (
              <div className="text-sm text-slate-400">No upcoming items for {manager}.</div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Top 10 horizontal carousels ---- */}
      <HorizontalInsightCarousel
        title="Top 10 Growth Opportunities"
        items={top10Growth}
      />

      <HorizontalInsightCarousel
        title="Top 10 Retention Radar"
        items={top10Retention}
      />
    </div>
  );
}
