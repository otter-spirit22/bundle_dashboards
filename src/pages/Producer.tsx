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

/** sort: more urgent first, then nearest date */
const SEV_ORDER: HeatmapInsight["severity"][] = ["good", "opportunity", "warn", "urgent"];
const sevRank = (s: HeatmapInsight["severity"]) => SEV_ORDER.indexOf(s);

export default function Producer() {
  const rows = useRows();
  const insights = useInsights();

  // ---- Service Manager list (placeholder) ----
  // We’ll look for a column called "service_manager" (or "Service Manager") if you later add it.
  // Until then, we produce a tiny fallback list so the UI works.
  const derivedManagers = React.useMemo(() => {
    const keys = ["service_manager", "Service Manager", "manager", "csr", "CSR"];
    const foundKey = rows.length
      ? (keys.find((k) => Object.prototype.hasOwnProperty.call(rows[0], k)) as string | undefined)
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
    // Fallback
    return ["Unassigned", "Alex Carter", "Jamie Lee", "Taylor Morgan"];
  }, [rows]);

  const [manager, setManager] = React.useState<string>(derivedManagers[0] || "Unassigned");

  // ---- Category filters ----
  const [cats, setCats] = React.useState<InsightCategory[]>([]);
  const catsActive = cats.length > 0;
  const passesCat = (i: HeatmapInsight) => (catsActive ? cats.includes(i.category) : true);

  // ---- Filter insights to those owned by selected manager (placeholder logic) ----
  // When you add the real column, this will map household -> manager and filter accurately.
  const hhToManager = React.useMemo(() => {
    // If a real key exists, build an index from rows
    const keys = ["service_manager", "Service Manager", "manager", "csr", "CSR"];
    const foundKey = rows.length
      ? (keys.find((k) => Object.prototype.hasOwnProperty.call(rows[0], k)) as string | undefined)
      : undefined;

    const map = new Map<string, string>();
    if (foundKey) {
      rows.forEach((r) => {
        const hh = String(r.household_id ?? "");
        const mgr = String(r[foundKey] ?? "Unassigned");
        if (hh) map.set(hh, mgr);
      });
    } else {
      // Fallback: assign by simple hash so we get a spread for the demo
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

  const upcoming = React.useMemo(() => {
    const today = new Date();
    // next 60 days for producer view (tweak if you prefer)
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
        const ad = a.detection_date ? new Date(a.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bd = b.detection_date ? new Date(b.detection_date).getTime() : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      });
  }, [insights, hhToManager, manager, cats]);

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

        {/* Count + list */}
        <div className="rounded-lg bg-white/5 p-4">
          <div className="mb-2 flex items-start justify-between">
            <div className="font-semibold">Upcoming (next 60 days)</div>
            <div className="text-3xl font-extrabold tabular-nums">{upcoming.length}</div>
          </div>

          <div className="max-h-80 overflow-auto space-y-2">
            {upcoming.map((it, idx) => (
              <a
                key={idx}
                href={`/household?hh=${encodeURIComponent(it.household_id || "")}&id=${it.id}`}
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
    </div>
  );
}
