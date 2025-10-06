import clsx from "clsx";

type Props = {
  title: string;
  description: string;
  impact: number;
  urgency: number;
  confidence: string;
  onAdd?: () => void;
};

export default function InsightCard({
  title,
  description,
  impact,
  urgency,
  confidence,
  onAdd,
}: Props) {
  const badgeClass = clsx("badge border-white/10", {
    "text-emerald-300": confidence === "Measured",
    "text-amber-300": confidence === "Estimated",
    "text-slate-300": confidence === "Assumed",
  });

  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{title}</h4>
        <span className={badgeClass}>{confidence}</span>
      </div>
      <p className="text-sm text-slate-300">{description}</p>
      <div className="text-xs text-slate-400">
        Impact {impact}/5 • Urgency {urgency}/5
      </div>
      <div className="mt-2">
        <button
          onClick={onAdd}
          className="rounded-lg bg-indigo-500 px-3 py-1 text-sm font-semibold hover:bg-indigo-400"
        >
          Add to Plan
        </button>
      </div>
    </div>
  );
}
