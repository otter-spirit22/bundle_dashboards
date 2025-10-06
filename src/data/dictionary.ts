// src/data/dataDictionary.ts
export type Category =
  | "Core Scorecard"
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Revenue & Efficiency"
  | "Pricing & Appetite"
  | "Producer & Office Performance"
  | "Coverage & Endorsements"
  | "Data Quality";

export type CoreMetric = {
  key: string;
  title: string;
  definition: string;
  formula: string;
  fields: string[];
};

export type Insight = {
  id: number;
  key: string;
  title: string;
  definition: string;
  flagLogic: string;
  metric: string;
  fields: string[];
  category: Category;
};

export const CATEGORIES: Category[] = [
  "Growth Opportunities",
  "Retention Radar",
  "Service Drain",
  "Revenue & Efficiency",
  "Pricing & Appetite",
  "Producer & Office Performance",
  "Coverage & Endorsements",
  "Data Quality",
  "Core Scorecard",
];

// --- Core Scorecard (from your brief) ---
export const CORE_METRICS: CoreMetric[] = [
  {
    key: "coverage_depth",
    title: "Coverage Depth",
    definition:
      "% households with lines_count ≥ 2 (bundle proxy). Higher is healthier.",
    formula: "count(lines_count ≥ 2) / total_households × 100",
    fields: ["lines_count"],
  },
  {
    key: "remarketing_load",
    title: "Remarketing Load",
    definition:
      "remarkets ÷ renewals × 100. Lower is better (less drag on the team).",
    formula: "remarkets_12m / renewals_12m × 100",
    fields: ["remarkets_12m", "renewals_12m"],
  },
  {
    key: "service_touch_index",
    title: "Service Touch Index",
    definition: "Minutes per household per year.",
    formula: "service_touches_12m × avg_minutes_per_touch",
    fields: ["service_touches_12m", "avg_minutes_per_touch"],
  },
  {
    key: "tenure_momentum",
    title: "Tenure Momentum",
    definition: "Average tenure_years and its MoM trend; depth-weighted.",
    formula:
      "Δ avg(tenure_years) month-over-month (weighted by lines_count ≥ 2)",
    fields: ["tenure_years", "lines_count", "as_of_month"],
  },
  {
    key: "benchscore",
    title: "BenchScore™",
    definition:
      "0–100 composite of bundling rate, remarketing load, service minutes, tenure, and experience quality.",
    formula:
      "w1*BR + w2*(100–RL) + w3*(100–STI_norm) + w4*Tenure_norm + w5*EQ_norm",
    fields: [
      "bundled_flag",
      "remarkets_12m",
      "service_touches_12m",
      "avg_minutes_per_touch",
      "tenure_years",
      "claims_open_count",
      "claims_closed_12m",
    ],
  },
];

// --- Insights-50 (starter set). Add the remainder as you go. ---
export const INSIGHTS_50: Insight[] = [
  {
    id: 1,
    key: "bundling_gap",
    title: "Bundling Gap",
    definition:
      "HH has home & auto but different carriers, or only one eligible line.",
    flagLogic:
      "(home_flag=1 AND auto_flag=1 AND primary_carrier≠secondary_carrier) OR (home_flag+auto_flag=1)",
    metric: "count of households",
    fields: ["home_flag", "auto_flag", "primary_carrier", "secondary_carrier_optional"],
    category: "Growth Opportunities",
  },
  {
    id: 2,
    key: "coverage_depth_tier",
    title: "Coverage Depth Tier",
    definition:
      "Classifies HH by lines_count: 1=shallow, 2=core, ≥3=deep.",
    flagLogic: "lines_count buckets",
    metric: "% shallow/core/deep",
    fields: ["lines_count"],
    category: "Coverage & Endorsements",
  },
  {
    id: 3,
    key: "umbrella_opportunity",
    title: "Umbrella Opportunity",
    definition: "Suitable HH without umbrella.",
    flagLogic:
      "umbrella_flag=0 AND (home_flag=1 OR auto_flag=1) AND segment_tier∉{bronze}",
    metric: "count of households",
    fields: ["umbrella_flag", "home_flag", "auto_flag", "segment_tier"],
    category: "Growth Opportunities",
  },
  {
    id: 4,
    key: "water_backup_gap",
    title: "Water Backup Gap",
    definition: "HH lacks water backup coverage.",
    flagLogic: "water_backup_limit is null OR = 0",
    metric: "count of households",
    fields: ["water_backup_limit"],
    category: "Coverage & Endorsements",
  },
  {
    id: 5,
    key: "service_line_gap",
    title: "Service Line Gap",
    definition: "Missing service line coverage.",
    flagLogic: "service_line_coverage_limit is null OR = 0",
    metric: "count of households",
    fields: ["service_line_coverage_limit"],
    category: "Coverage & Endorsements",
  },
  {
    id: 6,
    key: "equipment_breakdown_gap",
    title: "Equipment Breakdown Gap",
    definition: "No equipment breakdown endorsement.",
    flagLogic: "equipment_breakdown_flag = 0",
    metric: "count of households",
    fields: ["equipment_breakdown_flag"],
    category: "Coverage & Endorsements",
  },
  {
    id: 7,
    key: "roof_upgrade_gap",
    title: "Roof Upgrade Gap",
    definition: "Roof upgrade not present where carrier offers.",
    flagLogic: "roof_surfacing_loss_settlement = 0",
    metric: "count of households",
    fields: ["roof_surfacing_loss_settlement"],
    category: "Coverage & Endorsements",
  },
  {
    id: 8,
    key: "pet_injury_gap",
    title: "Pet Injury Gap (Auto)",
    definition: "Auto HH without pet injury.",
    flagLogic: "auto_flag=1 AND pet_injury_flag=0",
    metric: "count of auto HH",
    fields: ["auto_flag", "pet_injury_flag"],
    category: "Coverage & Endorsements",
  },
  {
    id: 9,
    key: "key_fob_gap",
    title: "Key Fob Replacement Gap",
    definition: "HH lacks key fob coverage add-on.",
    flagLogic: "key_fob_replacement_flag=0",
    metric: "count of households",
    fields: ["key_fob_replacement_flag"],
    category: "Coverage & Endorsements",
  },
  {
    id: 10,
    key: "refrigerated_products_gap",
    title: "Refrigerated Products Coverage Gap",
    definition: "HH lacks food spoilage coverage.",
    flagLogic: "refrigerated_products_flag=0 OR refrigerated_products_limit=0",
    metric: "count of households",
    fields: ["refrigerated_products_flag", "refrigerated_products_limit"],
    category: "Coverage & Endorsements",
  },
  // 👉 Continue adding 11–50 here using the titles/logic you already wrote.
];
