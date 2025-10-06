import React from "react";

type Props = {
  value: number;
  max?: number;
  label?: string;
  trendValues?: number[]; // optional sparkline
};

export default function Gauge({ value, max = 100, label, trendValues }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    pct > 75 ? "bg-green-400" : pct > 40 ? "bg-yellow-300" : "bg-red-400";

  const points = trendValues
    ? trendValues.map((p, i) => `${(i / (trendValues.length - 1)) * 100},${20 - p}`)
    : [];

  return (
    <div className="card">
      {label && <div className="mb-2 text-sm text-slate-300">{label}</div>}

      <div className="relative h-3 w-full rounded-full bg-white/10">
        <div
          className={`absolute left-0 top-0 h-3 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 text-sm tabular-nums">
        {Math.round(value)} / {max}
      </div>

      {trendValues && (
        <svg viewBox="0 0 100 20" className="w-full h-4 mt-2 text-indigo-300">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={points.join(" ")}
          />
        </svg>
      )}
    </div>
  );
}
