import React from 'react';
import SortableInsightsTable from '../components/SortableInsightsTable';

const InsightsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Insights Table</h1>
      <SortableInsightsTable />
    </div>
  );
};

export default InsightsPage;
