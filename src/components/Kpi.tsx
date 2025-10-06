import React from "react";
import { bandColor } from "../config/benchmarks";

type Props = {
  label: string;
  value: string;
  metric?: string;
  numeric?: number;
  badge?: string;
  tooltip?: string;
  delta?: number; // optional % change
  trendValues?: number[]; // optional sparkline values
};

export default function Kpi({
  label,
  value,
  metric,
  numeric,
  badge,
  tooltip,
  delta,
  trendValues,
}: Props) {
  const colorClass =
    numeric != null && metric ? bandColor(metric, numeric) : "text-slate-100";

  const deltaText =
    delta != null ? (delta > 0 ? `▲ ${delta}%` : `▼ ${Math.abs(delta)}%`) : null;
  const deltaColor =
    delta == null ? "" : delta > 0 ? "text-green-400" : "text-red-400";

  const points = trendValues
    ? trendValues.map((p, i) => `${(i / (trendValues.length - 1)) * 100},${20 - p}`)
    : [];

  return (
    <div className="card h-full flex flex-col justify-between">
      <div className="flex items-center justify-between text-sm text-slate-300">
        {label}
        {badge && <span className="badge border-white/10">{badge}</span>}
      </div>

      <div className={`kpi ${colorClass}`}>{value}</div>

      {deltaText && <div className={`text-xs ${deltaColor}`}>{deltaText}</div>}

      {trendValues && (
        <svg viewBox="0 0 100 20" className="w-full h-4 mt-1 text-indigo-300">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={points.join(" ")}
          />
        </svg>
      )}

      {tooltip && <div className="mt-1 text-xs text-slate-400">{tooltip}</div>}
    </div>
  );
}
