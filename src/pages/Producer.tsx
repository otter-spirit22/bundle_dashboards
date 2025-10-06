import Kpi from "../components/Kpi";
import Bullet from "../components/Bullet";
import InsightCard from "../components/InsightCard";
import { mockMetrics, mockInsights } from "../data/mock";
import { bands } from "../config/benchmarks";

function useMetrics() {
  const anyWin = (window as any).__BB_METRICS__;
  return anyWin || mockMetrics;
}

export default function Producer() {
  const m = useMetrics();
  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <h1 className="text-xl font-extrabold text-indigo-300">Producer Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="My BenchScore" value={`74 / 100`} metric="benchScore" numeric={74} />
        <Kpi
          label="My Time-Back Number™"
          value={`${Math.round(m.timeBackHoursMoTopN * 0.4)} hrs/mo`}
          tooltip="Hours reclaimable in my book"
        />
        <Kpi label="My Coverage Depth" value={`63%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Bullet
          label="Service Minutes / HH (goal ≤ 75)"
          value={m.serviceTouchIndexMinPerHHYr * 0.9}
          target={bands.serviceTouchIndex.healthy}
          goodIsLow
        />
        <div className="card">
          <h3 className="font-semibold mb-2">My Renewals (next 60 days)</h3>
          <p className="text-sm text-slate-300">
            Calendar heatmap placeholder — connect to importer and add filters.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {mockInsights.map((ins) => (
          <InsightCard
            key={ins.key}
            title={ins.title}
            description={ins.description}
            impact={ins.impact}
            urgency={ins.urgency}
            confidence={ins.confidence}
            onAdd={() => alert(`Assigned ${ins.title} to you`)}
          />
        ))}
      </div>
    </div>
  );
}
