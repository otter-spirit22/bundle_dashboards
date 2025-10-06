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
    metric: "count of HH",
    fields: ["refrigerated_products_flag", "refrigerated_products_limit"],
    category: "Coverage & Endorsements",
    tags: ["Property", "Food"],
  },
  {
    id: 11,
    key: "home_umbrella_no_auto",
    title: "Home+Umbrella, No Auto",
    definition: "Easy cross-sell to complete classic trio.",
    flagLogic: "home_flag=1 AND umbrella_flag=1 AND auto_flag=0",
    metric: "count of HH",
    fields: ["home_flag", "umbrella_flag", "auto_flag"],
    category: "Growth Opportunities",
    tags: ["Cross-sell", "Bundle"],
  },
  {
    id: 12,
    key: "auto_umbrella_no_home",
    title: "Auto+Umbrella, No Home",
    definition: "Missing property line.",
    flagLogic: "auto_flag=1 AND umbrella_flag=1 AND home_flag=0",
    metric: "count of HH",
    fields: ["auto_flag", "umbrella_flag", "home_flag"],
    category: "Growth Opportunities",
    tags: ["Cross-sell", "Bundle"],
  },
  {
    id: 13,
    key: "high_rl_segment",
    title: "High RL Segment",
    definition: "Segment with RL above target.",
    flagLogic: "remarkets_12m/(remarkets_12m+1)×100 > 25",
    metric: "count of HH",
    fields: ["remarkets_12m", "segment_tier"],
    category: "Pricing & Appetite",
    tags: ["Remarket", "Segment"],
    benchmarkNote: "Target < 20–25 per 100 renewals.",
  },
  {
    id: 14,
    key: "chronic_remarketer",
    title: "Chronic Remarketer HH",
    definition: "HH remarketed ≥2 of last 3 cycles (needs event log).",
    flagLogic: "event log required",
    metric: "count of HH",
    fields: ["event_type", "event_ts", "household_id"],
    category: "Retention Radar",
    tags: ["Remarket", "Workflow"],
  },
  {
    id: 15,
    key: "renewal_no_review",
    title: "Renewal No Review Window",
    definition: "Renewals in next 30 days without recent review.",
    flagLogic: "daysUntil(renewal_date)<30 AND (daysSince(last_reviewed_date)>60 OR null)",
    metric: "count of HH",
    fields: ["renewal_date", "last_reviewed_date"],
    category: "Retention Radar",
    tags: ["Renewal", "Review"],
  },
  {
    id: 16,
    key: "producer_reshop_outlier",
    title: "Producer Re-shop Outlier",
    definition: "Producer with RL >150% agency avg for 2+ months.",
    flagLogic: "monthly RL by producer needed",
    metric: "list of producers",
    fields: ["producer", "remarkets_12m", "as_of_month"],
    category: "Producer & Office Performance",
    tags: ["Producer", "Remarket"],
  },
  {
    id: 17,
    key: "carrier_appetite_mismatch",
    title: "Carrier Appetite Mismatch",
    definition: "High RL concentrated on one carrier.",
    flagLogic: "carrier RL > 1.75 × agency RL",
    metric: "carrier list",
    fields: ["primary_carrier", "remarkets_12m"],
    category: "Pricing & Appetite",
    tags: ["Carrier", "Remarket"],
  },
  {
    id: 18,
    key: "late_bound_renewals",
    title: "Late-Bound Renewals",
    definition: "Policies bound within 3 days of renewal (event log).",
    flagLogic: "event log required",
    metric: "count of policies",
    fields: ["event_type", "bind_date", "renewal_date"],
    category: "Retention Radar",
    tags: ["Renewal", "Binding"],
  },
  {
    id: 19,
    key: "nonrenewal_early_warning",
    title: "Non-renewal Early Warning",
    definition: "HH with high churn risk and upcoming renewal.",
    flagLogic: "churn_risk_score_0_1≥0.7 AND daysUntil(renewal_date)<45",
    metric: "count of HH",
    fields: ["churn_risk_score_0_1", "renewal_date"],
    category: "Retention Radar",
    tags: ["Churn", "Renewal"],
  },
  {
    id: 20,
    key: "remarketing_reason_pareto",
    title: "Remarketing Reason Pareto",
    definition: "Top 3 reasons drive 80% of remarkets.",
    flagLogic: "rank remarket_reason counts; show top 3",
    metric: "reason: share%",
    fields: ["remarket_reason"],
    category: "Pricing & Appetite",
    tags: ["Remarket", "Pareto"],
  },
  {
    id: 21,
    key: "high_minutes_hh",
    title: "High Minutes HH",
    definition: "HH in top decile of service minutes.",
    flagLogic: "P90(service_touches_12m×avg_minutes_per_touch)",
    metric: "count of HH",
    fields: ["service_touches_12m", "avg_minutes_per_touch"],
    category: "Service Drain",
    tags: ["AHT", "Service Load"],
  },
  {
    id: 22,
    key: "channel_cost_overweight",
    title: "Channel Cost Overweight",
    definition: "Channel with minutes/touch > benchmark.",
    flagLogic: "mean(minutes/touch by channel) > mean(all)",
    metric: "channel list",
    fields: ["service_channel", "avg_minutes_per_touch"],
    category: "Service Drain",
    tags: ["Channel", "AHT"],
  },
  {
    id: 23,
    key: "poi_drain",
    title: "Proof of Insurance Drain",
    definition: "High minutes on ID card/COI requests (event log).",
    flagLogic: "event log required",
    metric: "count or minutes",
    fields: ["event_type", "minutes_spent"],
    category: "Service Drain",
    tags: ["Workflow"],
  },
  {
    id: 24,
    key: "billing_time_sink",
    title: "Billing & Payments Time Sink",
    definition: "High minutes on billing issues (event log).",
    flagLogic: "event log required",
    metric: "minutes",
    fields: ["event_type", "minutes_spent"],
    category: "Service Drain",
    tags: ["Billing"],
  },
  {
    id: 25,
    key: "claim_followup_burden",
    title: "Claim Follow-up Burden",
    definition: "Minutes spent on claim follow-ups above threshold.",
    flagLogic: "event log required",
    metric: "minutes",
    fields: ["event_type", "minutes_spent"],
    category: "Service Drain",
    tags: ["Claims"],
  },
  {
    id: 26,
    key: "unbundled_overhead",
    title: "Unbundled Overhead",
    definition: "Extra minutes from cross-carrier admin for splits.",
    flagLogic: "bundled_flag=0; compare minutes vs bundled HH",
    metric: "avg min/HH",
    fields: ["bundled_flag", "service_touches_12m", "avg_minutes_per_touch"],
    category: "Service Drain",
    tags: ["Bundle", "AHT"],
  },
  {
    id: 27,
    key: "csr_load_imbalance",
    title: "CSR Load Imbalance",
    definition: "One CSR’s book consumes ≥30% more minutes/HH than median.",
    flagLogic: "CSR minutes per HH vs median (event log or CSR column)",
    metric: "CSR list",
    fields: ["csr", "service_touches_12m", "avg_minutes_per_touch"],
    category: "Producer & Office Performance",
    tags: ["CSR", "Workload"],
  },
  {
    id: 28,
    key: "fcr_gap",
    title: "First-Contact Resolution Gap",
    definition: "Multi-touch service threads where 1-touch should suffice.",
    flagLogic: "event log required",
    metric: "% 1-touch",
    fields: ["thread_id", "touch_count", "event_type"],
    category: "Service Drain",
    tags: ["FCR", "Workflow"],
  },
  {
    id: 29,
    key: "aht_outlier",
    title: "AHT Outlier",
    definition: "AHT (avg min/touch) in top decile.",
    flagLogic: "avg_minutes_per_touch ≥ P90(AHT)",
    metric: "count of HH",
    fields: ["avg_minutes_per_touch"],
    category: "Service Drain",
    tags: ["AHT"],
  },
  {
    id: 30,
    key: "self_service_uptake",
    title: "Self-Service Uptake",
    definition: "Share of portal/email vs phone.",
    flagLogic: "channel mix; Portal share%",
    metric: "Portal: share%",
    fields: ["service_channel"],
    category: "Service Drain",
    tags: ["Channel", "Self-Service"],
  },
  {
    id: 31,
    key: "tenure_momentum_negative",
    title: "Tenure Momentum Negative",
    definition: "MoM avg tenure decreasing.",
    flagLogic: "Δ avg(tenure_years) MoM < 0",
    metric: "Positive/Negative",
    fields: ["tenure_years", "as_of_month"],
    category: "Retention Radar",
    tags: ["Tenure", "Trend"],
  },
  {
    id: 32,
    key: "low_tenure_high_depth_risk",
    title: "Low Tenure, High Depth Risk",
    definition: "Newer HH with ≥2 lines but high churn risk.",
    flagLogic: "tenure_years<2 AND lines_count≥2 AND churn_risk≥0.6",
    metric: "count of HH",
    fields: ["tenure_years", "lines_count", "churn_risk_score_0_1"],
    category: "Retention Radar",
    tags: ["Churn", "Depth"],
  },
  {
    id: 33,
    key: "retention_weak_signal",
    title: "Retention Weak Signal",
    definition: "Prior term not retained.",
    flagLogic: "retained_last_term_flag=0",
    metric: "% not retained",
    fields: ["retained_last_term_flag"],
    category: "Retention Radar",
    tags: ["Retention"],
  },
  {
    id: 34,
    key: "claims_backlog",
    title: "Claims Backlog",
    definition: "Open claims per HH exceeds threshold.",
    flagLogic: "claims_open_count per HH > 0.2 (benchmarkable)",
    metric: "open claims/HH",
    fields: ["claims_open_count"],
    category: "Retention Radar",
    tags: ["Claims"],
  },
  {
    id: 35,
    key: "high_claim_freq_cohort",
    title: "High Claim Frequency Cohort",
    definition: "Segment with higher claims_closed_12m/HH.",
    flagLogic: "segment mean > 1.5 × agency mean",
    metric: "segment list",
    fields: ["segment_tier", "claims_closed_12m"],
    category: "Retention Radar",
    tags: ["Claims", "Segment"],
  },
  {
    id: 36,
    key: "experience_quality_dip",
    title: "Experience Quality Dip",
    definition: "EQ proxy falling (open claims up, closed claims down).",
    flagLogic: "mean(open) > mean(closed_12m)",
    metric: "Dip/Stable",
    fields: ["claims_open_count", "claims_closed_12m"],
    category: "Retention Radar",
    tags: ["Claims", "EQ"],
  },
  {
    id: 37,
    key: "review_freshness_gap",
    title: "Review Freshness Gap",
    definition: "HH not reviewed in > 12 months.",
    flagLogic: "last_reviewed_date < today−365d OR null",
    metric: "count of HH",
    fields: ["last_reviewed_date"],
    category: "Retention Radar",
    tags: ["Review", "Workflow"],
  },
  {
    id: 38,
    key: "churn_risk_hot_list",
    title: "Churn Risk Hot List",
    definition: "Top decile churn risk approaching renewal.",
    flagLogic: "churn ≥ P90 AND daysUntil(renewal)<60",
    metric: "count of HH",
    fields: ["churn_risk_score_0_1", "renewal_date"],
    category: "Retention Radar",
    tags: ["Churn", "Renewal"],
  },
  {
    id: 39,
    key: "account_value_underweighted",
    title: "Account Value Underweighted",
    definition: "High premium accounts with shallow depth.",
    flagLogic: "written_premium_total ≥ P75 AND lines_count=1",
    metric: "count of HH",
    fields: ["written_premium_total", "lines_count"],
    category: "Growth Opportunities",
    tags: ["Depth", "Premium"],
  },
  {
    id: 40,
    key: "commission_efficiency",
    title: "Commission Efficiency",
    definition: "Commission per service minute.",
    flagLogic:
      "(written_premium_total×commission_rate_pct/100) ÷ (service_touches_12m×avg_minutes_per_touch)",
    metric: "$/minute",
    fields: [
      "written_premium_total",
      "commission_rate_pct",
      "service_touches_12m",
      "avg_minutes_per_touch",
    ],
    category: "Revenue & Efficiency",
    tags: ["Commission", "Efficiency"],
  },
  {
    id: 41,
    key: "remarketing_roi",
    title: "Remarketing ROI",
    definition: "Net gain from remarkets vs time spent.",
    flagLogic:
      "est_minutes_per_remarket×1.25 > written_premium_total×0.01 (example rule)",
    metric: "count of HH",
    fields: ["est_minutes_per_remarket", "written_premium_total"],
    category: "Revenue & Efficiency",
    tags: ["Remarket", "ROI"],
  },
  {
    id: 42,
    key: "discount_leakage",
    title: "Discount Leakage",
    definition: "Eligible discounts not applied.",
    flagLogic: "bundle_discount_flag=0 OR safe_driver_flag=0",
    metric: "count of HH",
    fields: ["bundle_discount_flag", "safe_driver_flag"],
    category: "Revenue & Efficiency",
    tags: ["Discounts"],
  },
  {
    id: 43,
    key: "carrier_mix_concentration",
    title: "Carrier Mix Concentration",
    definition: "Over-reliance on one carrier > 45%.",
    flagLogic: "carrier share% > 45",
    metric: "carrier list",
    fields: ["primary_carrier"],
    category: "Pricing & Appetite",
    tags: ["Carrier", "Concentration"],
  },
  {
    id: 44,
    key: "rate_shock_sensitivity",
    title: "Rate Shock Sensitivity",
    definition: "Accounts with high rate-change likelihood.",
    flagLogic:
      "(churn_risk≥0.6 OR remarkets_12m≥1) AND daysUntil(renewal)<60",
    metric: "count of HH",
    fields: ["churn_risk_score_0_1", "remarkets_12m", "renewal_date"],
    category: "Pricing & Appetite",
    tags: ["Pricing", "Churn", "Renewal"],
  },
  {
    id: 45,
    key: "producer_depth_delta",
    title: "Producer Depth Delta",
    definition: "Producer’s depth vs agency average.",
    flagLogic: "producer avg(lines_count≥2) vs agency avg",
    metric: "producer list",
    fields: ["producer", "lines_count"],
    category: "Producer & Office Performance",
    tags: ["Producer", "Depth"],
  },
  {
    id: 46,
    key: "producer_tbn_opportunity",
    title: "Producer TBN Opportunity",
    definition: "Hours reclaimable from Top-N splits.",
    flagLogic: "producer splits + minutes delta model",
    metric: "hours",
    fields: [
      "producer",
      "bundled_flag",
      "service_touches_12m",
      "avg_minutes_per_touch",
      "remarkets_12m",
      "est_minutes_per_remarket",
    ],
    category: "Producer & Office Performance",
    tags: ["Producer", "Time-Back"],
  },
  {
    id: 47,
    key: "office_rl_outlier",
    title: "Office RL Outlier",
    definition: "Office RL exceeds agency by 50%+ for 2 months.",
    flagLogic: "office mean RL > 1.5 × agency mean",
    metric: "office list",
    fields: ["office_location", "remarkets_12m", "as_of_month"],
    category: "Producer & Office Performance",
    tags: ["Office", "Remarket"],
  },
  {
    id: 48,
    key: "win_rate_after_outreach",
    title: "Win Rate After Outreach",
    definition: "Conversion after Top-N outreach (event log).",
    flagLogic: "event log required",
    metric: "win rate %",
    fields: ["outreach_id", "result", "timestamp"],
    category: "Revenue & Efficiency",
    tags: ["Outreach", "Conversion"],
  },
  {
    id: 49,
    key: "data_confidence_gap",
    title: "Data Confidence Gap",
    definition:
      "Rows with data_confidence below threshold or key nulls.",
    flagLogic:
      "data_confidence<0.7 OR missing(renewal_date|lines_count|avg_minutes_per_touch)",
    metric: "count of rows",
    fields: [
      "data_confidence",
      "renewal_date",
      "lines_count",
      "avg_minutes_per_touch",
    ],
    category: "Data Quality",
    tags: ["Quality"],
  },
  {
    id: 50,
    key: "template_compliance",
    title: "Template Compliance",
    definition: "Missing required headers or invalid types.",
    flagLogic:
      "required headers present: household_id, tenure_years, lines_count, bundled_flag, renewal_date, service_touches_12m, avg_minutes_per_touch, remarkets_12m, est_minutes_per_remarket",
    metric: "PASS / Missing: fields",
    fields: [
      "household_id",
      "tenure_years",
      "lines_count",
      "bundled_flag",
      "renewal_date",
      "service_touches_12m",
      "avg_minutes_per_touch",
      "remarkets_12m",
      "est_minutes_per_remarket",
    ],
    category: "Data Quality",
    tags: ["Quality", "Template"],
  },
];

// -------------------------
// Filter options & helper
// -------------------------
export const TAG_OPTIONS: string[] = Array.from(
  new Set(
    INSIGHTS_50.flatMap(i => i.tags ?? [])
  )
).sort();

export const FILTER_OPTIONS = {
  categories: CATEGORIES.filter(c => c !== "Core Scorecard"),
  tags: TAG_OPTIONS,
};

export type InsightFilter = {
  category?: Category | "All";
  tags?: string[]; // include if any tag matches
  query?: string;  // fuzzy search in title/definition
};

export function filterInsights(
  filter: InsightFilter = {}
): Insight[] {
  const { category = "All", tags = [], query = "" } = filter;
  const q = query.trim().toLowerCase();

  return INSIGHTS_50.filter((ins) => {
    const byCategory =
      category === "All" ? true : ins.category === category;

    const byTags =
      !tags.length
        ? true
        : (ins.tags ?? []).some(t => tags.includes(t));

    const byQuery =
      !q
        ? true
        : ins.title.toLowerCase().includes(q) ||
          ins.definition.toLowerCase().includes(q) ||
          ins.key.toLowerCase().includes(q);

    return byCategory && byTags && byQuery;
  });
}
