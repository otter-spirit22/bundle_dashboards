// src/data/schema.ts

/** Canonical field names your app understands everywhere */
export type CanonicalRow = {
  household_id: string;
  name?: string;
  email?: string;

  // product flags
  home_flag?: number;       // 0/1
  auto_flag?: number;       // 0/1
  umbrella_flag?: number;   // 0/1

  // coverage / features
  lines_count?: number;
  bundled_flag?: number;
  bundle_discount_flag?: number;
  safe_driver_flag?: number;
  water_backup_limit?: number;
  service_line_coverage_limit?: number;
  equipment_breakdown_flag?: number;
  key_fob_replacement_flag?: number;
  refrigerated_products_flag?: number;
  refrigerated_products_limit?: number;
  roof_surfacing_loss_settlement?: number;

  // dates
  renewal_date?: string;         // ISO
  last_reviewed_date?: string;   // ISO

  // service / ops
  service_touches_12m?: number;
  avg_minutes_per_touch?: number;
  est_minutes_per_remarket?: number;
  remarkets_12m?: number;
  remarket_reason?: string;
  service_channel?: string;      // Phone/Email/Portal etc.
  claims_open_count?: number;
  claims_closed_12m?: number;

  // economics
  written_premium_total?: number;
  commission_rate_pct?: number;

  // metadata
  tenure_years?: number;
  retained_last_term_flag?: number;
  primary_carrier?: string;
  secondary_carrier_optional?: string;
  segment_tier?: string;
  office_location?: string;
  data_confidence?: number;      // 0..1
  churn_risk_score_0_1?: number;

  // optional: future filter on Producer page
  service_manager?: string;
};

/** Required columns to consider the row usable */
export const REQUIRED_FIELDS: (keyof CanonicalRow)[] = [
  "household_id",
  "lines_count",
  "renewal_date",
  "service_touches_12m",
  "avg_minutes_per_touch",
  "remarkets_12m",
  "est_minutes_per_remarket",
];

/** Aliases — add any header variants you expect from carriers/AMS/exports */
export const FIELD_ALIASES: Record<keyof CanonicalRow, string[]> = {
  household_id: ["household_id", "hh_id", "account_id", "customer_id", "policyholder_id"],
  name: ["name", "insured_name", "household_name", "client_name"],
  email: ["email", "email_address", "primary_email"],

  home_flag: ["home_flag", "home", "has_home", "home_policy_flag"],
  auto_flag: ["auto_flag", "auto", "has_auto", "auto_policy_flag"],
  umbrella_flag: ["umbrella_flag", "umbrella", "has_umbrella"],

  lines_count: ["lines_count", "num_lines", "lines"],
  bundled_flag: ["bundled_flag", "is_bundled", "bundle_flag"],
  bundle_discount_flag: ["bundle_discount_flag", "bundle_discount", "bundle_disc_flag"],
  safe_driver_flag: ["safe_driver_flag", "safe_driver", "safe_driver_disc_flag"],
  water_backup_limit: ["water_backup_limit", "water_backup", "water_backup_$"],
  service_line_coverage_limit: ["service_line_coverage_limit", "service_line_limit", "service_line_$"],
  equipment_breakdown_flag: ["equipment_breakdown_flag", "equip_breakdown", "equipment_breakdown"],
  key_fob_replacement_flag: ["key_fob_replacement_flag", "key_fob_flag", "key_fob"],
  refrigerated_products_flag: ["refrigerated_products_flag", "fridge_products_flag", "food_spoilage_flag"],
  refrigerated_products_limit: ["refrigerated_products_limit", "fridge_products_limit", "food_spoilage_$"],
  roof_surfacing_loss_settlement: ["roof_surfacing_loss_settlement", "roof_upgrade_flag", "roof_upgrade"],

  renewal_date: ["renewal_date", "policy_renewal_date", "next_renewal"],
  last_reviewed_date: ["last_reviewed_date", "reviewed_on", "last_policy_review"],

  service_touches_12m: ["service_touches_12m", "service_touches", "touches_12m"],
  avg_minutes_per_touch: ["avg_minutes_per_touch", "aht_min", "avg_minutes_touch"],
  est_minutes_per_remarket: ["est_minutes_per_remarket", "remarket_minutes_est", "minutes_per_remarket_est"],
  remarkets_12m: ["remarkets_12m", "remarkets", "remarketed_count_12m"],
  remarket_reason: ["remarket_reason", "remarket_reason_primary", "remarket_reason_code"],
  service_channel: ["service_channel", "channel", "primary_channel", "contact_channel"],
  claims_open_count: ["claims_open_count", "open_claims", "claims_open"],
  claims_closed_12m: ["claims_closed_12m", "claims_closed", "closed_claims_12m"],

  written_premium_total: ["written_premium_total", "written_premium", "wp_total"],
  commission_rate_pct: ["commission_rate_pct", "commission_pct", "commission_rate"],

  tenure_years: ["tenure_years", "tenure", "years_with_agency"],
  retained_last_term_flag: ["retained_last_term_flag", "retained_last_term", "retained_flag"],
  primary_carrier: ["primary_carrier", "carrier", "main_carrier"],
  secondary_carrier_optional: ["secondary_carrier_optional", "secondary_carrier", "other_carrier"],
  segment_tier: ["segment_tier", "segment", "tier"],
  office_location: ["office_location", "office", "location"],
  data_confidence: ["data_confidence", "confidence", "data_confidence_0_1"],
  churn_risk_score_0_1: ["churn_risk_score_0_1", "churn_score", "churn_risk"],

  service_manager: ["service_manager", "Service Manager", "csr", "CSR", "account_mgr", "account_manager"],
};

