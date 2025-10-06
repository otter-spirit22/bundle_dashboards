// src/pages/Household.tsx
import { useSearchParams } from "react-router-dom";
import { useDataStore } from "@/data/store";

export default function Household() {
  const [sp] = useSearchParams();
  const hh = sp.get("id") || sp.get("hh");
  const { data } = useDataStore();
  const row = data?.rows.find(r => String(r.household_id)===String(hh));
  if (!row) return <div className="p-6">Household not found.</div>;
  return (
    <div className="p-6 space-y-2">
      <h1 className="text-xl font-bold">Household {hh}</h1>
      <pre className="text-xs bg-black/20 p-3 rounded">{JSON.stringify(row,null,2)}</pre>
    </div>
  );
}
