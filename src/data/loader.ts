// src/data/loader.ts
import Papa from "papaparse";
import type { CanonicalRow } from "./schema";
import { buildHeaderMap, normalizeRow, missingRequiredFields } from "./schema";

/**
 * Parse a File (CSV) into CanonicalRow[].
 * (If you need XLSX too, add SheetJS and branch on file.type.)
 */
export async function parseFile(file: File): Promise<{ rows: CanonicalRow[]; meta: any }> {
  const text = await file.text();

  const parsed = Papa.parse<Record<string, any>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (parsed.errors?.length) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error at row ${first.row}: ${first.message}`);
  }

  const headers = parsed.meta.fields || [];
  const headerMap = buildHeaderMap(headers);
  const missing = missingRequiredFields(headers);

  const rows = (parsed.data || [])
    .map((raw) => normalizeRow(raw, headerMap))
    // keep rows with at least a household_id
    .filter((r) => r.household_id && r.household_id.length > 0);

  const meta = {
    totalRaw: parsed.data?.length || 0,
    totalKept: rows.length,
    headers,
    headerMap,
    missingRequired: missing,
    unmappedHeaders: headers.filter((h) => !(h in headerMap)),
  };

  return { rows, meta };
}