/** Helpers */
const toNum = (v: any): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? undefined : n;
};
const to01 = (v: any): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const s = String(v).toLowerCase().trim();
  if (["1", "y", "yes", "true", "t"].includes(s)) return 1;
  if (["0", "n", "no", "false", "f"].includes(s)) return 0;
  const n = Number(s);
  return isNaN(n) ? undefined : n ? 1 : 0;
};
const toISO = (v: any): string | undefined => {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
};

/** Build header->canonical map once per file */
export function buildHeaderMap(headers: string[]): Record<string, keyof CanonicalRow> {
  const norm = (s: string) => s.trim().toLowerCase();
  const map: Record<string, keyof CanonicalRow> = {};
  headers.forEach((h) => {
    const key = norm(h);
    (Object.keys(FIELD_ALIASES) as (keyof CanonicalRow)[]).some((canon) => {
      const hit = FIELD_ALIASES[canon].map(norm).includes(key);
      if (hit) {
        map[h] = canon;
        return true;
      }
      return false;
    });
  });
  return map;
}

/** Convert a raw CSV/Excel row to a CanonicalRow */
export function normalizeRow(raw: Record<string, any>, headerMap: Record<string, keyof CanonicalRow>): CanonicalRow {
  const out: Partial<CanonicalRow> = {};

  for (const [rawKey, val] of Object.entries(raw)) {
    const canon = headerMap[rawKey];
    if (!canon) continue;

    switch (canon) {
      // strings
      case "household_id":
      case "name":
      case "email":
      case "remarket_reason":
      case "service_channel":
      case "primary_carrier":
      case "secondary_carrier_optional":
      case "segment_tier":
      case "office_location":
      case "service_manager":
        out[canon] = String(val ?? "").trim();
        break;

      // booleans/flags -> 0/1
      case "home_flag":
      case "auto_flag":
      case "umbrella_flag":
      case "bundled_flag":
      case "bundle_discount_flag":
      case "safe_driver_flag":
      case "equipment_breakdown_flag":
      case "key_fob_replacement_flag":
      case "refrigerated_products_flag":
      case "roof_surfacing_loss_settlement":
      case "retained_last_term_flag":
        out[canon] = to01(val);
        break;

      // numbers
      case "lines_count":
      case "water_backup_limit":
      case "service_line_coverage_limit":
      case "refrigerated_products_limit":
      case "service_touches_12m":
      case "avg_minutes_per_touch":
      case "est_minutes_per_remarket":
      case "remarkets_12m":
      case "claims_open_count":
      case "claims_closed_12m":
      case "written_premium_total":
      case "commission_rate_pct":
      case "tenure_years":
      case "data_confidence":
      case "churn_risk_score_0_1":
        out[canon] = toNum(val);
        break;

      // dates
      case "renewal_date":
      case "last_reviewed_date":
        out[canon] = toISO(val);
        break;
    }
  }

  // Make sure household_id is always a string
  if (out.household_id === undefined || out.household_id === "") {
    // Try to synthesize one to avoid dropping the row
    out.household_id = String(
      raw["household_id"] ??
      raw["hh_id"] ??
      raw["account_id"] ??
      raw["customer_id"] ??
      raw["policyholder_id"] ??
      ""
    ).trim();
  }

  return out as CanonicalRow;
}

/** Validate presence of required fields; return missing list */
export function missingRequiredFields(headers: string[]): string[] {
  const lower = headers.map((h) => h.toLowerCase());
  const has = (canon: keyof CanonicalRow) =>
    FIELD_ALIASES[canon].some((a) => lower.includes(a.toLowerCase()));

  return REQUIRED_FIELDS.filter((f) => !has(f)).map(String);
}
