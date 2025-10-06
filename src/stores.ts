// src/data/store.ts
import React from "react";

export type HouseholdRow = Record<string, any>;
export type UploadedData = { rows: HouseholdRow[] };

type StoreState = {
  data: UploadedData | null;
  insights: HeatmapInsight[];               // from the heatmap file’s types
  setData: (d: UploadedData) => void;
  setInsights: (ins: HeatmapInsight[]) => void;
};

export const DataCtx = React.createContext<StoreState>({
  data: null, insights: [], setData: () => {}, setInsights: () => {},
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<UploadedData | null>(null);
  const [insights, setInsights] = React.useState<HeatmapInsight[]>([]);
  const value = React.useMemo(() => ({ data, insights, setData, setInsights }), [data, insights]);
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useDataStore() {
  return React.useContext(DataCtx);
}
