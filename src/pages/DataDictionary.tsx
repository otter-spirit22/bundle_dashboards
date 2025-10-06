import React, { useMemo, useState } from "react";
import { CORE_METRICS, INSIGHTS_50, CATEGORIES, type Category } from "@/data/dictionary";

function CategoryPill({
  cat,
  active,
  onClick,
  count,
}: {
  cat: Category;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  const base =
    "whitespace-nowrap rounded-full px-3 py-1 text-sm border transition-colors";
  const activeCls = "bg-indigo-600 text-white border-indigo-600";
  const inactiveCls =
    "bg-white/5 text-white/90 border-white/15 hover:bg-white/10";
  return (
    <button className={`${base} ${active ? activeCls : inactiveCls}`} onClick={onClick}>
      {cat} <span className="ml-1 opacity-80">({count})</span>
    </button>
  );
}

export default function Insights50() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category>("Growth Opportunities");

  const countsByCat = useMemo(() => {
    const m = new Map<Category, number>();
    CATEGORIES.forEach((c) => m.set(c as Category, 0));
    INSIGHTS_50.forEach((i) => m.set(i.category, (m.get(i.category) || 0) + 1));
    return m;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INSIGHTS_50.filter((i) => i.category === cat).filter((i) => {
      if (!q) return true;
      const hay = [
        i.title,
        i.definition,
        i.flagLogic,
        i.metric,
        i.fields.join(" "),
        i.key,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [cat, query]);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Insights-50 & Data Dictionary</h1>
          <p className="text-white/70">
            Core scorecard metrics plus 50 actionable insights with definitions, logic, and fields.
          </p>
        </div>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, logic, fields…"
            className="w-72 rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-white/70 hover:text-white"
              aria-label="Clear"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Core Scorecard */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Core Scorecard</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CORE_METRICS.map((m) => (
            <div key={m.key} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-1 text-sm font-semibold text-indigo-300">{m.title}</div>
              <div className="text-sm text-white/85">{m.definition}</div>
              <div className="mt-2 text-xs text-white/60">
                <span className="font-semibold">Formula: </span>
                {m.formula}
              </div>
              <div className="mt-2 text-[11px] text-white/50">
                <span className="font-semibold">Fields: </span>
                {m.fields.join(", ")}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Tabs */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c !== "Core Scorecard").map((c) => (
            <CategoryPill
              key={c}
              cat={c as Category}
              active={cat === c}
              count={countsByCat.get(c as Category) || 0}
              onClick={() => setCat(c as Category)}
            />
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-white/10 text-left text-sm">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Definition</th>
                <th className="px-4 py-3 font-semibold">Flag Logic</th>
                <th className="px-4 py-3 font-semibold">Metric</th>
                <th className="px-4 py-3 font-semibold">Fields</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i, idx) => (
                <tr
                  key={i.id}
                  className={idx % 2 ? "bg-white/[0.02]" : "bg-transparent"}
                >
                  <td className="px-4 py-3 align-top text-sm text-white/80">{i.id}</td>
                  <td className="px-4 py-3 align-top text-sm font-semibold">{i.title}</td>
                  <td className="px-4 py-3 align-top text-sm text-white/85">{i.definition}</td>
                  <td className="px-4 py-3 align-top text-xs text-white/70">{i.flagLogic}</td>
                  <td className="px-4 py-3 align-top text-sm text-white/85">{i.metric}</td>
                  <td className="px-4 py-3 align-top text-xs text-white/70">
                    {i.fields.join(", ")}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-white/60" colSpan={6}>
                    No insights match your search in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// At the top of your component file:
const cards = [
  {
    title: "Coverage Depth",
    description: "% households with <code>lines_count ≥ 2</code> (bundle proxy). Higher is healthier.",
  },
  {
    title: "Remarketing Load",
    description: "<code>remarkets ÷ renewals × 100</code>. Lower is better (less drag on the team).",
  },
  {
    title: "Service Touch Index",
    description: "Minutes per household per year: <code>service_touches_12m × avg_minutes_per_touch</code>.",
  },
  {
    title: "Tenure Momentum",
    description: "Average <code>tenure_years</code> and its MoM trend; depth-weighted.",
  },
  {
    title: "BenchScore™",
    description: "0–100 composite of bundling rate, remarketing load, service minutes, tenure, and experience quality.",
  },
];

// Updated component:
export default function () {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-extrabold text-indigo-300">Data Dictionary</h1>
      {cards.map(({ title, description }, idx) => (
        <div className="card" key={idx}>
          <h3 className="font-semibold">{title}</h3>
          <p
            className="text-sm text-slate-300"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      ))}
    </div>
  );
}
