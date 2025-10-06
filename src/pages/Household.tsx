// src/pages/Household.tsx
import React from "react";
import { getRows, getInsights } from "../stores";

export default function Household() {
  const rows = getRows();
  const insights = getInsights();

  const params = new URLSearchParams(location.search);
  const hh = params.get("hh");

  const current = rows.filter((r: Record<string, any>) => String(r.household_id) === String(hh));
  const mine = insights.filter((i) => i.household_id === hh);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-xl font-bold">Household {hh || "—"}</h1>

      <div className="card p-4">
        <h2 className="font-semibold mb-2">Records</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(current, null, 2)}</pre>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-2">Insights</h2>
        <ul className="list-disc ml-5 text-sm">
          {mine.map((i, idx) => (
            <li key={idx}>
              #{i.id} {i.title} • {i.category} • {i.severity}
            </li>
          ))}
          {mine.length === 0 && <li className="text-slate-400">No insights.</li>}
        </ul>
      </div>
    </div>
  );
}
