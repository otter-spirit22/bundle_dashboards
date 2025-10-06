import InsightCard from "../components/InsightCard";
import { mockInsights } from "../data/mock";

export default function Insights() {
  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <h1 className="text-xl font-extrabold text-indigo-300">Insights Library</h1>
      <p className="text-slate-300">High-value patterns we surface from your data.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {mockInsights.map((ins) => (
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
