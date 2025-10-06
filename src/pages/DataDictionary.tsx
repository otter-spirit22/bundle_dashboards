export default function DataDictionary() {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-extrabold text-indigo-300">Data Dictionary</h1>

      <div className="card">
        <h3 className="font-semibold">Coverage Depth</h3>
        <p className="text-sm text-slate-300">
          % households with <code>lines_count ≥ 2</code> (bundle proxy). Higher is healthier.
        </p>
      </div>
      <div className="card">
        <h3 className="font-semibold">Remarketing Load</h3>
        <p className="text-sm text-slate-300">
          <code>remarkets ÷ renewals × 100</code>. Lower is better (less drag on the team).
        </p>
      </div>
      <div className="card">
        <h3 className="font-semibold">Service Touch Index</h3>
        <p className="text-sm text-slate-300">
          Minutes per household per year: <code>service_touches_12m × avg_minutes_per_touch</code>.
        </p>
      </div>
      <div className="card">
        <h3 className="font-semibold">Tenure Momentum</h3>
        <p className="text-sm text-slate-300">
          Average <code>tenure_years</code> and its MoM trend; depth-weighted.
        </p>
      </div>
      <div className="card">
        <h3 className="font-semibold">BenchScore™</h3>
        <p className="text-sm text-slate-300">
          0–100 composite of bundling rate, remarketing load, service minutes, tenure, and
          experience quality.
        </p>
      </div>
    </div>
  );
}
