// src/pages/Household.tsx
import React from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { getRows, getInsights } from "../stores";

type Row = Record<string, any>;

export default function Household() {
  const { id } = useParams();                  // supports /household/:id
  const { search } = useLocation();
  const qs = new URLSearchParams(search);

  // support both styles: ?hh=... and /household/:id
  const hh = (id || qs.get("hh") || "").toString();
  const selectedInsight = qs.get("insight");   // optional insight id to highlight

  const rows: Row[] = (getRows && getRows()) || [];
  const insights: any[] = (getInsights && getInsights()) || [];

  const current = React.useMemo(
    () => rows.filter((r) => String(r.household_id) === hh),
    [rows, hh]
  );

  const mine = React.useMemo(
    () => insights.filter((i) => String(i.household_id) === hh),
    [insights, hh]
  );

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-indigo-300">
          Household {hh || "—"}
        </h1>
        <Link to="/principal" className="badge border-white/20">Back</Link>
      </div>

      {selectedInsight && (
        <div className="card border border-indigo-400/40 p-4">
          <div className="mb-1 text-xs uppercase text-indigo-300 tracking-wide">Linked Insight</div>
          <div className="font-semibold">
            #{selectedInsight}
          </div>
          <div className="text-xs text-slate-400">
            Opened from calendar link. Scroll the Insights list below to see all.
          </div>
        </div>
      )}

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">Records</h2>
        {current.length > 0 ? (
          <pre className="text-xs overflow-auto">{JSON.stringify(current, null, 2)}</pre>
        ) : (
          <div className="text-sm text-slate-400">No rows found for this household.</div>
        )}
      </div>

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">Insights</h2>
        {mine.length > 0 ? (
          <ul className="space-y-1">
            {mine.map((i, idx) => {
              const isSelected = selectedInsight && String(i.id) === selectedInsight;
              return (
                <li
                  key={idx}
                  className={`rounded px-2 py-1 text-sm ${
                    isSelected ? "bg-indigo-500/20 border border-indigo-400/40" : "bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        #{i.id} {i.title}
                      </div>
                      <div className="truncate text-xs text-slate-400">
                        {i.category} • {i.severity}
                      </div>
                    </div>
                    {/* Deep-link back to this page preserving the format */}
                    <Link
                      className="badge border-white/20 ml-2"
                      to={`/household/${encodeURIComponent(hh)}?insight=${encodeURIComponent(
                        i.id
                      )}`}
                      title="Permalink"
                    >
                      Link
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-sm text-slate-400">No insights.</div>
        )}
      </div>
    </div>
  );
}
