// src/components/FilterBar.tsx
import React from "react";
import { Category, FILTER_OPTIONS } from "@/data/dataDictionary";

export type FilterState = {
  category: Category | "All";
  tags: string[];
  query: string;
};

type Props = {
  value: FilterState;
  onChange: (next: FilterState) => void;
  showTags?: boolean; // toggle tag chips (true by default)
};

export default function FilterBar({ value, onChange, showTags = true }: Props) {
  const setCategory = (c: Category | "All") =>
    onChange({ ...value, category: c });
  const toggleTag = (t: string) => {
    const exists = value.tags.includes(t);
    onChange({
      ...value,
      tags: exists ? value.tags.filter(x => x !== t) : [...value.tags, t],
    });
  };
  const setQuery = (q: string) => onChange({ ...value, query: q });
  const clearAll = () => onChange({ category: "All", tags: [], query: "" });

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="grid gap-3 md:grid-cols-3">
        {/* Category */}
        <div>
          <label className="block text-xs uppercase text-white/60 mb-1">Category</label>
          <select
            value={value.category}
            onChange={(e) => setCategory(e.target.value as Category | "All")}
            className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2"
          >
            <option value="All">All</option>
            {FILTER_OPTIONS.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-xs uppercase text-white/60 mb-1">Search</label>
          <input
            value={value.query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, definition, key…"
            className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2"
          />
        </div>

        {/* Actions */}
        <div className="flex items-end justify-start md:justify-end gap-2">
          <button
            onClick={clearAll}
            className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tags */}
      {showTags && (
        <div className="mt-3">
          <div className="mb-1 text-xs uppercase text-white/60">Tags</div>
