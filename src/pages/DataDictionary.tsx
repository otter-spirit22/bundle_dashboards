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
