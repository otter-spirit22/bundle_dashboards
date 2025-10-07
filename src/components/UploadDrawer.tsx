// src/components/UploadDrawer.tsx
import { useRef, useState } from "react";
import { parseFile } from "../data/loader";          // <- returns { rows, meta }
import { computeAllMetrics } from "../data/metrics";

// App-wide store setters (your stores.ts)
import { setRows, setMetrics, setInsights } from "../stores";

// Optional: only if you created it. Safe to keep the import; we guard its use.
import { computeInsights50 } from "../data/insightsAggregator";

export default function UploadDrawer() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      setStatus("Parsing…");
      // IMPORTANT: parseFile returns { rows, meta }
      const { rows, meta } = await parseFile(f);

      // Dev visibility: see how headers mapped and what's missing
      console.log("Header map:", meta.headerMap);
      if (meta.missingRequired?.length) {
        console.warn("Missing required columns:", meta.missingRequired);
      }

      setStatus(`Parsed ${meta.totalKept}/${meta.totalRaw} rows. Computing metrics…`);
      const metrics = computeAllMetrics(rows);

      // Store everywhere the app expects
      setRows(rows);
      setMetrics(metrics);

      // Keep window shims for legacy bits / KPIs
      (window as any).__BB_ROWS__ = rows;
      (window as any).__BB_METRICS__ = metrics;

      // Insights (optional). Guard in case the file doesn't exist yet.
      try {
        setStatus("Computing insights…");
        const insights = typeof computeInsights50 === "function" ? computeInsights50(rows) : [];
        setInsights(insights);
        (window as any).__BB_INSIGHTS__ = insights;

        setStatus(
          `Done. BenchScore ${metrics.benchScore}, Depth ${metrics.coverageDepthPct.toFixed(
            1
          )}%. Insights: ${insights.length}`
        );
      } catch (err) {
        console.warn("Insights aggregator not available:", err);
        setInsights([]);
        setStatus(
          `Done. BenchScore ${metrics.benchScore}, Depth ${metrics.coverageDepthPct.toFixed(
            1
          )}%. (Insights pending aggregator)`
        );
      }

      alert("Data loaded. Dashboards & calendar will update. Visit Principal/Producer/AM or Insights-50.");
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message || String(err)}`);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="badge border-white/20">
        Upload
      </button>

      {open && <div className="drawer-overlay" onClick={() => setOpen(false)} />}

      <aside className={`drawer ${open ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <h3 className="font-semibold">Import Data</h3>
          <button className="badge border-white/20" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-300">
            Upload your Household Snapshot (CSV/XLSX). We’ll auto-map columns and compute KPIs + insights.
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
            Required headers (any alias OK): <code>household_id</code>, <code>lines_count</code>,{" "}
            <code>renewal_date</code>, <code>service_touches_12m</code>, <code>avg_minutes_per_touch</code>,{" "}
            <code>remarkets_12m</code>, <code>est_minutes_per_remarket</code>. Optional but useful:{" "}
            <code>service_manager</code>.
          </div>
        </div>
      </aside>
    </>
  );
}
