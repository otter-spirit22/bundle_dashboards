import { useRef, useState } from "react";
import { parseFile } from "../data/loader";
import { computeAllMetrics } from "../data/metrics";

// NEW: pull in the shared store and the insights aggregator
import { useDataStore } from "@/data/store";
import { computeInsights50 } from "@/data/insightsAggregator";

export default function UploadDrawer() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // NEW: store setters
  const { setData, setInsights } = useDataStore();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setStatus("Parsing…");
      const rows = await parseFile(f);

      setStatus(`Parsed ${rows.length} rows. Computing metrics…`);
      const metrics = computeAllMetrics(rows);
      (window as any).__BB_METRICS__ = metrics; // keep your current KPI demo path

      // NEW: push rows and computed insights into the app-wide store
      setStatus("Computing insights…");
      setData({ rows });
      const insights = computeInsights50(rows);
      setInsights(insights);

      setStatus(
        `Done. BenchScore ${metrics.benchScore}, Depth ${metrics.coverageDepthPct.toFixed(
          1
        )}%. Insights: ${insights.length}`
      );
      alert(
        "Data loaded. KPIs/heatmap will update on dashboards. Visit Principal/Producer/AM or Insights-50."
      );
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="badge border-white/20">
        Upload
      </button>

      {open && <div className="drawer-overlay" onClick={() => setOpen(false)} />}

      <aside
        className={`drawer ${open ? "translate-x-0" : "translate-x-full"} transition-transform`}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <h3 className="font-semibold">Import Data</h3>
          <button className="badge border-white/20" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-300">
            Upload your Household Snapshot (CSV/XLSX). We’ll auto-map columns and compute dials +
            insights.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFile}
            className="w-full rounded border border-white/10 bg-white/5 p-2"
          />
          <div className="text-xs text-slate-400">{status || "No file selected."}</div>
          <div className="text-xs text-slate-400">
            Tip: Required headers include <code>household_id</code>, <code>lines_count</code>,{" "}
            <code>renewal_date</code>, <code>service_touches_12m</code>,{" "}
            <code>avg_minutes_per_touch</code>, <code>remarkets_12m</code>, and{" "}
            <code>est_minutes_per_remarket</code>.
          </div>
        </div>
      </aside>
    </>
  );
}
