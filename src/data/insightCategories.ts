// src/data/insightCategories.ts
export type InsightCategory =
  | "Growth Opportunities"
  | "Retention Radar"
  | "Service Drain"
  | "Risk & Claims"
  | "Data Quality";

export interface ComputedInsight {
  id: number;                 // 1..50
  title: string;              // "Umbrella Opportunity"
  household_id?: string;
  detection_date?: string;    // ISO date for when we "flag" it (default: renewal_date)
  monthKey?: string;          // derived "YYYY-MM" for aggregation
  category: InsightCategory;
  severity: "good" | "opportunity" | "warn" | "urgent";
}

export const INSIGHT_CATEGORY_MAP: Record<number, InsightCategory> = {
  1: "Growth Opportunities", // Bundling Gap
  2: "Growth Opportunities", // Coverage Depth Tier
  3: "Growth Opportunities", // Umbrella Opp
  4: "Risk & Claims",        // Water Backup Gap
  5: "Risk & Claims",        // Service Line Gap (risk mitigation)
  6: "Risk & Claims",        // Equip Breakdown
  7: "Risk & Claims",        // Roof Upgrade
  8: "Growth Opportunities", // Pet Injury
  9: "Growth Opportunities", // Key Fob
  10:"Risk & Claims",        // Refrigerated Products
  11:"Growth Opportunities",
  12:"Growth Opportunities",
  13:"Service Drain",        // High RL segment
  14:"Service Drain",
  15:"Retention Radar",      // Renewal No Review
  16:"Service Drain",
  17:"Service Drain",
  18:"Retention Radar",
  19:"Retention Radar",
  20:"Service Drain",
  21:"Service Drain",
  22:"Service Drain",
  23:"Service Drain",
  24:"Service Drain",
  25:"Service Drain",
  26:"Service Drain",
  27:"Service Drain",
  28:"Service Drain",
  29:"Service Drain",
  30:"Service Drain",
  31:"Retention Radar",      // Tenure Momentum negative
  32:"Retention Radar",
  33:"Retention Radar",
  34:"Risk & Claims",
  35:"Risk & Claims",
  36:"Risk & Claims",        // Experience Quality dip
  37:"Retention Radar",
  38:"Retention Radar",
  39:"Growth Opportunities",
  40:"Service Drain",
  41:"Service Drain",
  42:"Growth Opportunities",
  43:"Service Drain",
  44:"Retention Radar",
  45:"Service Drain",
  46:"Service Drain",
  47:"Service Drain",
  48:"Growth Opportunities", // Win rate after outreach
  49:"Data Quality",
  50:"Data Quality",
};

// Optional: score weights if you want intensity by category
export const SEVERITY_SCORE: Record<ComputedInsight["severity"], number> = {
  good: 0,
  opportunity: 1,
  warn: 2,
  urgent: 3,
};
