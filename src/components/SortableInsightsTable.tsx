import React from "react";

export type Category =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Compliance";

export type DictionaryItem = {
  id: number;
  key: string;
  title: string;
  definition: string;
  flagLogic: string;
  metric: string;
  fields: string[];
  tags?: string[];
  category: Category;
  benchmarkNote?: string;
};

type Props = {
  /** Now optional so accidental empty usage won't fail the build */
  items?: DictionaryItem[];
  className?: string;
  onRowClick?: (item: DictionaryItem) => void;
};

type SortKey =
  | "id"
  | "key"
  | "title"
  | "category"
  | "metric"
  | "definition"
  | "flagLogic";

export default function SortableInsightsTable({
  items = [],               // default prevents the TS error
  className = "",
  onRowClick,
}: Props) {
  const [sortKey, setSortKey] = React.useState<SortKey>("id");
  const [asc, setAsc] = React.useState<boolean>(true);
  const [query, setQuery] = React.useState("");

  const onSort = (k: SortKey) => {
    setSortKey((prev) => {
      if (prev === k) {
        setAsc((a) => !a);
        return prev;
      }
      setAsc(true);
      return k;
    });
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items.filter((it) =>
          [
            it.title,
            it.key,
            it.category,
            it.definition,
            it.metric,
            it.flagLogic,
            ...(it.tags || []),
            ...it.fields,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : items.slice();

    const sorted = base.sort((a, b) => {
      const dir = asc ? 1 : -1;
      switch (sortKey) {
        case "id":
          return (a.id - b.id) * dir;
        case "key":
          return a.key.localeCompare(b.key) * dir;
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "category":
          return a.category.localeCompare(b.category) * dir;
        case "metric":
          return a.metric.localeCompare(b.metric) * dir;
        case "definition":
          return a.definition.localeCompare(b.definition) * dir;
        case "flagLogic":
          return a.flagLogic.localeCompare(b.flagLogic) * dir;
        default:
          return 0;
      }
    });

    return sorted;
  }, [items, query, sortKey, asc]);

  const Th = ({
    k,
    label,
    width,
  }: {
    k: SortKey;
    label: string;
    width?: string;
  }) => (
    <th
      className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-sm font-semibold"
      style={width ? { width } : undefined}
      onClick={() => onSort(k)}
      title="Click to sort"
    >
      {label}
      {sortKey === k && (
        <span className="ml-1 opacity-70">{asc ? "▲" : "▼"}</span>
      )}
    </th>
  );

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, logic, fields, tags…"
          className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
        <button
          className="badge border-white/20"
          onClick={() => {
            setQuery("");
            setSortKey("id");
            setAsc(true);
          }}
        >
          Reset
        </button>
      </div>

      <div className="overflow-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-white/5">
            <tr>
              <Th k="id" label="ID" width="64px" />
              <Th k="title" label="Title" />
              <Th k="category" label="Category" width="180px" />
              <Th k="metric" label="Metric / Field" width="200px" />
              <Th k="definition" label="Definition" />
              <Th k="flagLogic" label="Logic" />
              <th className="px-3 py-2 text-left text-sm font-semibold whitespace-nowrap">
                Fields
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold whitespace-nowrap">
                Tags
              </th>
              <th className="px-3 py-2 text-left text-sm font-semibold whitespace-nowrap">
                Benchmark
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr
                key={`${it.id}-${it.key}`}
                className="hover:bg-white/5"
                onClick={onRowClick ? () => onRowClick(it) : undefined}
              >
                <td className="px-3 py-2 align-top tabular-nums text-xs opacity-80">
                  {it.id}
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="font-medium">{it.title}</div>
                  <div className="text-[11px] opacity-70">{it.key}</div>
                </td>
                <td className="px-3 py-2 align-top">
                  <span className="badge border-white/20">{it.category}</span>
                </td>
                <td className="px-3 py-2 align-top">
                  <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                    {it.metric}
                  </code>
                </td>
                <td className="px-3 py-2 align-top text-slate-200">
                  {it.definition}
                </td>
                <td className="px-3 py-2 align-top text-slate-300">
                  <span className="text-[11px]">{it.flagLogic}</span>
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-wrap gap-1">
                    {it.fields.map((f) => (
                      <span
                        key={f}
                        className="rounded bg-white/10 px-1 py-0.5 text-[11px]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-wrap gap-1">
                    {(it.tags || []).map((t) => (
                      <span
                        key={t}
                        className="rounded bg-indigo-500/20 px-1 py-0.5 text-[11px] text-indigo-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 align-top text-[11px] text-slate-400">
                  {it.benchmarkNote || "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-400" colSpan={9}>
                  No matching entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
