import React, { useState } from 'react';
import { Insight, INSIGHTS_50 } from '../data/dataDictionary';
import InsightCard from './InsightCard';

type SortKey = keyof Pick<Insight, 'title' | 'category' | 'metric'>;

const SortableInsightsTable: React.FC = () => {
  const [sortBy, setSortBy] = useState<SortKey>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedInsights = [...INSIGHTS_50].sort((a, b) => {
    const valA = a[sortBy].toString().toLowerCase();
    const valB = b[sortBy].toString().toLowerCase();
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortBy) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="p-4">
      <table className="w-full table-auto border border-gray-300">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-4 py-2 cursor-pointer" onClick={() => toggleSort('title')}>
              Title {sortBy === 'title' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => toggleSort('category')}>
              Category {sortBy === 'category' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => toggleSort('metric')}>
              Metric {sortBy === 'metric' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedInsights.map(insight => (
            <tr key={insight.id} className="border-t border-gray-200">
              <td colSpan={3}>
                <InsightCard {...insight} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SortableInsightsTable;
