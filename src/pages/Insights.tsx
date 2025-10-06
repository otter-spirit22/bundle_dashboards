import InsightCard from "../components/InsightCard";
import { mockInsights } from "../data/mock";
// src/pages/Insights50.tsx
import React from "react";
import FilterBar, { FilterState } from "@/components/FilterBar";
import { filterInsights, INSIGHTS_50, type Insight } from "@/data/dataDictionary";

export default function Insights50() {
  const [filters, setFilters] = React.useState<FilterState>({
    category: "All",
    tags: [],
    query: "",
  });

  const filtered: Insight[] = filterInsights(filters);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold uppercase text-indigo-300">
          Insights 50
        </h1>
        <p className="text-white/70">
          Explore all fifty Bundle Bench insights. Filter by category, tags, or search.
        </p>
      </header>

      <FilterBar value={filters} onChange={setFilters} />

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((ins) => (
          <div key={ins.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="mb-1 text-xs text-white/60">#{ins.id}</div>
            <div className="mb-1 font-semibold">{ins.title}</div>
            <div className="text-sm text-white/80">{ins.definition}</div>
            <div className="mt-2 text-xs">
              <span className="font-mono">Category:</span> {ins.category}
            </div>
            <div className="mt-1 text-xs">
              <span className="font-mono">Metric:</span> {ins.metric}
            </div>
            <div className="mt-1 text-xs">
              <span className="font-mono">Fields:</span> {ins.fields.join(", ")}
            </div>
            {ins.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {ins.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-white/60">
        Showing {filtered.length} of {INSIGHTS_50.length} insights.
      </div>
    </div>
  );
}

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
